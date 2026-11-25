# Next steps (deferred on 22 Nov 2026)

The app and backend work end to end without any third-party service. These were left out on purpose and are the next pieces to add. Each one has a clear place to plug in.

| Item | Today | Where it plugs in |
| --- | --- | --- |
| **LLM for Ask DermAI and routine text** (Claude API + RAG over a curated knowledge base) | Rule-based replies on the server, grounded in the latest scan and profile, with red-flag referral | `backend/app/ai_rules.py` `reply()`; keep the red-flag rules as a safety layer around the model |
| **Skin model** (validated, trained on diverse skin incl. Fitzpatrick IV-VI) | Free pretrained ONNX models (Glowlytics, MIT): acne lesion detector + pores/dryness/dark-spot scorer; redness and sensitivity still heuristic. Not validated medically; the acne detector is YOLOv8 (Ultralytics AGPL-3.0 terms may apply) | `backend/app/analysis/model.py`; `scripts/fetch_models.sh` gets the models; `DERMAI_ANALYZER=heuristic` turns them off |
| **Remote push notifications** (Expo push via EAS) | In-app notifications from the server, plus on-device reminders (routine, rescan, 1 h before a visit) | Store Expo push tokens per user; send from `backend/app/common.py` `notify()` |
| **Password-reset email** (SMTP or a mail API) | 6-digit code is written to the server log; in `DEV_MODE` the app shows it | `backend/app/routers/auth.py` `forgot()` |
| **Google sign-in** | "Coming soon" note on sign-up | New `/auth/google` endpoint that verifies the ID token; button on `mobile/app/sign-up.tsx` |
| **Payments** (Safepay / PayFast, JazzCash, Easypaisa, cards) | The patient's payment choice is saved on the booking; status `due`; "pay at the visit" | `backend/app/routers/booking.py` `book()`; doctor payouts on `mobile/app/earnings.tsx` |
| **Video visits** (Daily, Agora or Twilio) | Video button explains calls are coming soon; visits are booked and scheduled normally | Room per appointment; join button on `mobile/app/thread/[id].tsx` and `booked/[id].tsx` |
| **Native live-check tuning** | Light/Steady/Framing come from the server precheck on a small frame about once a second | Test on real phones in Lahore light; consider on-device checks (expo-camera frame processor) to save data |
| **Urdu** | Language setting stored; Urdu shows "coming in a later version" | i18n strings in the app |
| **Cloud storage and deployment** (S3/R2, Render/Fly, managed Postgres) | Files on local disk behind signed links; local Postgres | `backend/app/storage.py` keeps the same four functions; deploy with Docker |
