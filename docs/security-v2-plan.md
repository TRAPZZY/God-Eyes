# God Eyes Security and Product V2 Plan

## Context

The current production deployment exposes Convex functions without verified
identity or ownership checks. The recent source history also contains a group
of `OpenClaw Bot` commits that replaced the previous authentication path with
placeholder session functions. This plan replaces that unsafe path; it does not
assume that the bot activity was authorized.

### Verified baseline (2026-09-09)

- The public deployment currently fails at its authentication query rather than
  rendering the application.
- The local production build succeeds and the existing suite reports 12 passing
  tests, but those tests do not exercise sign-in, authorization, or record
  ownership.
- `npm audit --omit=dev` reports 10 production advisories: 2 critical, 5 high,
  and 3 moderate. Directly affected packages include `@convex-dev/auth`,
  `convex`, `axios`, and `react-router-dom`. Dependency updates require an
  explicit approved change because they can alter authentication and routing
  behavior.
- The map popup previously embedded a saved location name as raw HTML. That
  stored cross-site-scripting path is now escaped and covered by a regression
  test; the remaining work must still prevent unauthorized users from creating
  or viewing locations in the first place.
- The live homepage has HSTS but no Content-Security-Policy, frame-ancestor,
  MIME-sniffing, referrer, or permissions-policy headers. It also sends a
  broad `Access-Control-Allow-Origin: *` header for the public HTML response.

## Security outcomes

1. A request without a valid Convex Auth session cannot read, create, change,
   or delete operational data.
2. Every data record is owned by the authenticated user, and every lookup
   verifies that ownership before returning or changing it.
3. Password authentication uses Convex Auth rather than client-controlled
   placeholder mutations. Sign-in, sign-out, and route gating use its supported
   React provider and hooks.
4. Existing unauthenticated API entry points are removed or become fail-closed.
5. The production frontend serves a restrictive, verified security-header set
   and does not expose credentials through the build.
6. GitHub and Vercel controls prevent a repeat: MFA, protected deployment
   settings, secret scanning, dependency alerts, and a constrained CI path.

## Product V2 outcomes

1. The application looks and behaves like a focused operations console, not a
   generic prototype: consistent navigation, real empty/loading/error states,
   deliberate information hierarchy, and responsive map-first workflows.
2. Security status, account state, and data ownership are explicit in the
   interface without exposing sensitive operational details.
3. Large dashboard features remain code-split and the production build stays
   within the existing dependency footprint unless a later change is approved.

## V2 design direction

- **Purpose over theatre.** The first screen should answer what needs attention,
  where it is, and what the operator can do next. It should not simulate a
  military interface with invented latency, health signals, or clearance data.
- **Map-first workspace.** The Monitor route becomes the visual center of the
  product: the map owns the page, with a compact command rail, layered site
  details, and clear capture/monitoring controls.
- **Quiet intelligence aesthetic.** Use a restrained graphite surface, warm
  off-white text, a single signal-blue accent, and a meaningful amber/red
  severity scale. Typography will use a practical sans-serif hierarchy with
  compact numeric detail, rather than all-caps labels and decorative glow.
- **Honest states.** Loading, empty, unavailable, and error states will name
  the real condition and offer a specific recovery action. Metrics will only
  report data the backend actually provides.
- **Responsive operations.** Desktop uses a utility rail and split workspace;
  narrow screens use a top bar, touch-friendly panels, and a full-height map.

## Delivery slices

1. **Containment and auth foundation** — restore supported Convex Auth
   configuration, auth tables, and a real password provider. Deploy only after
   the backend configuration and key material are present.
2. **Ownership enforcement** — use authenticated identity in locations,
   captures, schedules, alerts, changes, and stats. Add regression tests for
   anonymous and cross-user requests.
3. **Client integration** — replace placeholder login/registration and route
   gating with Convex Auth. Leave users signed out until a valid session exists.
4. **Vercel hardening** — add response headers, keep Git fork and preview
   protection enabled, and verify the Mapbox public token is URL-restricted at
   Mapbox rather than treated as a secret.
5. **Operations-console V2** — improve the authenticated shell, dashboard,
   monitor, and timeline around live data and resilience states.

## Data decision

The live placeholder code records an invalid empty owner ID and never stores a
password. Existing records cannot be safely attributed to a person from this
code alone. The remediation must preserve them without exposing them; restoring
access will require an explicit owner-claim/migration decision after the new
authentication layer is live. No production data will be deleted by this plan.

## Acceptance checks

- Anonymous and cross-user Convex calls are rejected by tests.
- Authenticated users can only see and mutate their own records.
- Login and registration establish a real Convex Auth session; invalid
  credentials never create a session.
- `npm run build`, the focused test suite, and the deployed preview succeed.
- Production responses include the intended security headers and protected
  previews remain inaccessible to unauthenticated visitors.
