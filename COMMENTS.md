# Branch: gabriel/skeleton

## What was changed and why

### Problem
Every page showed *some* loading state while data fetched, but they were inconsistent and low-effort: a blank pulsing block, a bare "Loading…" text line, a spinning circle icon, or — on a few sections — nothing at all. None of them hinted at the shape of the content about to appear, so the page felt like it "popped" into existence rather than resolving smoothly. Fast loads could also flash a placeholder unnecessarily since nothing waited before showing one.

### What was built

#### 1. `app/composables/useDelayedLoading.ts` (new file)
Takes any `loading` ref and returns `{ showSkeleton, showProgressBar }`.
- `showSkeleton` only flips `true` if `loading` stays `true` past **500ms** — this stops the skeleton from flashing on fast responses.
- `showProgressBar` flips `true` past **10s** of continuous loading, for the rare very-slow request (not wired into every page yet — see "Left out of scope" below).

#### 2. `app/components/common/skeleton/` (new folder — 7 components)
- `SkeletonBase.vue` — the primitive. A shimmering block (`width`/`height`/`circle`/`rounded` props) with a left-to-right sweep, built from a new `shimmer` keyframe in `tailwind.config.ts`. Respects `prefers-reduced-motion` (disables the sweep, keeps the neutral block).
- `SkeletonStatGrid.vue` — KPI-tile grid (icon block + label line + value line), for dashboard/stat rows.
- `SkeletonTableRows.vue` — a handful of `<tr>` placeholder rows for `.his-table`/`alive-tbl` bodies.
- `SkeletonCardGrid.vue` — avatar + text-line cards, for patient/customer/asset grid results.
- `SkeletonPanel.vue` — title + a few label/bar rows, for chart/distribution panels.
- `SkeletonDetailHeader.vue` — avatar/icon + name + meta lines, for detail-page headers.
- `SkeletonProgressBar.vue` — the indeterminate bar for `showProgressBar` (component exists; not yet wired into any page — see below).

All of these auto-import globally (no import statements needed in pages) — confirmed via `nuxt.config.ts`'s `components.dirs` config (`~/components/common` is `pathPrefix: false, global: true`, and that applies to the `skeleton/` subfolder too).

#### 3. Shared components upgraded
- `app/components/common/StatCard.vue` and `DataTable.vue` now shimmer internally and route their `loading` prop through `useDelayedLoading` themselves. Any page passing `:loading` into these two gets the whole treatment for free — no page-level changes needed (this covers `billing/index.vue`, `inventory/disposals.vue`, `patients/encounters.vue`).

#### 4. Every page's loading state rewired
- **All 9 role dashboards** (`app/pages/dashboard/*.vue` except `index.vue`/`overview.vue`) — the old spinner card is now a `SkeletonStatGrid` + `SkeletonPanel`(s) + real `<thead>` with `SkeletonTableRows` in the body, matching each dashboard's actual grid/column layout.
- **List/search pages** — `patients/index.vue`, `customers/index.vue` (card-grid or table skeleton depending on the grid/list toggle), `inventory/index.vue` and `assets/overview.vue` Overview tabs, `assets/department.vue`.
- **Detail pages** — `patients/[uuid].vue`, `customers/[uuid].vue`, `assets/[uuid].vue`, `inventory/[uuid].vue`, `assets/inspect.vue`, `assets/maintenance.vue`, and the three customer sub-pages (`pre-costing`, `proforma-invoice`, `receipt`).
- **Redirect dispatchers** — `dashboard/index.vue` and `assets/index.vue` now show a brief generic skeleton instead of a spinning icon while the client-side role redirect resolves.
- **Secondary tab/modal loaders** on `customers/[uuid].vue` (pre-costing/proforma/receipt tab lists) and the pre-costing/proforma-invoice modals (add-item, adjust-taxes, receipts, payment-method dropdown) — spinning circles replaced with shimmer bars.

The only place that needed a genuinely *new* piece of state (rather than just swapping placeholder markup) was `assets/overview.vue`'s Overview tab: the `getDashboard()` call there had no loading flag at all, so a `loadingDash` ref was added purely to know when to show the skeleton. Nothing else about data-fetching, computed values, or business logic changed anywhere in this branch.

### Left out of scope (deliberately)
- **`billing/reports.vue`** and the **admin settings pages** (`users`, `customers`, `billing`, `departments/*`) — these all use static/dummy hardcoded data (some have `// TODO: useSettingsApi(...)` comments already). There's no real loading state to attach a skeleton to until they're wired to actual endpoints.
- **`login.vue`**, **`index.vue`** — no page content ever renders here (pure redirects / a login-button spinner), so nothing to skeleton.
- **Camera/OCR flows** (`IdScanner.vue`, the webcam-capture modal in `customers/index.vue`) — these show a spinner while the *camera* initializes or scans, not while *data* loads. There's no content shape to mirror, so a skeleton doesn't apply; the spinner stays.
- **Save/submit button spinners** (e.g. `saving`, `approveSaving`, `visitSaving`, the login submit button) were left untouched everywhere — those indicate a click-triggered action in progress, which is a different (and still correct) pattern from a content-loading skeleton.
- **`SkeletonProgressBar`** (the 10s-plus fallback) exists as a component but isn't wired into any page yet — every page currently just keeps showing the skeleton past 10s rather than switching to a progress bar. Wiring it in is a small follow-up (drop `<SkeletonProgressBar v-if="showProgressBar" />` next to the existing skeleton block, per page).
- Some secondary tabs inside `inventory/index.vue` and `assets/overview.vue` (Issues, Maintenances, Inspections, Damages, Disposals, Templates, Tools, Registers) still use plain `td`-level "Loading…" text rather than a shimmer skeleton. They already have *some* loading indication and weren't flagged as spinning circles, so they were left as a known follow-up rather than expanding this branch further.

### How it works (for developers)

Every skeleton follows the same recipe:
1. The page already has (or gets) a `loading`/`pending` ref from `useApi()`, `useDashboardData()`, or a local `ref(false)`.
2. `const { showSkeleton } = useDelayedLoading(loading)` — one line, near the ref's declaration.
3. In the template, swap `v-if="loading"` for `v-if="showSkeleton"` on the placeholder block, and add a sibling `v-else-if="loading" /` (empty) so nothing renders during the sub-500ms window — that's what avoids the flash.
4. Build the placeholder out of the shared `Skeleton*` components above, reusing the **same wrapper classes** (`rounded-xl bg-white/80 ... shadow-island`, the same `grid-cols-*` the real content uses) so there's no layout shift when real content swaps in.

To add skeleton loading to a brand-new page, copy this pattern from a page with a similar shape — `dashboard/oncologist.vue` for a dashboard, `patients/index.vue` for a list/search page, `patients/[uuid].vue` for a detail page.

### Testing

Real API responses are usually fast enough that skeletons won't visibly show. To see them:
1. Chrome DevTools → **Network** tab → set throttling to **Slow 3G** (or **Fast 4G**)
2. Reload the page — the skeleton should hold for at least ~500ms before real content appears
3. Toggle "Emulate CSS media feature `prefers-reduced-motion`" in DevTools' Rendering tab to confirm the shimmer sweep disables (the neutral block should still show, just without motion)

No new dependencies were added. No existing data-fetching or business logic was changed — only loading-state presentation, plus the one new `loadingDash` ref noted above.

### Follow-up fix (pre-existing bug, unrelated to skeleton loading)

On `inventory/index.vue`, `assets/overview.vue`, `inventory/[uuid].vue` and `assets/[uuid].vue`, hovering the *already-active* tab made it go white-on-white and unreadable. Cause: `.tab-btn:hover` (two selectors → higher CSS specificity) was overriding `.tab-active`'s blue background (one selector), even though `.tab-active` appeared later in the file. Fixed by scoping the hover rule to `.tab-btn:hover:not(.tab-active)` in all four files, so the active tab's blue background is never overridden.

