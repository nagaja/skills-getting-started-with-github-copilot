import uuid
from urllib.parse import quote


def test_get_activities_returns_expected_structure(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # sample check for a known activity
    assert "Chess Club" in data
    sample = data["Chess Club"]
    assert "description" in sample and "participants" in sample


def test_signup_and_unregister_flow(client):
    activity = "Chess Club"
    unique_email = f"test+{uuid.uuid4().hex}@example.com"

    # Ensure not already signed up
    r = client.get("/activities")
    assert unique_email not in r.json()[activity]["participants"]

    # Sign up
    r = client.post(f"/activities/{quote(activity)}/signup", params={"email": unique_email})
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # Verify appears
    r = client.get("/activities")
    assert unique_email in r.json()[activity]["participants"]

    # Unregister
    r = client.delete(f"/activities/{quote(activity)}/signup", params={"email": unique_email})
    assert r.status_code == 200
    assert "Unregistered" in r.json().get("message", "")

    # Verify removed
    r = client.get("/activities")
    assert unique_email not in r.json()[activity]["participants"]
