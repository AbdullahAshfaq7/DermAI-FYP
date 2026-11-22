import json

from app.timeutil import today_local
from tests.conftest import register


def test_consent_required_and_adult_check(client):
    api = register(client)
    api.post("/scans/check", 403, files={"photo": ("f.jpg", b"x", "image/jpeg")})
    api.post("/me/consent", 400, json={"adult": False, "train": True})
    api.post("/me/consent", json={"adult": True, "train": True})
    assert api.state["consent"]["adult"] and api.state["settings"]["train"] is True


def test_profile_setup_and_validation(client):
    api = register(client)
    api.patch("/me/profile", json={"tone": 4})
    api.patch("/me/profile", json={"feel": "Oily", "concerns": ["acne", "pores"], "otherConcerns": ["Fine lines"]})
    api.patch("/me/profile", json={"avoid": ["Fragrance", "fragrance", " Retinol "], "current": "Just water", "done": True})
    p = api.state["profile"]
    assert p["tone"] == 4 and p["feel"] == "Oily" and p["otherConcerns"] == ["Fine lines"]
    assert p["avoid"] == ["Fragrance", "Retinol"] and p["done"] is True
    for bad in ({"tone": 9}, {"tone": True}, {"feel": "Shiny"}, {"concerns": ["wrinkles"]}, {"avoid": "Fragrance"}, {"unknown": 1}, {"phone": "abc"}):
        api.patch("/me/profile", 400, json=bad)


def test_personal_details_and_email_change(client, ayesha):
    ayesha.put("/me/personal", json={"name": "Ayesha  Khan", "email": "Ayesha.K@Mail.com", "phone": "+92 321 7654321", "dob": "14 Mar 2001", "gender": "Female", "city": "Karachi"})
    assert ayesha.state["session"]["name"] == "Ayesha Khan"
    assert ayesha.state["session"]["email"] == "ayesha.k@mail.com"
    assert ayesha.state["profile"]["city"] == "Karachi"
    ayesha.put("/me/personal", 409, json={"name": "Ayesha Khan", "email": "sana@clinic.pk"})
    ayesha.put("/me/personal", 400, json={"name": "A", "email": "x@y.co"})
    ayesha.put("/me/personal", 400, json={"name": "Ayesha", "email": "x@y.co", "dob": "yesterday"})


def test_settings_and_prefs_validation(client, ayesha):
    ayesha.patch("/me/settings", json={"remindAm": False, "rescanDays": 14, "quietFrom": "10 pm", "keepPhotos": True, "train": True})
    s = ayesha.state["settings"]
    assert s["remindAm"] is False and s["rescanDays"] == 14 and s["keepPhotos"] is True
    assert ayesha.state["consent"]["train"] is True
    for bad in ({"rescanDays": 1}, {"remindAm": "yes"}, {"quietFrom": "late"}, {"nope": 1}, {"language": "French"}):
        ayesha.patch("/me/settings", 400, json=bad)
    ayesha.patch("/me/routine-prefs", json={"length": 5, "amTime": "6:45 am", "budget": "Low"})
    assert ayesha.state["routinePrefs"]["length"] == 5
    ayesha.patch("/me/settings", json={"photoRetention": "3m", "skipGuide": True})
    assert ayesha.state["settings"]["photoRetention"] == "3m"
    ayesha.patch("/me/settings", 400, json={"photoRetention": "forever"})
    ayesha.patch("/me/profile", json={"currentProducts": ["Cleanser", "Sunscreen"]})
    ayesha.patch("/me/profile", 400, json={"currentProducts": ["Toothpaste"]})
    for bad in ({"length": 6}, {"length": 1}, {"amTime": "25:00"}, {"removed": ["not-a-step"]}, {"budget": "Huge"}):
        ayesha.patch("/me/routine-prefs", 400, json=bad)


def test_routine_toggle_and_streak(client, ayesha):
    day = today_local().isoformat()
    assert ayesha.state["streakBase"] == 9
    ayesha.post("/me/routine/toggle", json={"day": day, "stepId": "am-spf"})
    assert "am-spf" in ayesha.state["routineLog"][day]
    ayesha.post("/me/routine/toggle", json={"day": day, "stepId": "am-spf"})
    assert "am-spf" not in ayesha.state["routineLog"][day]
    ayesha.post("/me/routine/toggle", 404, json={"day": day, "stepId": "nope"})
    ayesha.post("/me/routine/toggle", 400, json={"day": "today", "stepId": "am-spf"})


def test_saved_favorites_notifications(client, ayesha):
    n0 = len(ayesha.state["saved"])
    item = {"kind": "tip", "title": "Use lukewarm water", "subtitle": "Less redness", "icon": "lightbulb", "source": "AI chat"}
    ayesha.post("/me/saved/toggle", json=item)
    assert len(ayesha.state["saved"]) == n0 + 1
    ayesha.post("/me/saved/toggle", json=item)
    assert len(ayesha.state["saved"]) == n0
    ayesha.post("/me/saved/toggle", 400, json={**item, "kind": "meme"})
    ayesha.post("/me/favorites/dr-umar/toggle")
    assert ayesha.state["favorites"] == ["dr-umar"]
    ayesha.post("/me/favorites/dr-umar/toggle")
    assert ayesha.state["favorites"] == []
    ayesha.post("/me/favorites/dr-nobody/toggle", 404)
    nid = next(n["id"] for n in ayesha.state["notifications"] if not n["read"])
    ayesha.post(f"/me/notifications/{nid}/read")
    assert next(n for n in ayesha.state["notifications"] if n["id"] == nid)["read"]
    ayesha.post("/me/notifications/read-all")
    assert all(n["read"] for n in ayesha.state["notifications"])


def test_cannot_touch_someone_elses_notification(client, ayesha, sana):
    nid = ayesha.state["notifications"][0]["id"]
    sana.post(f"/me/notifications/{nid}/read", 404)


def test_ai_chat_grounded_and_red_flags(client, ayesha):
    ayesha.post("/ai/chat", json={"text": "Explain my scan"})
    reply = ayesha.state["aiChat"][-1]
    assert reply["from"] == "ai" and "scored 72" in reply["text"]
    ayesha.post("/ai/chat", json={"text": "I have a mole that changed shape and it bleeds"})
    assert ayesha.state["aiChat"][-1].get("referral") is True
    ayesha.post("/ai/chat", json={"text": "Is retinol safe for me?"})
    ayesha.post("/ai/chat", 400, json={"text": "   "})
    ayesha.post("/ai/chat", 400, json={"text": "x" * 1001})
    assert len(ayesha.state["aiChat"]) == 6
    ayesha.delete("/ai/chat")
    assert ayesha.state["aiChat"] == []


def test_ai_chat_without_scans(client):
    api = register(client)
    api.post("/ai/chat", json={"text": "explain my results"})
    assert "don't have a scan yet" in api.state["aiChat"][-1]["text"]


def test_doctors_cannot_use_patient_routes(client, sana):
    sana.post("/ai/chat", 403, json={"text": "hi"})
    sana.patch("/me/routine-prefs", 403, json={"length": 3})
    sana.post("/appointments", 403, json={"doctorId": "dr-umar", "service": "message", "reason": "x"})


def test_export_contains_my_data_only(client, ayesha):
    r = client.get("/me/export", headers=ayesha.h)
    assert r.status_code == 200 and "attachment" in r.headers["content-disposition"]
    data = json.loads(r.text)["account"]
    assert data["session"]["email"] == "ayesha@mail.com" and len(data["scans"]) == 5
    assert "doctors" not in data and "derm" not in data
    assert "Omar" not in r.text


def test_stop_sharing(client, ayesha, sana):
    case = next(c for c in sana.state["derm"]["cases"] if c["id"] == "case-ayesha")
    assert len(ayesha.state["shares"]) == 1
    ayesha.delete("/me/shares/dr-sana")
    assert ayesha.state["shares"] == []
    ayesha.delete("/me/shares/dr-sana", 404)
    sana.get("/me/state")
    assert case["threadId"]
    assert next(t for t in sana.state["threads"] if t["id"] == "thread-ayesha")["sharedScans"] == 0


def test_red_flag_reply_offers_a_real_slot(client, ayesha):
    ayesha.post("/ai/chat", json={"text": "A painful cyst on my chin for weeks, should I pop it?"})
    reply = ayesha.state["aiChat"][-1]
    assert reply["referral"] and reply["suggest"]["doctorId"] == "dr-sana"
    slots = ayesha.get(f"/doctors/dr-sana/slots?service={reply['suggest']['service']}&days=14")
    free = [s["iso"] for d in slots["days"] for s in d["slots"] if not s["taken"]]
    assert reply["suggest"]["start"] == free[0]
    ayesha.post("/ai/chat", json={"text": "How do I cleanse?"})
    assert "suggest" not in ayesha.state["aiChat"][-1]


def test_old_routine_lengths_are_migrated(client, ayesha):
    from app.db import session
    from app.models import User

    with session() as db:
        u = db.get(User, "u-ayesha")
        u.routine_prefs = {**u.routine_prefs, "length": 6}
        db.commit()
    ayesha.get("/me/state")
    assert ayesha.state["routinePrefs"]["length"] == 5
