const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Create a new crisis session
 * @returns {Promise<{session_id: string, status: string}>}
 */
export async function createSession() {
  const res = await fetch(`${API_URL}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to create session: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Inject a crisis event into an active session
 * @param {string} sessionId - The UUID of the crisis session
 * @param {string} eventText - The crisis event description
 * @param {string|null} disasterType - Optional disaster category
 * @returns {Promise<{status: string, session_id: string}>}
 */
export async function injectEvent(sessionId, eventText, disasterType = null) {
  const payload = {
    session_id: sessionId,
    event_text: eventText,
  };
  if (disasterType) {
    payload.disaster_type = disasterType;
  }
  const res = await fetch(`${API_URL}/api/inject-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to inject event: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch the current state of a crisis session
 * @param {string} sessionId - The UUID of the crisis session
 * @returns {Promise<Object>}
 */
export async function getSession(sessionId) {
  const res = await fetch(`${API_URL}/api/session/${sessionId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to get session: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Trigger mock completion for development testing
 * @param {string} sessionId - The UUID of the crisis session
 * @param {string|null} disasterType - Optional disaster category
 * @returns {Promise<{status: string, session_id: string}>}
 */
export async function mockComplete(sessionId, disasterType = null) {
  const payload = { session_id: sessionId };
  if (disasterType) {
    payload.disaster_type = disasterType;
  }
  const res = await fetch(`${API_URL}/api/mock-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to mock complete: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
