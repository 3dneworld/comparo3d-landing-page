# Legacy RUM Compatibility And Alert Failover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent legacy browsers from crashing RUM and prevent duplicate client-error emails while retaining an independent fallback channel.

**Architecture:** Load `web-vitals` dynamically only after a capability guard passes. Deliver client errors serially to Flask, falling back to the Cloudflare Worker only when Flask cannot acknowledge the event.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Cloudflare Workers.

---

### Task 1: Guard RUM initialization

**Files:**
- Create: `src/lib/webVitals.test.ts`
- Modify: `src/lib/webVitals.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing compatibility tests**

Create tests that remove `Array.prototype.at`, pass a loader spy to
`initWebVitals`, and assert that the loader is not called. Add a supported-path
test with five metric registration spies and assert that each is called once.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/lib/webVitals.test.ts`

Expected: FAIL because `initWebVitals` does not accept an injected loader and
the current static dependency executes the unsupported code path.

- [ ] **Step 3: Implement guarded dynamic loading**

Use an erased type import and a default loader:

```ts
type WebVitalsApi = Pick<
  typeof import("web-vitals"),
  "onCLS" | "onFCP" | "onINP" | "onLCP" | "onTTFB"
>;

const loadWebVitals = (): Promise<WebVitalsApi> => import("web-vitals");

export async function initWebVitals(
  loader: () => Promise<WebVitalsApi> = loadWebVitals,
): Promise<void> {
  if (typeof window === "undefined" || typeof Array.prototype.at !== "function") return;
  try {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await loader();
    onLCP(send);
    onINP(send);
    onCLS(send);
    onFCP(send);
    onTTFB(send);
  } catch {
    // RUM is best-effort and must never affect the customer flow.
  }
}
```

Call it from `main.tsx` as `void initWebVitals()`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/lib/webVitals.test.ts`

Expected: PASS.

### Task 2: Make the Worker a real fallback

**Files:**
- Modify: `src/lib/clientErrorReporter.test.ts`
- Modify: `src/lib/clientErrorReporter.ts`

- [ ] **Step 1: Replace the parallel-delivery test with failover tests**

Test that a 204 Flask response produces exactly one fetch to
`/api/client-error`. Test that a rejected Flask fetch produces a second fetch to
the Worker `/client-error` endpoint with the same payload.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/clientErrorReporter.test.ts`

Expected: FAIL because the current implementation always calls both channels.

- [ ] **Step 3: Implement bounded serial failover**

Add a small backend-delivery helper with an `AbortController` timeout. Return
after an `ok` Flask response; otherwise post the same payload to the Worker and
swallow delivery errors.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/lib/clientErrorReporter.test.ts`

Expected: PASS.

### Task 3: Verify and deploy

**Files:**
- Verify: `src/lib/webVitals.test.ts`
- Verify: `src/lib/clientErrorReporter.test.ts`
- Verify: generated `dist/assets/*`

- [ ] **Step 1: Run regression suites**

Run: `npm test -- src/lib/webVitals.test.ts src/lib/clientErrorReporter.test.ts src/lib/api.upload-alerts.test.ts`

Expected: all tests PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit 0, with `web-vitals` emitted as an asynchronous chunk and absent
from the main entry bundle.

- [ ] **Step 3: Check backups and repository diff**

Run the repository backup checker if available, inspect `git diff --check`, and
confirm only the approved files are staged.

- [ ] **Step 4: Commit and push**

Commit to `landing-redesign` with a descriptive compatibility/failover message,
then push to `origin/landing-redesign`.

- [ ] **Step 5: Verify production**

Wait for the frontend deployment, request `https://comparo3d.com.ar`, confirm
the active entry bundle changed, and inspect the deployed entry to verify the
legacy guard and lazy `web-vitals` chunk split are present.
