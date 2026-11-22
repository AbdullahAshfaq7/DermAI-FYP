"""Ask DermAI replies. Rule-based for now (port of mobile/lib/ai.ts); grounded in the latest scan and
profile, never diagnoses, and refers red-flag symptoms to a dermatologist.
TODO(next): swap `reply` for the Claude API with these rules as the safety layer (docs/NEXT.md)."""

import re

from app.content import concern_order, concerns, skin_tones, zone_label

RED_FLAGS = re.compile(
    r"(won['’]?t go away|for weeks|weeks|months|painful|hurts?|bleed|bleeding|chang(e|ed|ing) (shape|colou?r|size)|mole|spreading|swell|pus|fever|cyst)",
    re.I,
)

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def ranked(scan: dict) -> list[str]:
    return sorted(concern_order(), key=lambda k: -scan["concerns"][k]["pct"])


def reply(prompt: str, scan: dict | None, profile: dict, scan_day: str | None = None) -> tuple[str, bool]:
    p = prompt.lower()
    tone_idx = profile.get("tone")
    tone = skin_tones()[tone_idx].lower() if isinstance(tone_idx, int) and 0 <= tone_idx < 6 else "your"
    flagged = bool(RED_FLAGS.search(prompt))

    if re.search(r"pop|squeez|pick", p):
        extra = " Because they've lasted and hurt, this is worth a dermatologist's look." if flagged else ""
        return (
            f"Please don't. Deep, painful bumps are often cystic acne, and squeezing can scar, especially on {tone} skin where marks linger. A warm compress twice a day can ease the pain.{extra}",
            True,
        )
    if re.search(r"explain|my scan|result|score", p):
        if not scan:
            return ("You don't have a scan yet. Your first one takes about a minute, and then I can explain each concern.", False)
        parts = []
        for k in ranked(scan)[:2]:
            where = " and ".join(zone_label()[z] for z in scan["where"].get(k, []))
            parts.append(f"{concerns()[k]['label'].lower()} is {scan['concerns'][k]['level'].lower()}" + (f" on your {where}" if where else ""))
        return (
            f"Your {scan_day or 'latest'} scan scored {scan['score']}. The two things to focus on: {', and '.join(parts)}. Your routine already targets both; give it 4 to 6 weeks before judging.",
            False,
        )
    if "retinol" in p:
        if any("retinol" in a.lower() for a in profile.get("avoid", [])):
            return ("You told us retinol bothers your skin, so I've kept it out of your routine. Azelaic acid is a gentler option for marks and redness.", False)
        return (
            "Retinol can help with marks and texture, but it can irritate sensitive or red skin. Start with azelaic acid first; if your skin stays calm for a month, a low-strength retinol twice a week is reasonable.",
            False,
        )
    if re.search(r"red|flush", p):
        extra = " If it lasts for weeks, a dermatologist can check for rosacea." if flagged else ""
        return (
            f"Redness straight after washing usually means the water is too hot or the cleanser too strong. Try lukewarm water and pat dry. On {tone} skin redness can look darker rather than pink.{extra}",
            flagged,
        )
    if re.search(r"dry|tight|flak", p):
        return ("Apply moisturiser within a minute of washing, while your skin is still damp, and use a ceramide cream at night. Cheeks usually need more than the T-zone.", flagged)
    if re.search(r"spot|mark|pigment|dark", p):
        return ("Dark marks fade slowly on deeper skin. Daily mineral SPF stops them darkening; azelaic acid at night fades them over 8 to 12 weeks.", flagged)
    if flagged:
        return (
            "I can share general guidance, but something that hurts, bleeds, spreads or changes shape should be looked at by a dermatologist. You can send your latest scan to one from here.",
            True,
        )
    return (
        "Good question. In general: a gentle cleanser, a moisturiser that suits your type, and SPF every morning come first. Tell me what you're noticing and where on your face, and I'll tailor it to your scan.",
        False,
    )
