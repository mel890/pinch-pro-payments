# VezaPT Pay

**Performance-based compensation for personal trainers — powered by [Pinch Payments](https://getpinch.com.au).**

🎬 **Live pitch demo:** https://pinch-pro-payments.lovable.app/pitch-demo
🖥️ **Interactive prototype:** https://pinch-pro-payments.lovable.app/

---

## The pitch

Gyms sell personal training, but the money model is broken on both sides.

- **Trainers** are paid a flat hourly rate whether the client shows up, progresses, or churns. There is no upside for the behaviours that actually retain members — following up, capturing a review, rebooking, celebrating a win.
- **Clubs** carry the cash, the admin and the churn risk. They can't see which trainer is actually driving retention until the member is already gone.
- **Members** buy a pack, drift after session two, and quietly stop coming.

**VezaPT Pay turns trainer pay into an outcome engine.** Every session is verified by the member (QR check-in + feedback), every revenue split is computed server-side against the club's tier rules, and every growth action a trainer completes triggers a real, instant payout through Pinch.

The result: trainers earn more when members progress, clubs see retention lift instead of guessing at it, and members get a coach who is financially aligned with them showing up.

### The journey the demo tells

Alex buys a **$249 PT Kickstart Pack** → VezaPT auto-matches him to Sarah → three QR-verified sessions are delivered → feedback shows confidence 5→8 and weekly visits 1.4→2.6 → Sarah recommends ongoing coaching → Alex converts to **$180/week recurring**, created live against the Pinch API.

One member. One pack. One conversion. Every money movement is a Pinch primitive.

---

## Pinch integration summary

Pinch is the payments rail for the entire product — one-off pack purchases, contingent growth-action payouts, and recurring coaching subscriptions.

| Area | Detail |
| --- | --- |
| **Environment** | Sandbox — `https://api.getpinch.com.au/test/` |
| **Auth** | OAuth2 `client_credentials` against `https://auth.getpinch.com.au/connect/token`, cached bearer token with 30s expiry buffer |
| **Required header** | `pinch-version: 2020.1` on every API call |
| **Placement** | 100% server-side. No Pinch credential, token or endpoint is ever reachable from the browser bundle. |
| **Money units** | Integer cents everywhere — DB, API payloads and split maths. Formatted to AUD only at the render layer. |

### Endpoints used

| Operation | Endpoint | Where |
| --- | --- | --- |
| Create payer | `POST /payers` | `src/lib/pinch.server.ts` |
| Hosted checkout for a pack | `POST /payment-links` | `createCheckout` in `src/lib/vezapt.functions.ts` |
| Create recurring plan | `POST /plans` | `src/routes/api/public/tmp-create-plan.ts` |
| Create subscription | `POST /subscriptions` | `createPitchSubscription` in `src/lib/pitch-demo.functions.ts` |
| Payment webhooks | inbound `POST` | `src/routes/api/public/pinch-webhook.ts` |

### Sandbox objects created for the demo

```
plan          pln_6qdLMW91FqQbBL   "Twice-Weekly Coaching" — $180.00 every 7 days, endType: never
payer         pyr_cD59b4ld61yQfH   deterministic demo payer (Alex Morgan)
subscription  sub_*                created live, on camera, at demo step 8
```

### Key implementation files

```
src/lib/pinch.server.ts             OAuth token cache, pinchFetch helper, response extractors,
                                    redacted diagnostics (never logs secrets)
src/lib/vezapt.functions.ts         Server functions: checkout, payments log, session RPCs, splits
src/lib/pitch-demo.functions.ts     The single real API call in the pitch demo — subscription create
src/routes/api/public/pinch-webhook.ts   Inbound payment event receiver
```

### Security posture

- Credentials live in server-side secrets (`PINCH_CLIENT_ID`, `PINCH_CLIENT_SECRET`), never in the repo or the client bundle.
- Diagnostic logging is redacted — `sanitizedAuthInfo()` emits only presence flags and an 8-char client-id prefix.
- Member-facing surfaces never render trainer payouts, club fees or bonus amounts. That separation is enforced in the components, not just by convention.

---

## Demo walkthrough

### A. The pitch demo — `/pitch-demo`

A presenter-controlled, ten-step scripted walkthrough built for a recorded pitch. Three synchronised panels advance together: **Manager Dashboard** (navy/cyan), **PT App phone** (violet) and **Member phone SMS** (green). Pinch money moments are highlighted in cerise.

Advance with the **Next** button or the arrow keys.

| # | Step | What to point at |
| --- | --- | --- |
| 1 | Idle — campaign live | Baseline dashboard. Club has a Kickstart campaign running. |
| 2 | Alex buys Kickstart | $249 payment received. Revenue splits: **$199 to Sarah, $50 club fee.** |
| 3 | VezaPT auto-matches | Alex's goal is matched to Sarah's specialism and capacity. |
| 4 | Sarah accepts | Opportunity card in the PT app; member gets a welcome SMS. |
| 5 | Session 1 — QR check-in | Member SMS carries a QR code. Sarah taps **Scan check-in** and *both* screens resolve together — member flips to "Checked in ✓", PT app to "Session 1 verified ✓ — Understand". |
| 6 | Sessions 2 & 3 | Hit **▶ Play sessions** to auto-advance. Dashboard walks 1/3 → 3/3. |
| 7 | Feedback captured | Member pulse updates — confidence 5→8, weekly visits 1.4→2.6, goal clarity 4→8. |
| 8 | Sarah recommends ongoing | Twice-Weekly Coaching offer, $180/week. |
| 9 | **Alex agrees — Pinch** | ⚡ **The one real API call.** A live `POST /subscriptions` hits the Pinch sandbox and returns a genuine `sub_*` id. Everything else in this demo is scripted; this is not. |
| 10 | Conversion lands | Dashboard recurring revenue, conversions and 90-day retention all tick up. |

**Presenter notes**
- Step 9 is the moment to slow down — the subscription id on screen is a real object in Pinch's sandbox and can be looked up afterwards.
- Every other panel transition is local state, so the demo is safe to run on unreliable conference wifi. Only step 9 needs the network.
- Member surfaces deliberately show zero money. Call that out — it's the trust boundary of the product.

### B. Interactive prototype — `/`

The same story, driven by the presenter rather than the script, with the contingent-payout state machine on the manager dashboard: activate a growth action (e.g. Google Review, +$15) → it appears **pending** in Sarah's app → Sarah taps *Mark as asked* → the member receives a money-free SMS → the member acts → the bonus flips to **Completed ✓ +$15 via Pinch** and a cerise payout event lands on the dashboard.

Member-led actions (review, referral, IG) stay pending until the member acts. Trainer-led actions complete on the trainer's action.

### C. Supporting screens

| Route | Purpose |
| --- | --- |
| `/pay` | Client checkout — product ladder and intake wizard |
| `/trainer` | Trainer home — sessions, splits, growth actions |
| `/me` | Client home — progress and confirmations |
| `/dashboard` | Manager dashboard — revenue, verification, exceptions |
| `/complete-session`, `/checkin`, `/confirm-session/demo` | Session verification lifecycle |
| `/exceptions` | Manager exception queue — sessions needing action |
| `/demo-console` | Technical integration console — live Pinch calls, env checks, raw responses |

### D. Session verification model

Payouts are only as trustworthy as the session record behind them, so a session moves through five verified stages:

**Booked → QR issued (30 min before) → Checked in → Awaiting feedback → Verified**

The trainer scans the member's QR to check them in, completes a short delivery form (delivered? next booked? client win?), and the session verifies on member feedback or a 12-hour no-dispute timeout. Anything that stalls surfaces in the manager exception queue. AI is used narrowly — session win summaries and follow-up drafts only, never for money decisions.

---

## Tech stack

- **TanStack Start** (React 19, SSR, server functions) on Vite 7
- **Tailwind CSS v4** with a dark instrument-panel design system
- **Supabase** — `clubs`, `trainers`, `members`, `split_tiers`, `pt_packs`, `sessions`, `payments_log`; splits computed server-side via the `log_pt_session` and `confirm_pt_session` RPCs
- **Pinch Payments** — payment links, plans, subscriptions, webhooks

Server-side logic lives in `createServerFn` handlers under `src/lib/*.functions.ts`; secret-holding helpers are isolated in `*.server.ts` files that are blocked from the client bundle.

## Running locally

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Required server environment variables:

```
PINCH_CLIENT_ID
PINCH_CLIENT_SECRET
PINCH_API_BASE                        # defaults to https://api.getpinch.com.au/test/
VEZAPT_SUPABASE_URL
VEZAPT_SUPABASE_SERVICE_ROLE_KEY
VEZAPT_SUPABASE_PUBLISHABLE_KEY
```

The `/pitch-demo` and `/` walkthroughs run entirely on local state apart from the single subscription call, so the demo is usable without Supabase configured.

## Built with

[Lovable](https://lovable.dev) — describe what you want, and it ships.
