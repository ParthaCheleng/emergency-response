"""
Emergency Response Commander AI — FastAPI Backend
==================================================

Production-grade API server that orchestrates crisis response sessions.
Receives emergency events from the dashboard, dispatches them to a CrewAI
multi-agent pipeline, and persists every state transition in Supabase so
the Next.js frontend can poll for live updates.

Author : Emergency Response Commander Team
Created: 2026-07-04
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from supabase import create_client, Client
from scenario_engine import get_random_scenario, infer_disaster_type_from_text

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
CREWAI_WEBHOOK_URL: str = os.getenv("CREWAI_WEBHOOK_URL", "")
CREWAI_BEARER_TOKEN: str = os.getenv("CREWAI_BEARER_TOKEN", "")

# Path to the mock response JSON used as a fallback when CrewAI is
# unreachable or during local development.
MOCK_RESPONSE_PATH: Path = Path(__file__).resolve().parent.parent / "mock_response.json"

# CrewAI can take a very long time; give it a generous timeout.
CREWAI_TIMEOUT_SECONDS: int = 120

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("emergency_api")

# ---------------------------------------------------------------------------
# Supabase client (module-level singleton)
# ---------------------------------------------------------------------------

supabase: Client | None = None


def get_supabase() -> Client:
    """Return the initialised Supabase client, or raise if not ready."""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env"
            )
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("Supabase client initialised for %s", SUPABASE_URL)
    return supabase


# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------


class InjectEventRequest(BaseModel):
    """Body for the POST /api/inject-event endpoint."""

    session_id: str = Field(..., description="UUID of the crisis session")
    event_text: str = Field(
        ..., min_length=1, description="Free-text description of the crisis event"
    )
    disaster_type: Optional[str] = Field(
        None, description="Optional disaster category (earthquake, flood, grid, hazmat, hurricane, cyber)"
    )


class InjectEventResponse(BaseModel):
    """Immediate acknowledgement returned by POST /api/inject-event."""

    status: str = "processing"
    session_id: str


class SessionCreateResponse(BaseModel):
    """Response for POST /api/session."""

    session_id: str
    status: str = "IDLE"


class MockCompleteRequest(BaseModel):
    """Body for the POST /api/mock-complete endpoint."""

    session_id: str = Field(..., description="UUID of the crisis session to populate")
    disaster_type: Optional[str] = Field(
        None, description="Optional disaster category"
    )


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str = "operational"
    service: str = "emergency-response-commander-api"


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Verify external connections on startup and clean up on shutdown."""
    # --- STARTUP ---
    logger.info("🚀 Emergency Response Commander API starting up …")

    # Verify Supabase connectivity
    try:
        client = get_supabase()
        # A lightweight query to verify the connection is alive
        client.table("crisis_sessions").select("id").limit(1).execute()
        logger.info("✅ Supabase connection verified")
    except Exception as exc:
        logger.warning(
            "⚠️  Supabase connection check failed — the server will still start, "
            "but database calls may fail: %s",
            exc,
        )

    # Verify mock response file exists
    if MOCK_RESPONSE_PATH.exists():
        logger.info("✅ Mock response file found at %s", MOCK_RESPONSE_PATH)
    else:
        logger.warning(
            "⚠️  Mock response file NOT found at %s — mock fallback will not work",
            MOCK_RESPONSE_PATH,
        )

    yield  # ---- application runs here ----

    # --- SHUTDOWN ---
    logger.info("🛑 Emergency Response Commander API shutting down …")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Emergency Response Commander API",
    description=(
        "Orchestration backend for the Emergency Response Commander AI system. "
        "Manages crisis sessions, dispatches events to the CrewAI multi-agent "
        "pipeline, and persists results in Supabase."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dashboard and Vercel preview deployments
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https://ai-emergency.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _utc_now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


def _load_mock_response(disaster_type: Optional[str] = None) -> dict[str, Any]:
    """Load and return dynamic scenario from scenario_engine, or static fallback."""
    try:
        data = get_random_scenario(disaster_type)
        logger.info("Loaded dynamic scenario from engine for track: %s", data.get("disaster_type"))
        return data
    except Exception as exc:
        logger.error("Failed to load dynamic scenario: %s — falling back to static mock", exc)
        try:
            with open(MOCK_RESPONSE_PATH, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            return {
                "emergency_level": "UNKNOWN",
                "timeline": [],
                "agent_chatter": [],
                "action_plan": [],
            }


def _parse_crewai_response(raw: Any) -> dict[str, Any]:
    """
    Defensively parse a CrewAI webhook response into the fields expected
    by the dashboard.

    CrewAI may return data in different wrapper shapes depending on the
    version; this function normalises everything.
    """
    # If raw is a string, try to JSON-decode it
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("CrewAI response is a non-JSON string — using mock")
            return _load_mock_response()

    # If it's still not a dict at this point, fall back
    if not isinstance(raw, dict):
        logger.warning("CrewAI response is not a dict — using mock")
        return _load_mock_response()

    # CrewAI sometimes wraps the real payload under a "result" or "output" key
    payload: dict[str, Any] = raw
    for wrapper_key in ("result", "output", "data"):
        if wrapper_key in raw and isinstance(raw[wrapper_key], dict):
            payload = raw[wrapper_key]
            break

    # If the payload itself is a JSON-string, decode once more
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            pass

    if not isinstance(payload, dict):
        logger.warning("Could not unwrap CrewAI payload — using mock")
        return _load_mock_response()

    return {
        "emergency_level": payload.get("emergency_level", "UNKNOWN"),
        "timeline": payload.get("timeline", []),
        "agent_chatter": payload.get("agent_chatter", []),
        "action_plan": payload.get("action_plan", []),
    }


# ---------------------------------------------------------------------------
# Background task — the heavy lifting happens here
# ---------------------------------------------------------------------------


async def _process_crisis_event(
    session_id: str, event_text: str, disaster_type: Optional[str] = None
) -> None:
    """
    Background task that:
    1. Checks if disaster_type is provided or inferred. If so, immediately uses the dynamic Scenario Engine.
    2. Otherwise, calls the CrewAI webhook with the crisis event report.
    3. Updates the Supabase session row with results (or dynamic/mock data on failure).
    """
    db = get_supabase()
    now = _utc_now_iso()
    parsed: dict[str, Any] | None = None

    # Infer disaster_type from keywords if not explicitly passed
    if not disaster_type:
        disaster_type = infer_disaster_type_from_text(event_text)

    if disaster_type:
        logger.info(
            "Disaster category '%s' intercepted for session %s — generating dynamic scenario from CRISIS_MATRIX",
            disaster_type,
            session_id,
        )
        parsed = _load_mock_response(disaster_type)
    else:
        try:
            logger.info(
                "Dispatching event to CrewAI for session %s …", session_id
            )

            async with httpx.AsyncClient(
                timeout=httpx.Timeout(CREWAI_TIMEOUT_SECONDS)
            ) as client:
                response = await client.post(
                    CREWAI_WEBHOOK_URL,
                    headers={
                        "Authorization": f"Bearer {CREWAI_BEARER_TOKEN}",
                        "Content-Type": "application/json",
                    },
                    json={"inputs": {"crisis_event_report": event_text}},
                )
                response.raise_for_status()

            logger.info(
                "CrewAI responded with status %s for session %s",
                response.status_code,
                session_id,
            )

            parsed = _parse_crewai_response(response.json())

        except httpx.TimeoutException:
            logger.warning(
                "CrewAI request timed out after %ss for session %s — falling back to Scenario Engine",
                CREWAI_TIMEOUT_SECONDS,
                session_id,
            )
            parsed = _load_mock_response(disaster_type)

        except Exception as exc:
            logger.error(
                "CrewAI request failed for session %s: %s — falling back to Scenario Engine",
                session_id,
                exc,
            )
            parsed = _load_mock_response(disaster_type)

    # ----- Persist results to Supabase ----- #
    try:
        # Merge the original event into the timeline so it always appears
        event_entry = {
            "timestamp": now,
            "event": event_text,
            "source": "User Input",
            "severity": "INFO",
        }

        # Check if Scenario Engine provided a timeline_text or structured timeline
        ai_timeline: list[dict[str, Any]] = []
        if "timeline_text" in parsed and parsed["timeline_text"]:
            ai_timeline.append({
                "timestamp": _utc_now_iso(),
                "event": parsed["timeline_text"],
                "source": f"Scenario Engine ({parsed.get('disaster_type', 'SYSTEM').upper()})",
                "severity": parsed.get("emergency_level", "CRITICAL"),
            })
        elif "timeline" in parsed and isinstance(parsed["timeline"], list):
            ai_timeline = parsed["timeline"]

        # Build the final timeline: original event first, then AI-generated
        final_timeline: list[dict[str, Any]] = [event_entry] + ai_timeline

        update_payload: dict[str, Any] = {
            "status": "COMPLETE",
            "emergency_level": parsed.get("emergency_level", "UNKNOWN"),
            "timeline": final_timeline,
            "agent_chatter": parsed.get("agent_chatter", []),
            "action_plan": parsed.get("action_plan", []),
            "last_updated": now,
        }

        db.table("crisis_sessions").update(update_payload).eq(
            "id", session_id
        ).execute()

        logger.info("✅ Session %s updated — status=COMPLETE", session_id)

    except Exception as db_exc:
        logger.error(
            "Failed to persist results for session %s: %s", session_id, db_exc
        )

        # Last-ditch attempt: at least mark the session as ERROR
        try:
            error_timeline_entry = {
                "timestamp": _utc_now_iso(),
                "event": f"System error during processing: {db_exc}",
                "source": "System",
                "severity": "ERROR",
            }
            db.table("crisis_sessions").update(
                {
                    "status": "ERROR",
                    "last_updated": _utc_now_iso(),
                    "timeline": [error_timeline_entry],
                }
            ).eq("id", session_id).execute()
        except Exception:
            logger.critical(
                "Could not even set ERROR status for session %s", session_id
            )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check() -> HealthResponse:
    """Lightweight health-check for load balancers and uptime monitors."""
    return HealthResponse()


@app.post(
    "/api/session",
    response_model=SessionCreateResponse,
    status_code=201,
    tags=["sessions"],
)
async def create_session() -> SessionCreateResponse:
    """
    Create a new crisis session.

    Inserts a blank row into `crisis_sessions` with sensible defaults and
    returns the auto-generated UUID so the frontend can start polling.
    """
    try:
        db = get_supabase()
        now = _utc_now_iso()

        row = {
            "status": "IDLE",
            "emergency_level": "UNKNOWN",
            "timeline": [],
            "agent_chatter": [],
            "action_plan": [],
            "last_updated": now,
        }

        result = db.table("crisis_sessions").insert(row).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=500,
                detail="Supabase insert returned no data — check RLS policies",
            )

        session_id: str = result.data[0]["id"]
        logger.info("Created new session %s", session_id)

        return SessionCreateResponse(session_id=session_id, status="IDLE")

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to create session: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/session/{session_id}", tags=["sessions"])
async def get_session(session_id: str) -> dict[str, Any]:
    """
    Fetch the current state of a crisis session by UUID.

    Returns the full row from `crisis_sessions` including status, timeline,
    agent chatter, and action plan.
    """
    try:
        db = get_supabase()
        result = (
            db.table("crisis_sessions")
            .select("*")
            .eq("id", session_id)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found",
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to fetch session %s: %s", session_id, exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post(
    "/api/inject-event",
    response_model=InjectEventResponse,
    tags=["events"],
)
async def inject_event(
    body: InjectEventRequest,
    background_tasks: BackgroundTasks,
) -> InjectEventResponse:
    """
    Main orchestration endpoint.

    Immediately marks the session as PROCESSING, appends the incoming event
    to the timeline, and returns within milliseconds.  The heavy CrewAI call
    runs as a background task so the frontend isn't blocked.
    """
    session_id = body.session_id
    event_text = body.event_text
    now = _utc_now_iso()

    try:
        db = get_supabase()

        # --- 1. Verify the session exists ---
        existing = (
            db.table("crisis_sessions")
            .select("id, timeline")
            .eq("id", session_id)
            .execute()
        )

        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found",
            )

        # --- 2. Append the event to the existing timeline ---
        current_timeline: list[dict[str, Any]] = existing.data[0].get(
            "timeline", []
        ) or []

        new_entry = {
            "timestamp": now,
            "event": event_text,
            "source": "User Input",
            "severity": "INFO",
        }
        updated_timeline = current_timeline + [new_entry]

        # --- 3. Set status to PROCESSING ---
        db.table("crisis_sessions").update(
            {
                "status": "PROCESSING",
                "timeline": updated_timeline,
                "last_updated": now,
            }
        ).eq("id", session_id).execute()

        logger.info(
            "Session %s → PROCESSING (event: %.80s…)", session_id, event_text
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to update session %s: %s", session_id, exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # --- 4. Kick off the background CrewAI / Scenario call ---
    background_tasks.add_task(_process_crisis_event, session_id, event_text, body.disaster_type)

    return InjectEventResponse(status="processing", session_id=session_id)


@app.post("/api/mock-complete", tags=["development"])
async def mock_complete(body: MockCompleteRequest) -> dict[str, Any]:
    """
    Development helper: immediately load dynamic scenario data from CRISIS_MATRIX
    and populate a session, skipping the CrewAI call entirely.

    Use this when testing the frontend without waiting for the AI pipeline.
    """
    session_id = body.session_id
    now = _utc_now_iso()

    try:
        db = get_supabase()

        # Verify session exists
        existing = (
            db.table("crisis_sessions")
            .select("id")
            .eq("id", session_id)
            .execute()
        )

        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found",
            )

        # Load dynamic scenario data
        mock_data = _load_mock_response(body.disaster_type)

        ai_timeline: list[dict[str, Any]] = []
        if "timeline_text" in mock_data and mock_data["timeline_text"]:
            ai_timeline.append({
                "timestamp": now,
                "event": mock_data["timeline_text"],
                "source": f"Scenario Engine ({mock_data.get('disaster_type', 'SYSTEM').upper()})",
                "severity": mock_data.get("emergency_level", "CRITICAL"),
            })
        elif "timeline" in mock_data and isinstance(mock_data["timeline"], list):
            ai_timeline = mock_data["timeline"]

        update_payload: dict[str, Any] = {
            "status": "COMPLETE",
            "emergency_level": mock_data.get("emergency_level", "UNKNOWN"),
            "timeline": ai_timeline,
            "agent_chatter": mock_data.get("agent_chatter", []),
            "action_plan": mock_data.get("action_plan", []),
            "last_updated": now,
        }

        db.table("crisis_sessions").update(update_payload).eq(
            "id", session_id
        ).execute()

        logger.info(
            "✅ Session %s populated with dynamic scenario data — status=COMPLETE",
            session_id,
        )

        return {
            "status": "complete",
            "session_id": session_id,
            "message": "Session populated with dynamic scenario data",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Mock-complete failed for session %s: %s", session_id, exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Global exception handler — catch-all for unhandled errors
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a clean JSON error for any unhandled exception."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc),
        },
    )


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
