# DermAI design system and screen spec

Status: proposal, not implemented · 12 November 2026
Companion file: `storyboard.html` (every screen drawn, open in a browser)

DermAI v2 is one mobile app with two roles: **patients**, who scan their skin, follow a routine and get care, and **dermatologists**, who review referred cases, message patients and run their bookings. This document defines how it looks, sounds and behaves, and lists every screen.

---

## 1. Direction

**Clinical calm, built for every skin.**

The references set the frame: HelloMJ's calm, trustworthy health-tech structure; IGA Sial's warmth and plain human language; Fomax's confidence with product UI front and centre. DermAI takes the calm structure, keeps the warmth in words and imagery rather than in a cream-and-serif look, and adds one signature that only a dermatology product could own.

**The signature:** the six Fitzpatrick skin tones, the scale dermatologists use to classify skin. They form the logo, open the skin profile, and say without a slogan that the app is built for every skin, including the medium-to-deep tones most of our users have and most datasets under-serve.

**The hero moment:** the face map on the results screen. Instead of a generic score ring, the result shows a face with each zone (forehead, nose, cheeks, chin) shaded by how much attention it needs. It is the one place the UI is visually bold; everything else stays quiet.

### Principles

1. **Calm over clever.** People open this app worried about their skin. Neutral surfaces, generous space, one action per screen.
2. **Show where, not just how much.** Every result is tied to a place on the face and a change over time.
3. **Guidance, never diagnosis.** The AI explains and suggests; a dermatologist decides. The UI always shows which is which.
4. **Every skin, by default.** Copy, imagery, examples and the model all assume diverse skin tones, not as an option.
5. **Two roles, one product.** Patients and dermatologists share components; a violet accent marks clinician-only views so nobody is ever unsure which side they're on.

---

## 2. Logo

**Mark:** a circular lens holding six vertical bands in the Fitzpatrick tones (I to VI, light to deep), wrapped by an open teal ring that reads as a scan in progress.

**Wordmark:** `dermai`, lowercase, Sora SemiBold, letter-spacing −2%. Lowercase keeps it soft and personal; it drops the current "derm AI" split so it no longer reads as "derm + AI".

| Use | Rule |
| --- | --- |
| App icon | Mark only, centred on Ink `#0E2A33` |
| Splash | Mark 76 pt + wordmark on Ink |
| In-app header | Mark 24 to 26 pt, no wordmark |
| Clear space | Half the mark's diameter on all sides |
| Minimum size | 16 pt mark; 64 pt for mark + wordmark |
| Don't | Recolour the bands, reorder them, close the ring, or put the mark on a photo |

Deliverables needed before build: SVG master, 1024 px app icon, Android adaptive foreground, monochrome (notification) version.

---

## 3. Colour

### Core palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` (Gauze) | `#F4F7F6` | `#0B1F25` | App background |
| `surface` | `#FFFFFF` | `#122A31` | Cards, lists, sheets |
| `surfaceMuted` (Mist) | `#EAF0EE` | `#18343C` | Segmented controls, tracks, empty states |
| `border` | `#DCE4E2` | `#24434B` | Card and field outlines |
| `textPrimary` (Ink) | `#0E2A33` | `#E8F0EE` | Headings, body, primary button fill (light) |
| `textSecondary` | `#4A5F66` | `#A9BCBA` | Supporting text |
| `textMuted` | `#84969B` | `#6F8789` | Placeholders, timestamps |
| `brand` (Dermis teal) | `#1F7A72` | `#4FB3A6` | Scan button, links, progress, selected states |
| `brandDeep` | `#155C56` | `#7FD3C5` | Text on brand wash |
| `brandWash` | `#E1F0EC` | `#173E3B` | Info banners, selected chips |
| `clinician` | `#4A3D78` | `#B4A7E8` | Dermatologist-only accent |
| `clinicianWash` | `#EEEAF7` | `#2A2547` | Dermatologist banners and highlights |

### Status (always paired with a word, never colour alone)

| Token | Light | Use |
| --- | --- | --- |
| `good` | `#23704A` text, `#2F8F5B` icon, on `#E3F2EA` | Improving, done, verified |
| `watch` | `#8C6110` text, `#B9811A` icon, on `#FBF0D9` | Mild, needs attention |
| `act` | `#A3362E` text, `#C2463D` icon, on `#F8E2DF` | Moderate or high, urgent, destructive |

### Concern scale (face map and concern bars only)

| Level | Fill | Meaning |
| --- | --- | --- |
| Clear | `#CFE7E1` | Nothing to act on |
| Mild | `#F2D9A2` | Keep an eye on it |
| Moderate | `#EFAA8F` | Routine targets this |
| High | `#D9655A` | Consider a dermatologist |

These are tints, chosen to sit on a skin-toned face without looking like a rash or a heat map. They are never used for buttons or text.

### Fitzpatrick tones (brand and skin-tone picker only)

`#F5DCCB` · `#EBC2A2` · `#D4A07A` · `#A8714C` · `#7A4B31` · `#4A2E22`

Never use these as status colours or as decoration on data. Avatars without a photo use them so default avatars reflect real users.

### Contrast

Checked against WCAG AA (4.5:1 for normal text): Ink on Gauze 13.9:1, `textSecondary` 6.2:1, white on `brand` 5.1:1, every status pill 4.8:1 or higher. `textMuted` (3.1:1) is for timestamps and placeholders only. `brand` text on `brandWash` is 4.4:1, so small text there uses `brandDeep` (6.6:1).

---

## 4. Typography

Two families, each with one job:

- **Sora** (600, 500): headings, scores, counts, the wordmark. Geometric and precise, so numbers read as measurements.
- **DM Sans** (400, 500, 600): everything people read or tap: body, buttons, fields, chat, captions.

| Style | Font | Size / line height (pt) | Tracking | Use |
| --- | --- | --- | --- | --- |
| Score | Sora 600 | 48 / 48 | −4% | Skin score on results |
| Display | Sora 600 | 28 / 32 | −2.5% | Onboarding and result titles |
| Title | Sora 600 | 22 / 26 | −2% | Screen titles |
| Heading | Sora 600 | 17 / 22 | −1% | Section headings |
| Body | DM Sans 400 | 15 / 22 | 0 | Paragraphs, chat |
| Body strong | DM Sans 600 | 15 / 22 | 0 | List titles, buttons |
| Small | DM Sans 400 | 13 / 18 | 0 | Supporting text |
| Caption | DM Sans 500 | 12 / 16 | 0 | Labels, timestamps |

Rules: sentence case everywhere; no all-caps labels; left-aligned headings; numbers in Sora with tabular figures; support Dynamic Type up to 200% (lists reflow, the face map stays fixed size). Measures in the storyboard are scaled down to fit the phone frame.

---

## 5. Space, shape, depth

- **Spacing:** 4 pt base. Screen side padding 20; gap between cards 12; inside cards 16; between sections 24.
- **Radius by hierarchy:** sheets and large media 24 · cards and lists 16 · buttons and fields 12 · chips and pills fully round. Radius gets smaller as elements get smaller.
- **Depth:** separation by 1 px borders, not shadows. Only two things cast a shadow: the centre Scan button and bottom sheets.
- **Touch targets:** at least 44 × 44 pt, even when the visible element is smaller.

---

## 6. Icons and imagery

- **Icons:** Material Symbols Rounded, weight 400. Outline by default, filled when selected (active tab, checked step, verified badge). 20 pt in lists, 24 pt in tabs.
- **Illustration:** the face map is the only illustration style: flat, soft fills, thin outline, no gradients.
- **Photos:** users' own scans are the main imagery. Never use stock "glowing skin" photography. Doctor profiles use real headshots; without one, initials on a Fitzpatrick-tone circle.
- **Marketing and store screenshots:** show the product UI on diverse skin, no models or influencer styling.

---

## 7. Components

| Component | Spec |
| --- | --- |
| Primary button | 48 pt high, radius 12, Ink fill, white DM Sans 600 15. One per screen, pinned to the bottom on task screens |
| Brand button | Same, teal fill. Used for scan actions and "See my routine" |
| Secondary button | Transparent, 1 px border |
| Destructive | Secondary style with `act` text; always confirms in a sheet |
| Field | 1 px border, radius 12, floating small label; focus = teal border + 3 pt teal wash ring; error text below in `act` |
| Option card | Full-width selectable row with radio; selected = teal border + 1 pt inner ring |
| Chip | 28 pt, fully round. Filter chips toggle Ink fill; tag chips use brand wash |
| List | White surface, radius 16, rows separated by hairlines, 44 pt+ rows, chevron when it navigates |
| Status pill | Word + tint (`good`, `watch`, `act`, neutral). Never a colour dot alone |
| Face map | Fixed 160 × 200 base, zones: forehead, nose (T-zone), left cheek, right cheek, chin. Each zone tappable and labelled for screen readers ("Left cheek, redness moderate") |
| Concern row | Name, 5 pt bar filled in the concern colour, status pill |
| Score | Sora 48, "/100" in caption, change since last scan underneath |
| Routine step | Tap circle to tick (haptic + fill), tap row for detail; done rows dim to 55% |
| Chat bubble | Patient: Ink fill, right. AI and doctor: white with border, left. Doctor notes get a titled card ("Note from Dr. Iqbal") |
| Referral banner | Brand wash, stethoscope icon, one sentence, one action. In clinician views, clinician wash |
| Tab bar (patient) | Home · Routine · **Scan** (raised teal circle) · Care · Me |
| Tab bar (dermatologist) | Today · Cases · Schedule · Messages · Me, active state in clinician violet |
| Urgency bar | 4 pt vertical bar on case rows: high / moderate / mild from the concern scale |
| Slot picker | Day strip + 3-column time grid; taken slots struck through on Mist |

---

## 8. Motion

One orchestrated moment, everything else quiet:

- **Signature:** during analysis a soft teal line sweeps the face map; when results arrive, the zones fill in one after another (forehead to chin, 80 ms apart) and the score counts up once.
- **Responses to action:** ticking a step fills the circle with a short spring; sheets slide up; screen pushes use the platform default.
- **Camera:** the face oval turns teal and grows a soft ring when all checks pass, then auto-captures after 1.5 s.
- **Reduced motion:** with the system setting on, zones and score appear instantly and the sweep becomes a static progress bar.

No entrance animations on lists or cards.

---

## 9. Voice and content

- Plain words, short sentences, sentence case. Talk to the person ("your cheeks"), not about "the user".
- Name things by what people know: "Find a dermatologist", not "Referral module".
- Buttons say exactly what happens: "Book Mon 16 Nov, 4:30 pm", then the confirmation says "You're booked".
- **Medical safety:** never say "diagnosis", "you have", or name a disease as fact. Say "looks like", "often", "worth a dermatologist's look". Every AI answer about symptoms that last, hurt, bleed or change shape ends with a referral prompt. Footer line on AI views: "DermAI gives guidance, not a diagnosis."
- **Skin tone aware:** describe how a concern shows on the person's tone ("on medium skin it can look darker, not pinker").
- **Errors** say what happened and what to do: "Too dark to read your skin. Face a window and try again." No apologies, no vague "Something went wrong".
- **Empty states** invite the next step: "No scans yet. Your first one takes about a minute."
- Urdu is planned (v1.2): avoid idioms and keep strings short enough to grow 30%.

---

## 10. Accessibility

- AA contrast for all text; status always has a word.
- Every icon-only button has a label; the face map exposes each zone as a button.
- Dynamic Type to 200%; layouts reflow, nothing truncates mid-word in titles.
- 44 pt minimum targets; camera controls 56 pt.
- Haptics confirm capture, routine ticks and sent messages.
- Dark mode uses the dark column of every token; scan photos are never colour-shifted.

---

## 11. Navigation

```
Shared        A1 Splash → A2 Welcome → A3 Choose role → A4 Create account → A5 Consent
                                            │
              ┌─────────────────────────────┴──────────────────────────────┐
Patient       B1 Skin tone → B2 Type and concerns → B3 Allergies            Dermatologist
              → C1 first scan                                              G1 Credentials → G2 Services
                                                                           → H6 Availability
Patient tabs  Home (D1) · Routine (D2) · Scan (C1–C6) · Care (E1) · Me (F1)
Derm tabs     Today (H1) · Cases (H2) · Schedule (H5) · Messages (H7) · Me (H8)
```

Cross-links: a referral prompt (C6, E2) leads to E3 → E4 → E5 → E6. Booking with shared scans creates a case in the dermatologist's H2. An assessment sent from H4 appears in the patient's E7 and can change their routine (D2).

---

## 12. Screen inventory

39 screens. "Replaces" names the current file in `mobile/app/` where one exists.

| ID | Screen | Role | Job | Replaces |
| --- | --- | --- | --- | --- |
| A1 | Splash | Shared | Restore session, route by role | `components/branding/BrandedSplashScreen` |
| A2 | Welcome | Shared | Explain value, start sign-up | new |
| A3 | Choose role | Shared | Patient or dermatologist | new |
| A4 | Create account | Shared | Email or Google sign-up | new |
| A5 | Consent | Shared | Privacy, age, optional training opt-in | new |
| B1 | Skin tone | Patient | Fitzpatrick type in plain words | new |
| B2 | Skin type and concerns | Patient | Type by feel, top concerns | `pre-scan.tsx` |
| B3 | Allergies and routine | Patient | Ingredients to avoid, current routine | `pre-scan.tsx` |
| C1 | Scan guide | Patient | Light, bare skin, distance | new |
| C2 | Camera | Patient | Live checks, auto-capture, upload | `scan/index.tsx` |
| C3 | Review | Patient | Real check results, retake | `scan/review.tsx` |
| C4 | Analysing | Patient | Real pipeline stages, can leave | `scan/analyzing.tsx` |
| C5 | Results | Patient | Face map, score, concern list | `scan/results.tsx` |
| C6 | Concern detail | Patient | Trend, what helps, when to see a doctor | `skin-profile.tsx` (partly) |
| D1 | Home | Patient | Latest scan, today's routine, what's next | `(tabs)/index.tsx` |
| D2 | Routine | Patient | AM/PM steps, streak, tick off | `(tabs)/routine.tsx` |
| D3 | Step detail | Patient | Why, how, what to avoid | `recommendations/detail/[id].tsx` |
| D4 | Progress | Patient | Photo compare, trend per concern | new |
| E1 | Care hub | Patient | AI entry, current doctor, find a doctor | new |
| E2 | AI chat | Patient | Grounded answers, referral hand-off | `(tabs)/chat.tsx` |
| E3 | Find a dermatologist | Patient | Verified list, filters | new |
| E4 | Doctor profile | Patient | Credentials, services, prices | new |
| E5 | Pick a time | Patient | Day and slot, share scans, reason | new |
| E6 | Booking confirmed | Patient | Summary, calendar, message | new |
| E7 | Doctor chat | Patient | Case thread, doctor notes | new |
| F1 | Me | Patient | Profile, stats, menu | `(tabs)/profile.tsx` |
| F2 | Notifications | Patient | Grouped, deep-linked | `notifications.tsx` |
| F3 | Settings | Patient | Appearance, reminders, language | `settings/*` |
| F4 | Privacy and data | Patient | Photo retention, sharing, export, delete | `settings/privacy.tsx` |
| G1 | Credentials | Dermatologist | PMDC number, qualification, documents | new |
| G2 | Services and review status | Dermatologist | Visit types and fees, pending state | new |
| H1 | Today | Dermatologist | Counts, next visit, urgent cases | new |
| H2 | Case inbox | Dermatologist | Waiting, replied, closed; by urgency | new |
| H3 | Case review | Dermatologist | Photos, AI reading, profile, complaint | new |
| H4 | Write assessment | Dermatologist | Finding, rate the AI, note, routine changes | new |
| H5 | Schedule | Dermatologist | Day timeline of visits | new |
| H6 | Availability | Dermatologist | Weekly hours, buffers, time off | new |
| H7 | Messages | Dermatologist | Patient threads | new |
| H8 | Me | Dermatologist | Public profile, services, payouts | new |

Removed from the current app: the Explore-style recommendations list as a separate tab (folded into Routine and Concern detail) and the static "skin profile" page (split into C6 and D4).

---

## 13. Moving the current code to this design (for later)

- `mobile/theme/colors.ts`, `tokens.ts`: replace values with section 3 to 5 tokens; delete `constants/homeTheme.ts` and `constants/scanTheme.ts` once screens use `theme/`.
- Fonts: load Sora and DM Sans with `expo-font` in `lib/initialize-app.ts`.
- Icons: Material Symbols Rounded via a symbol font or SVG set; `@expo/vector-icons` MaterialIcons is the fallback.
- New shared components: `FaceMap`, `ConcernRow`, `StatusPill`, `OptionCard` (extend `components/prescan/OptionCard`), `SlotPicker`, `CaseRow`, `ReferralBanner`.
- Routing: add a role-based root (`app/(patient)/`, `app/(derm)/`) chosen after auth.

---

## 14. Open questions

- Payments for paid visits: JazzCash, Easypaisa, card, or pay at clinic first?
- Video visits: built in, or link out to Google Meet/WhatsApp for v1?
- Who verifies PMDC registrations, and how fast?
- Can a patient see the AI's confidence score, or only dermatologists?
- Final logo: this mark, or a designer's refinement of it?
