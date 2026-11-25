"""Demo data from the storyboard (app/seed_data.json, exported from mobile/data/seed.ts).

Dates are written around Sunday 15 Nov 2026, the storyboard's "today". They are shifted forward by
whole days so today always plays that role: the latest scan is a few days old and Monday's visits are
tomorrow. (Shifting by whole weeks kept weekdays but let today drift up to six days past the
storyboard, so the upcoming visits had already happened for most of the week.)"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import get_settings
from app.content import data, default_availability
from app.db import Base, engine
from app.models import (
    Appointment,
    Blocked,
    Case,
    Dermatologist,
    Message,
    Notification,
    RoutineLog,
    Saved,
    Scan,
    Share,
    Thread,
    User,
)
from app.routine import build_routine
from app.security import hash_password
from app.state import DEFAULT_PREFS, DEFAULT_SETTINGS
from app.timeutil import parse_iso, today_local, utcnow

ANCHOR = datetime.fromisoformat("2026-11-15T00:00:00+05:00")

OTHER_PATIENTS = {
    "Bilal Raza": "bilal@demo.dermai.pk",
    "Zara Tariq": "zara@demo.dermai.pk",
    "Omar Farooq": "omar@demo.dermai.pk",
    "Nida Saleem": "nida@demo.dermai.pk",
    "Hassan Ali": "hassan@demo.dermai.pk",
    "Farah Shah": "farah@demo.dermai.pk",
}
DOCTOR_EMAILS = {"dr-sana": "sana@clinic.pk", "dr-umar": "umar@clinic.pk", "dr-hira": "hira@clinic.pk"}


def day_shift() -> timedelta:
    """Whole local days from the storyboard's today to the real one."""
    return timedelta(days=max(0, (today_local() - ANCHOR.date()).days))


def reset(db: Session) -> None:
    Base.metadata.drop_all(engine())
    Base.metadata.create_all(engine())


def seed(db: Session) -> dict:
    s = get_settings()
    d = data()
    shift = day_shift()
    at = lambda iso_: parse_iso(iso_) + shift  # noqa: E731
    pw = hash_password(s.demo_password)

    db.add(User(id="u-admin", role="admin", name="DermAI Admin", email=s.admin_email, password_hash=hash_password(s.admin_password)))

    # Doctors
    derms: dict[str, Dermatologist] = {}
    for doc in d["DOCTORS"]:
        u = User(id=f"u-{doc['id']}", role="dermatologist", name=doc["name"], email=DOCTOR_EMAILS[doc["id"]], password_hash=pw, demo=True, consent={"adult": True, "train": False, "at": "2026-11-03T09:00:00+05:00", "policy": "2026-11"}, settings=dict(DEFAULT_SETTINGS), profile={}, routine_prefs={})
        db.add(u)
        services = {k: {"on": False, "fee": 0} for k in ("video", "clinic", "message")}
        for sv in doc["services"]:
            services[sv["type"]] = {"on": True, "fee": sv["fee"]}
        avail = default_availability()
        derm = Dermatologist(
            id=doc["id"],
            user_id=u.id,
            step="done",
            status="approved",
            specialties=doc["specialties"],
            pmdc=doc["pmdc"],
            qualification=doc["qualifications"],
            clinic=doc["clinic"],
            city=doc["city"],
            bio=doc["bio"],
            focus=doc["focus"],
            years=doc["years"],
            female=doc["female"],
            tone=doc["tone"],
            certificate_key=None,
            certificate_name="PMDC_certificate.pdf",
            cnic_name="CNIC_front.jpg",
            services=services,
            availability=avail,
            rating=doc["rating"],
            review_count=doc["reviews"],
            languages=["English", "Urdu", "Punjabi"] if doc["id"] == "dr-sana" else ["English", "Urdu"],
            practising_since=today_local().year - doc["years"],
            degree_name="Degree_certificate.pdf",
            submitted_at=ANCHOR - timedelta(days=20),
            approved_at=parse_iso("2026-11-03T09:00:00+05:00"),
        )
        db.add(derm)
        derms[doc["id"]] = derm
    db.flush()

    # Ayesha, the returning patient
    p = d["DEMO_PATIENT"]
    ayesha = User(
        id="u-ayesha",
        role="patient",
        name=p["name"],
        email=p["email"],
        password_hash=pw,
        demo=True,
        guide_seen=5,
        consent={"adult": True, "train": False, "at": "2026-10-08T09:00:00+05:00", "policy": "2026-11"},
        profile={
            "tone": 2,
            "feel": "Combination",
            "concerns": ["redness", "acne", "darkSpots"],
            "otherConcerns": [],
            "avoid": ["Fragrance", "Benzoyl peroxide"],
            "current": "Cleanser and moisturiser",
            "done": True,
            "phone": p["phone"],
            "dob": p["dob"],
            "gender": p["gender"],
            "city": p["city"],
        },
        settings=dict(DEFAULT_SETTINGS),
        routine_prefs=dict(DEFAULT_PREFS),
    )
    db.add(ayesha)
    db.flush()
    for sc in d["DEMO_SCANS"]:
        db.add(Scan(id=sc["id"], user_id=ayesha.id, date=at(sc["date"]), score=sc["score"], concerns=sc["concerns"], zones=sc["zones"], where=sc["where"], quality=sc["quality"], confidence=86, photo_tone=sc["photoTone"]))
    latest = {"concerns": d["DEMO_SCANS"][0]["concerns"]}
    am = [x["id"] for x in build_routine("am", ayesha.profile, ayesha.routine_prefs, latest)]
    today = today_local()
    for i in range(1, 10):
        db.add(RoutineLog(user_id=ayesha.id, day=(today - timedelta(days=i)).isoformat(), steps=am))
    db.add(RoutineLog(user_id=ayesha.id, day=today.isoformat(), steps=["am-cleanser", "am-niacinamide"]))
    for sv in d["DEMO_SAVED"]:
        db.add(Saved(user_id=ayesha.id, kind=sv["kind"], title=sv["title"], subtitle=sv["subtitle"], icon=sv["icon"], routine_step_id=sv.get("routineStepId"), source=sv["source"]))
    for n in d["DEMO_NOTIFICATIONS"]:
        db.add(Notification(user_id=ayesha.id, icon=n["icon"], title=n["title"], body=n["body"], at=at(n["at"]), href=n["href"], read=n["read"]))
    db.add(Share(patient_id=ayesha.id, derm_id="dr-sana", scan_ids=["scan-1102", "scan-1029", "scan-1018"], until=utcnow() + timedelta(days=30)))

    # The other patients in Dr. Sana's inbox
    patients = {p["name"]: ayesha}
    for c in d["DEMO_CASES"]:
        cp = c["patient"]
        if cp["name"] in patients:
            continue
        born = today.year - cp["age"]
        u = User(
            id=f"u-{cp['name'].split()[0].lower()}",
            role="patient",
            name=cp["name"],
            email=OTHER_PATIENTS[cp["name"]],
            password_hash=pw,
            demo=True,
            consent={"adult": True, "train": cp["name"] in ("Zara Tariq", "Hassan Ali"), "at": "2026-10-01T09:00:00+05:00", "policy": "2026-11"},
            profile={"tone": cp["fitz"] - 1, "feel": cp["type"], "concerns": [], "otherConcerns": [], "avoid": cp["avoids"], "current": None, "done": True, "phone": "", "dob": f"1 Jan {born}", "gender": "", "city": "Lahore"},
            settings={**DEFAULT_SETTINGS, "train": cp["name"] in ("Zara Tariq", "Hassan Ali")},
            routine_prefs=dict(DEFAULT_PREFS),
        )
        db.add(u)
        patients[cp["name"]] = u
    nida = User(id="u-nida", role="patient", name="Nida Saleem", email=OTHER_PATIENTS["Nida Saleem"], password_hash=pw, demo=True, consent={"adult": True, "train": False, "at": "2026-11-01T09:00:00+05:00", "policy": "2026-11"}, profile={"tone": 3, "feel": "Normal", "concerns": [], "otherConcerns": [], "avoid": [], "current": None, "done": True, "phone": "", "dob": "1 Jan 1998", "gender": "", "city": "Lahore"}, settings=dict(DEFAULT_SETTINGS), routine_prefs=dict(DEFAULT_PREFS))
    db.add(nida)
    patients["Nida Saleem"] = nida
    db.flush()

    # Threads
    threads: dict[str, Thread] = {}
    for t in d["DEMO_THREADS"]:
        th = Thread(id=t["id"], patient_id=patients[t["patientName"]].id, derm_id=t["doctorId"], case_title=t["caseTitle"], unread_for_patient=t["unreadForPatient"], unread_for_doctor=t["unreadForDoctor"])
        db.add(th)
        threads[t["id"]] = th
        for m in t["messages"]:
            db.add(Message(id=f"{t['id']}-{m['id']}", thread_id=th.id, sender=m["from"], text=m["text"], note=m.get("note"), at=at(m["at"])))
    db.flush()

    # Cases
    flags = {
        "case-bilal": ["mole", "changed shape or colour"],
        "case-zara": ["AI: acne high", "score down 6 across scans"],
        "case-ayesha": ["painful", "lasting weeks"],
        "case-omar": [],
        "case-hassan": [],
        "case-farah": [],
    }
    for n, c in enumerate(d["DEMO_CASES"]):
        pid = patients[c["patient"]["name"]].id
        photos = [{"date": ph["date"], "tone": ph["tone"]} for ph in c["photos"]]
        if c["id"] == "case-ayesha":
            photos = [{"date": "2026-10-18", "tone": 3, "scanId": "scan-1018"}, {"date": "2026-11-02", "tone": 3, "scanId": "scan-1102"}]
        db.add(
            Case(
                id=c["id"],
                number=2036 + n,
                flags=flags.get(c["id"], []),
                derm_id="dr-sana",
                patient_id=pid,
                thread_id=c.get("threadId"),
                complaint=c["complaint"],
                summary=c["summary"],
                urgency=c["urgency"],
                received_at=at(c["receivedAt"]),
                status=c["status"],
                channel=c["channel"],
                photos=photos,
                ai={**c["ai"], "scanId": "scan-1102" if c["id"] == "case-ayesha" else None},
            )
        )
    db.flush()

    # Appointments and Dr. Sana's diary
    for a in d["DEMO_APPOINTMENTS"]:
        db.add(Appointment(id=a["id"], patient_id=ayesha.id, derm_id=a["doctorId"], case_id="case-ayesha" if a["status"] == "upcoming" else None, service=a["service"], start=at(a["start"]), minutes=a["minutes"], reason=a["reason"], shared_scan_ids=a["sharedScanIds"], status=a["status"], fee=a["fee"], payment_status="due" if a["status"] == "upcoming" else "paid"))
    by_short = {"Hassan A.": "Hassan Ali", "Nida S.": "Nida Saleem", "Zara T.": "Zara Tariq", "Omar F.": "Omar Farooq"}
    for v in d["DEMO_VISITS"]:
        if v["kind"] == "blocked":
            db.add(Blocked(id=f"blk-{v['id']}", derm_id="dr-sana", start=at(v["start"]), minutes=v["minutes"], label=v["label"]))
            continue
        if v["patientName"] == "Ayesha M.":
            continue  # appt-1 above
        start = at(v["start"])
        fee = derms["dr-sana"].services[v["service"]]["fee"]
        db.add(Appointment(id=f"appt-{v['id']}", patient_id=patients[by_short[v["patientName"]]].id, derm_id="dr-sana", case_id=v.get("caseId"), service=v["service"], start=start, minutes=v["minutes"], reason=v["label"].split(" · ", 1)[1].capitalize(), status="upcoming" if start > utcnow() else "done", fee=fee, payment_status="due"))
    db.commit()
    return {"patients": len(patients), "doctors": len(derms)}


def run(do_reset: bool = True) -> dict:
    from app.db import session

    with session() as db:
        if do_reset:
            reset(db)
        return seed(db)
