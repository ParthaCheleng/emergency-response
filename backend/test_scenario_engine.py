"""
Verification script for scenario_engine.py
Verifies that all 6 tracks exist, contain exactly 8 sub-scenarios each (48 total),
and that all required schema keys are present and non-empty.
"""

import sys
import traceback
from scenario_engine import CRISIS_MATRIX, get_random_scenario, infer_disaster_type_from_text

def test_matrix_structure():
    expected_tracks = {"earthquake", "flood", "grid", "hazmat", "hurricane", "cyber"}
    assert set(CRISIS_MATRIX.keys()) == expected_tracks, f"Missing or extra tracks: {set(CRISIS_MATRIX.keys())}"
    
    total_scenarios = 0
    for track, scenarios in CRISIS_MATRIX.items():
        assert len(scenarios) == 8, f"Track '{track}' must have exactly 8 scenarios, found {len(scenarios)}"
        total_scenarios += len(scenarios)
        
        for idx, sc in enumerate(scenarios):
            assert "emergency_level" in sc, f"[{track}#{idx}] missing emergency_level"
            assert "timeline_text" in sc and len(sc["timeline_text"]) > 50, f"[{track}#{idx}] invalid timeline_text"
            assert "chatter" in sc and len(sc["chatter"]) == 8, f"[{track}#{idx}] must have exactly 8 agent chatter objects"
            assert "plan" in sc and 3 <= len(sc["plan"]) <= 5, f"[{track}#{idx}] must have 3..5 plan items"
            
            for ag in sc["chatter"]:
                assert all(k in ag for k in ["agent", "emoji", "status", "message", "tools_used", "last_action"]), f"[{track}#{idx}] agent missing keys"
                assert len(ag["tools_used"]) >= 1, f"[{track}#{idx}] agent tools_used empty"
                
    print(f"SUCCESS: Validated {len(expected_tracks)} disaster tracks and {total_scenarios} total sub-scenarios.")

def test_randomization():
    for track in CRISIS_MATRIX.keys():
        samples = [get_random_scenario(track) for _ in range(20)]
        texts = {s["timeline_text"] for s in samples}
        assert len(texts) > 1, f"Randomization failed for track {track}"
    print("SUCCESS: Randomization sampling verified.")

def test_inference():
    res1 = infer_disaster_type_from_text("USGS detected 7.2 magnitude earthquake")
    assert res1 == "earthquake", f"Expected earthquake, got {res1}"
    res2 = infer_disaster_type_from_text("Dam spillway failing flood waters rising")
    assert res2 == "flood", f"Expected flood, got {res2}"
    res3 = infer_disaster_type_from_text("Power grid blackout substation transformer")
    assert res3 == "grid", f"Expected grid, got {res3}"
    res4 = infer_disaster_type_from_text("Anhydrous ammonia chlorine gas leak")
    assert res4 == "hazmat", f"Expected hazmat, got {res4}"
    res5 = infer_disaster_type_from_text("Category 5 hurricane storm surge")
    assert res5 == "hurricane", f"Expected hurricane, got {res5}"
    res6 = infer_disaster_type_from_text("Ransomware cyber attack scada")
    assert res6 == "cyber", f"Expected cyber, got {res6}"
    print("SUCCESS: Keyword inference helper verified.")

if __name__ == "__main__":
    try:
        test_matrix_structure()
        test_randomization()
        test_inference()
        print("ALL SCENARIO ENGINE TESTS PASSED!")
        sys.exit(0)
    except Exception:
        print("TEST FAILED WITH TRACEBACK:")
        traceback.print_exc()
        sys.exit(1)
