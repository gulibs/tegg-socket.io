## 1. Loader Hardening
- [x] 1.1 Extract a shared helper that returns `{ controllerDirs, middlewareDirs }` collected from `app.loader.getLoadUnits()`.
- [x] 1.2 Update `loadControllersAndMiddleware()` to call `app.loader.loadController()` for controller directories and reuse `FileLoader` for middleware, matching upstream loader semantics.
- [x] 1.3 Add unit tests covering multi-load-unit ordering and the debug output.

## 2. Declaration Generation
- [x] 2.1 Add a ts-helper (egg-ts-helper) configuration block that registers `app/io/controller` and `app/io/middleware` directories so `npx ets` can emit controller/middleware typings.
- [x] 2.2 Provide an `interfaceHandle` implementation that merges generated definitions into `CustomController`/`CustomMiddleware` so `typings/index.d.ts` reflects real names.
- [x] 2.3 Document the workflow (README + HISTORY) explaining that running `npx ets` keeps IOSocket controllers/middleware typed.

## 3. Validation
- [x] 3.1 Create an integration fixture app with sample controllers/middleware and assert that running `npx ets` generates the expected declaration entries.
- [x] 3.2 Update or add CI coverage so loader + ts-helper regressions are caught (e.g., `npm test` target invokes the new integration test).
- [x] 3.3 Ensure all lint/tests pass and update `History.md` with the change summary.

