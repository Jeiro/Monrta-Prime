# Moneta Prime — Frontend Rebuild: Audit & Plan

Baseline: 127 source files, ~22,900 LOC, `tsc --noEmit` clean.
Branch: `rebrand/phase-1-moneta-prime`.

Direction (decided): **restrained premium** — depth from material, motion and
typography, no 3D/particles/glass — with **both themes, dark-first**.

---

## STATUS

**Done — Phase 0 (foundation), verified in a real browser at 320/375/1440.**

| Metric | Before | After |
|---|---:|---:|
| Off-token palette utilities | 123 | **4** (all third-party brand marks) |
| Arbitrary `text-[Npx]` sizes | 15 | **0** |
| Hardcoded non-brand surfaces | ~20 | **0** |
| Hardcoded hexes in charts | 24 | **0** |
| `bg-black` modal backdrops | 6 | **0** |
| Light mode | none | **full second palette** |

Shipped:
- `src/styles/tokens.css` — both palettes authored, contrast-checked.
  Light needed its own accent (`#6AA5FF` is 2.1:1 on white — unusable),
  and its own positive/negative (exchange green is 1.9:1 on white).
- `@theme inline` mapping in `index.css` — the indirection that lets ~4,000
  existing utility usages become theme-aware with **zero component edits**.
- `warning` / `line-strong` / `overlay` / `*-soft` / `*-line` tokens; motion
  duration + easing tokens; theme-aware elevation ramp.
- `ThemeProvider` + no-flash inline bootstrap in `index.html`; `ThemeToggle`
  (nav) and `ThemeSegmentedToggle` (3-state, for Settings).
- Charts re-tokenised to CSS custom properties — they recolour on theme
  switch with no re-render and no JS reading the theme. TradingView (iframe,
  unreachable by CSS) gets an explicit palette and rebuilds on change.

**Done — Phase 1 primitives** (built, typechecked, not yet adopted app-wide):
`Button` (loading/icon/press-feedback), `Modal` + `Drawer` (focus trap,
Escape, scroll lock, bottom-sheet on mobile), `DataTable` (**stacked cards
below `sm`, not a horizontal scroller**), `Tabs` (sliding shared-element
indicator, full ARIA keyboard model), `Select`, `Tooltip`, `Skeleton`,
`EmptyState`, `AnimatedNumber` (counts on mount and on material change only
— never on every tick, or a live balance is permanently unreadable),
`useFocusTrap`.

**Defects fixed along the way**
- Header bleed-through fixed *at the cause* — `h-16` fought the inner row's
  `py-5`; the tagline then wrapped and burst the bar at ≤375px.
- `animate-pulse` removed from the sign-out button (a throbbing destructive
  action).
- Root shell had hardcoded `text-[#F5F6F8]` — invisible text in light mode.
- Nav icons carried five decorative colours; now inherit `currentColor`.
- Password-strength ramp ran red → **blue** → amber → green; the accent was
  encoding an outcome. Now negative → warning → positive.
- Decorative background was tuned for a black page and bled through tables in
  light mode; now driven by a `--mp-decor-opacity` dimmer.

**Done — first vertical slice: Dashboard Overview**, rebuilt end-to-end on
the primitives as the reference for the other 21 screens.

| | Before | After |
|---|---:|---:|
| Raw `<button>` | 11 | **2** (both legitimately not buttons — a copy affordance inside a chip, and a badge-as-link) |
| Raw `<input>` | 1 | **0** |
| Raw `<table>` | 1 | **0** (now `DataTable` → stacked cards on mobile) |
| Hand-rolled progress bars | 3 | **0** (`Progress`, with real ARIA values) |
| Ad-hoc empty states | 3 | **0** (`EmptyState`, all three now carry an action) |

Also added while doing it: `Progress`, `SectionCard`/`SectionCardAction`
(the card+header+action pattern appeared 4× on this screen alone), and
`formatMoney`/`formatCompactMoney` — the `$${n.toLocaleString(...)}` idiom
appeared ~20 times here with inconsistent options, so the same figure could
render `1,204.5` in one card and `1,204.50` in the next.

Two content decisions worth confirming:
- **Removed the "Security: High" chip.** It was hardcoded — identical for
  every account regardless of actual security posture. A fabricated
  assurance on a trust surface is worse than none. If you want it back it
  needs to be derived from something real (2FA on, KYC state, session age).
- **"Unverified identity" is now a link**, not a dead status pill — it goes
  to KYC, which is the thing that resolves it.

Note: the file grew 596 → 719 lines. The JSX itself shrank; the growth is
explanatory comments plus empty states that now carry real copy and a
route forward. The `DashboardOverview` chunk went 26.8 kB → 35.9 kB because
the primitives currently land in it; that amortises as other screens adopt
them and Rollup hoists the shared code.

**Done — second slice: Wallet** (753 → 735 lines).

| | Before | After |
|---|---:|---:|
| Raw `<button>` | 12 | **1** (the hidden file input's trigger) |
| Raw `<input>` | 11 | **1** (the hidden `type="file"`, correct) |
| Raw `<table>` | 1 | **0** |
| Ad-hoc feedback banners | 2 | **0** (`Alert`, errors get `role="alert"`) |
| Hand-rolled choice grids | 3 | **0** (`ChoiceGrid`, a real `radiogroup`) |

New primitives it forced out: `ChoiceGrid` (three identical hand-rolled
button grids with no grouping semantics — a screen reader heard seven
unrelated buttons), `Alert` (inline form feedback, distinct from a toast
because it must persist while the user fixes the problem), and
`prefix`/`suffix` on `Input` so a currency field shows its unit.

**Bugs found and fixed in Wallet**
- 🚩 **XRP deposit destination tag was hardcoded to `108253`** and shown to
  every user as *"Your XRP Deposit Destination Tag (Required)"*.
  `DepositWallet` has no tag field, so this was an invented number. On XRP
  the destination tag is what attributes a deposit to an account, so a
  single shared fake tag risks uncreditable deposits. **Now fails safe**: it
  states a tag is required and routes to support instead of printing a
  number we made up. *Needs a real fix — see below.*
- Ledger status column showed a **green checkmark on every row**, including
  pending and rejected.
- Ledger category column painted **everything except deposits red** —
  investments, payouts and adjustments all read as failures.
- The file-upload drop zone was a `<div onClick>` — mouse-only, unreachable
  by keyboard. Now a real `<label>` bound to the input.
- Dead imports (`Sparkles`, `Search`, `Lock`, `Download`, `Info`) and a
  `text-sans` typo (not a class) removed.

**Done — third slice: Trading** (397 → 483 lines; grew because the order
summary and watchlist filter are new).

| | Before | After |
|---|---:|---:|
| Raw `<button>` | 13 | **4** (segmented-control radios, correct as-is) |
| Raw `<input>` | 4 | **0** |
| Raw `<table>` | 1 | **0** |

**Bugs found and fixed in Trading**
- 🚩🚩 **The leverage slider (1x–50x) was not wired to anything.**
  `executeTrade` takes no leverage argument, and its body does
  `if (user.balance < amount)` then deducts the full amount. But the order
  summary rendered `Order Cost: amount / leverage` — so a $1,000 order at
  50x displayed **"Order Cost: $20"** while $1,000 was required and taken.
  A false cost figure on the confirm step of a financial transaction.
  **The control is removed**, not restyled, until margin exists end to end.
- 🚩 **"🟢 HEDGED COLD SECURE"** was hardcoded on every open position — an
  unfounded claim about custody and risk posture. Removed; the column is
  now position value.
- `animate-pulse` on the mark price and on every live price cell in the
  positions table — permanently throbbing numbers.
- The watchlist rows were `<div onClick>`: the entire pair selector was
  unreachable by keyboard.
- The "active pair" button scrolled via
  `document.querySelector(".lg\\:col-span-3")` — a DOM lookup keyed to a
  Tailwind layout utility, which breaks silently if the grid changes. Now a
  ref.
- **Mobile IA:** the order ticket sat below the watchlist *and* a 420px
  chart. Below `lg` the order is now chart → ticket → watchlist.

**Done — remaining user-facing screens.** Portfolio, Transactions, KYC,
Support, Notifications, Airdrops, Markets, and the three GlobalModals
dialogs are on the primitives.

More defects fixed in that pass:
- **Scroll lock leaked.** GlobalModals locked on "any modal open" while each
  Modal also locked on its own `open`. Both restored the previous overflow,
  but the inner captured `hidden` (the outer had already applied it) and
  React runs the parent cleanup first — so closing a modal restored `""` then
  re-applied `hidden`, leaving the page unscrollable until reload.
  `useBodyScrollLock` is now reference-counted.
- 🚩 **Portfolio's "Allocation Weights" radial gauge was two dashed rings on
  CSS spin animations.** Nothing was derived from the data while it read as a
  chart. Replaced with sorted weight bars.
- **KYC's six form fields were labelled by placeholder only** — names
  vanished on typing and never existed for a screen reader.
- Transactions printed `{tx.timestamp || tx.date}` verbatim (raw ISO string);
  Airdrops did the same with campaign dates.
- Markets' sortable `<th>`s were bare `onClick` — no button, no `aria-sort`,
  unreachable by keyboard. Sorting is now a `DataTable` feature.
- Markets forced `min-w-[700px]`, giving phones a horizontal scroller.
- Emoji tab labels replaced with icons.
- Copy: Markets' loading state named the upstream provider and asserted
  "securely"; the footer claimed "deep global liquidity" and "ultra-low
  latency".

### App-wide migration progress

| | Baseline | Now |
|---|---:|---:|
| Raw `<button>` | 220 | **187** |
| Raw `<input>` | 85 | **63** |
| Files with `<table>` | 11 | **8** (all admin) |
| Off-token palette utilities | 123 | **4** (brand marks) |

**Done — admin panel** (verified signed-in with an admin account).

The three approval queues — Deposits, Withdrawals, KYC — all had the same
structural defect: an editable notes field and two irreversible action
buttons were *table columns*. With 11–12 columns that forced
`min-w-[1180px]`–`[1280px]`, so in the browser the notes textarea rendered
as a vertical sliver and **Reject sat off the right edge, unreachable
without scrolling a table most admins wouldn't realise scrolled.**

Review now happens in a `Drawer` opened from the row. Tables drop to 6–8
columns with no horizontal scroll, and the wallet address, transaction hash
and KYC documents get room to be read in full rather than truncated to
180–250px — which matters, since verifying those values is the whole point.

More admin defects fixed:
- 🚩 **Approve/Reject were `bg-positive`/`bg-negative` with `text-ink`** —
  near-white on green and red. Their hover states were `hover:bg-positive` /
  `hover:bg-negative`, *identical to the resting colour*, so neither button
  gave any hover feedback.
- 🚩 **Withdrawals gated payouts behind `window.confirm()`** — blocks the JS
  thread, can't be themed, suppressible in some browsers. Replaced with an
  in-drawer two-step that names the amount and destination it's releasing.
- The KYC notes input rendered on **every** row including already-reviewed
  ones, where typing in it did nothing because the actions were hidden.
- Financial Ledger and Traders List each forced a horizontal scroller by
  splitting pairs across columns (User ID / User Name, Amount / Currency,
  Status / Featured). Consolidated: 9→7 and 10→7.
- Five more local `formatMoney`/`formatDate` helpers retired.

Adds `AdminTabShell` for the header/stat-tile chrome each tab rebuilt by hand.

**Verified:** all 15 admin tabs render, no console errors, and no table
overflows its container.

### App-wide migration progress

| | Baseline | Now |
|---|---:|---:|
| Raw `<button>` | 220 | **177** |
| Raw `<input>` | 85 | **59** |
| Files with `<table>` | 11 | **4** (3 admin + the primitive) |
| Off-token palette utilities | 123 | **4** (brand marks) |

**Still not migrated:** three admin tables (Users, Airdrops, Traders —
none of which overflow), the remaining raw buttons/inputs concentrated in
`AuthPage` and `Navigation`, the dashboard sidebar shell, the full motion
pass, a dedicated a11y audit, and the bundle work.

---

## Open items needing a decision

1. **XRP destination tag (blocking for XRP deposits).** Proper fix is a
   `destination_tag` column on the deposit-wallet record — or, if tags are
   meant to be per-user, a per-account tag issued at signup. Currently the
   UI tells XRP depositors to contact support.
2. **Unrealised-P/L placement** on the dashboard is my judgement call. A
   genuine day-over-day equity change needs a stored previous-day snapshot,
   which doesn't exist yet.
3. **"Security: High"** was removed as fabricated. If it returns it needs a
   real derivation (2FA state, KYC, session age).
4. **Leverage / margin (blocking if you intend to offer it).** The UI
   advertised up to 50x and computed a reduced order cost from it, but no
   part of the execution path supports margin. Either implement it properly
   (position sizing, margin held, liquidation price, funding) or leave it
   out. It cannot go back as a UI-only control.
5. **"🟢 HEDGED COLD SECURE"** — if any custody claim is to be displayed, it
   needs to be true and sourced from something.

### A pattern worth naming

Four of the five items above are the same failure: **a UI element that
asserts something the system does not do.** Fabricated security ratings,
a mislabelled P/L, an invented XRP tag, a decorative leverage control, a
hardcoded custody claim. None were styling bugs; all were found only by
reading the data path behind a component while restyling it.

The remaining screens should be read with the same suspicion rather than
just restyled — particularly Plans (advertises returns), Copy Trading
(advertises trader performance), and the Admin approval queues.

**Verification note:** the dashboard is behind Clerk auth and I have no
credentials, so it was screenshotted via a temporary unguarded preview route
(since removed) in a signed-out state — which exercises the empty states,
header, stat tiles and chart, but *not* the populated states (investment
cards, copy-trade cards, the transactions table with rows). Those are
typechecked and built but not visually confirmed. Worth a look next time
you're signed in.

---

## Part 1 — Audit

### 1.1 The headline finding: the design system exists but is orphaned

`src/components/ui/` contains a genuinely good, opinionated system — `Button`,
`Card`, `Input`, `Badge`, `StatCard`, `Section`/`Container`/`SectionHeading`,
plus a token file with a documented one-accent rule, an 11-step type scale and
a 3-step vertical rhythm.

Adoption across the app:

| Primitive | Component usages | Raw HTML usages |
|---|---|---|
| `Button` | **0** | 220 `<button>` |
| `Input`  | **0** | 85 `<input>` |
| `Card`   | **0** (0 files) | — |
| `StatCard` | 1 file (added last commit) | — |

Phase 1 built the system. Nothing was migrated onto it. Every "inconsistent
button / weak hierarchy / ad-hoc spacing" symptom downstream traces back to
this one fact. **This is the main body of work, and it is not cosmetic.**

### 1.2 Token compliance

- **123 off-token colour utilities** still in `.tsx`, concentrated in a
  yellow/amber cluster (the pre-rebrand gold) — `text-yellow-400` ×24,
  `bg-yellow-500` ×23, `border-yellow-500` ×21, plus amber. Present in
  **24 files**, including *every one of the 9 admin tabs*.
- **Root cause: there is no `warning` token.** `@theme` defines `positive`
  and `negative` but nothing for pending/caution — so 24 files improvised.
  `Badge.tsx` itself ships `bg-amber-400/10 text-amber-300`; the design
  system violates its own rule because the token is missing.
- 225 hardcoded hex literals. A minority are legitimate (third-party brand
  marks — BTC `#F7931A`, ETH `#627eea`, Solana `#9945FF`, Visa, Netflix).
  The rest are off-system (`#06080d` ×14, `#252A33`, `#94a3b8`, …).
- **Type-scale leaks:** `text-[40px]`, `text-[64px]`, `text-[34px]`,
  `text-[30px]`, `text-[25px]`, `text-[22px]`, and `text-[10px]` ×4 —
  the last directly breaks the stated "11px is the floor, nothing smaller
  ships" rule.
- 3 files still use legacy `.orb-panel` / `.orb-button` (AuthPage ×10).

### 1.3 Light mode does not exist

Zero `dark:` variants, zero `prefers-color-scheme`, no theme context or
toggle anywhere in `src/`. The palette is a single hardcoded dark set.
Supporting light mode is a real build: tokens must be restructured onto
semantic CSS custom properties with a `[data-theme]` switch.

### 1.4 Motion is entry-only

| Primitive | Count |
|---|---|
| `initial=` / `animate=` | 72 / 70 |
| `AnimatePresence` | 17 |
| `whileHover` | 5 |
| `whileTap` | **0** |
| `layoutId` (shared element) | **0** |
| route transitions | **0** |

Things fade in on mount and then the interface is inert. No press feedback,
no shared-element continuity, no route transitions, no number transitions on
values that tick. `motion` v12 is already a dependency and is barely used.

One outright defect: `Navigation.tsx:210` puts `animate-pulse` on the
**sign-out** button — a permanently throbbing destructive action.

### 1.5 Accessibility

Across all 127 files: **6** `aria-label`, **5** `role=`, **6** `alt=`.
220 raw `<button>`s means focus states rely entirely on the global
`:focus-visible` rule. No skip link, no landmarks beyond one `role="navigation"`,
no `aria-live` for the toast/notification surface, no labelled form controls
outside the unused `Input`. `prefers-reduced-motion` *is* handled globally in
`index.css` — that part is already right.

### 1.6 Navigation & information architecture

- The dashboard has **12 routes** but no sidebar — everything funnels through
  a top bar and a hamburger.
- Authenticated desktop nav shows 5 links and hides **7** behind "More",
  including **Notifications with its unread badge**. The one item that needs
  to be seen is the one that's buried.
- Nav icons use **five** different colours (`accent`, `positive`,
  `accent-hover`, `muted`, `negative`) as decoration — the token file
  explicitly forbids this ("never use them for emphasis").
- `nav` is `h-16 sm:h-20` while its inner div sets `py-5 sm:py-6 lg:py-4`;
  the padding fights the fixed height. This is the "header bleed-through"
  patched last commit — patched at the symptom, not the cause.
- ~~`handleNavigate` force-redirects every navigation to `/admin`.~~
  **Corrected on closer reading:** this is deliberate. Admin confinement to
  `/admin` is enforced in three separate places — `handleNavigate`
  (`App.tsx:184`), a render-level redirect (`App.tsx:246`), and `Navigation`
  returning `null` for admins. It's a design decision, not a defect, and is
  being left alone.

### 1.7 Tables

Hand-rolled `<table>` markup in **11 files** — 9 admin tabs plus Markets,
Wallet, Trading, Overview. Each re-implements its own header styling, status
pill, empty state, and horizontal-scroll behaviour. No shared `DataTable`,
no consistent mobile strategy (73 `whitespace-nowrap`/fixed-width/`overflow-x`
occurrences are the workaround).

### 1.8 What is already good — and should be protected

- The token file's reasoning (one accent, semantic-only colour, depth from
  surface steps not shadow stacks) is correct and better than most fintech UIs.
- Tabular figures (`font-data` + `tnum`) on all money. Non-negotiable, keep.
- Route-level `lazy()` code splitting is already in place for all 22 pages.
- `DecorativeErrorBoundary` around the animated background — thoughtful.
- The `VIEW_TO_PATH` compatibility layer: 90+ legacy call sites mapped
  without touching them.

---

## Part 2 — Plan

Sequenced so the app stays shippable after every phase. No big-bang rewrite:
a 23k-LOC app wired to Clerk + Supabase does not survive one, and the
functionality is the one thing that must not regress.

### Phase 0 — Foundation *(direction-dependent)*
Restructure `@theme` onto semantic custom properties; add the missing
`warning`/`info` tokens; add light mode + `[data-theme]` switch and a toggle;
add elevation, motion-duration and easing tokens. Fix the type-scale leaks.

### Phase 1 — Component layer
Extend the primitives to cover what the app actually uses, then migrate onto
them. New: `DataTable`, `Modal`/`Drawer`, `Select`, `Tabs`, `Tooltip`,
`Skeleton`, `EmptyState`, `Pagination`, `Toast` (restyled `react-hot-toast`),
`Avatar`, `Progress`, `AnimatedNumber`. Migrate 220 buttons / 85 inputs /
all 11 tables. Retire `.orb-*`.

### Phase 2 — Navigation & shell
Persistent dashboard sidebar (rail on tablet, bottom bar + sheet on mobile),
public nav rebuilt, notifications surfaced, header sizing fixed at the cause.

### Phase 3 — Screens
In dependency order: Dashboard → Wallet → Trading → Portfolio → Plans →
Transactions → KYC/Support/Notifications → Admin (9 tabs) → Auth →
Public/marketing.

### Phase 4 — Motion & charts
Route transitions, press feedback, shared-element continuity, counting
figures, chart entry animation. Recharts upgraded with custom tooltips,
crosshair, gradient fills; TradingView widget themed to match.

### Phase 5 — Accessibility & responsive hardening
Landmarks, labels, focus management in modals/drawers, `aria-live` regions,
skip link, keyboard paths. Verify at 320 → 1920.

### Phase 6 — Performance
Bundle audit, lazy-load heavy sections, GPU-transform-only animation,
layout-shift check.

---

## Part 3 — The one decision that gates everything

The brief cites Apple, Linear, Stripe, Arc, Revolut, Coinbase — and also asks
for 3D coins, floating particles, glass, heavy gradients.

These are two different design languages, and the reference set only supports
the first: **none of Stripe, Linear, Revolut, Coinbase or Arc use 3D coins or
particle fields in-product.** In fintech specifically, floating 3D crypto
assets are the visual signature of low-trust platforms — they read as
"airdrop scam," not "expensive." Trust *is* the premium signal here.

There is also a hard cost: React Three Fiber + drei is ~500 KB gzipped
against a bundle whose 22 routes are currently lazy-loaded to stay small,
and it conflicts with the Lighthouse/60fps requirement in the same brief.

My recommendation: **restrained-premium** — depth from materials, motion and
typography rather than ornament — with one lazy-loaded WebGL moment on the
public hero only, where it costs nothing on the authenticated path.

This is the user's call and it determines every line that follows.
