## Context
- `src/lib/loader.ts` currently invokes `FileLoader` for both middleware and controllers (`new FileLoader({ directory: controllerDirs, ... }).load();`). Unlike the upstream `egg-socket.io` loader (`refers/egg-socket.io-master/lib/loader.js`), this bypasses the `app.loader.loadController()` helper that wires metadata such as naming conventions and injection order. Without the helper, controller maps differ from Egg’s expectations and we do not emit the metadata Egg’s tooling (including egg-ts-helper) consumes.
- The plugin exposes `CustomController`/`CustomMiddleware` in `src/typings/index.d.ts` (`lines 21-40`), but they remain loose index signatures because no ts-helper configuration points `npx ets` at `app/io/controller` or `app/io/middleware`. There is no `config.tsHelper` section or generator hook in the repo, so running `npx ets` in an app leaves these interfaces untouched even though the TypeScript tutorial mandates running `ets` before `tsc` to sync declarations with every load unit (`refers/docs/tegg文档/教程/TypeScript.md` lines 489-568).
- The Egg loader spec (`refers/docs/tegg文档/高级功能/加载器（Loader）.md`) requires that every load unit is traversed in plugin→framework→app order. Our loader already calls `loader.getLoadUnits()`, but we lack validation, and we never share the resulting directory list with tooling.
- `egg-ts-helper` natively understands `customLoader` and `generatorConfig` entries so plugins can emit additional declaration trees when `npx ets` runs, including support for interface handles and case-style conversions ([eggjs/egg-ts-helper](https://github.com/eggjs/egg-ts-helper)). We are not taking advantage of those hooks today.
- Reference projects highlight the missing pieces:
  - `refers/egg-socket.io-master` uses `app.loader.loadController` plus `FileLoader` to keep runtime/controller shape consistent.
  - `refers/mysql-master/src/types.ts` demonstrates how plugins extend `EggAppConfig`/`EggCore` types so apps gain strict typing automatically.
  - `refers/tegg-wss/lib/server.ts` shows load-unit aware middleware loading and a stable manager used by production apps; our loader should offer the same level of determinism.

## Goals / Non-Goals
- **Goals**
  - Use Egg’s native controller loader so every load unit contributes controllers with consistent naming, lifecycle hooks, and metadata.
  - Produce `tsHelper` (egg-ts-helper) watch configuration that mirrors the loader directories so `npx ets` automatically augments `CustomController` and `CustomMiddleware`.
  - Ensure the declaration pipeline can run from any load unit (plugins, frameworks, apps) and still deduplicate names.
  - Provide automated coverage (unit + integration) that proves the loader order and `npx ets` generation remain stable.
- **Non-Goals**
  - Changing namespace routing, middleware semantics, or Redis adapter behavior.
  - Replacing egg-ts-helper itself; we only configure it for new directories.
  - Auto-generating business-specific controller typings beyond mirroring directory/file names.

## Decisions
1. **Adopt `app.loader.loadController` for `app/io/controller`:**
   - Mirrors upstream `egg-socket.io` so files get wrapped with Egg’s controller prototype logic.
   - Gives us consistent load-unit ordering (plugins → frameworks → app) per Loader spec.
   - Keeps debug output parity for easier troubleshooting.
2. **Keep `FileLoader` for middleware but emit metadata:**
   - Middleware remains plain functions/classes, so FileLoader suffices.
   - We will collect the directory list (`loader.getLoadUnits().map(unit => path.join(unit.path, 'app/io/middleware'))`) once, reuse it for both runtime loading and ts-helper.
3. **Introduce ts-helper integration:**
   - Expose `config.tsHelper.watchDirs.ioController` and `ioMiddleware`, each referencing the load-unit directories and using an `interfaceHandle` to merge definitions into `CustomController`/`CustomMiddleware`. This mirrors how `egg-ts-helper` expects custom loader metadata ([eggjs/egg-ts-helper](https://github.com/eggjs/egg-ts-helper)).
   - When `npx ets` runs (per the TypeScript tutorial workflow), it will generate `.d.ts` files that extend the plugin’s interfaces automatically, satisfying the “lines 37-40” requirement from `refers/egg-socket.io-master/index.d.ts`.
   - Provide a lightweight helper module so both loader and ts-helper share the same directory list, reducing drift.
4. **Testing strategy:**
   - Add unit tests ensuring `loadControllersAndMiddleware` hands `loadController`/`FileLoader` the expected directories.
   - Add an integration test fixture app that runs `npx ets` (via egg-ts-helper) to confirm controller/middleware names appear in the generated `typings/index.d.ts`.

## Risks / Trade-offs
- Relying on egg-ts-helper means developer environments must have `npx ets` available; we mitigate by documenting it and gating behavior behind config defaults so CI remains deterministic.
- Sharing directory lists between runtime and tooling introduces coupling; we mitigate via a single helper module and tests.
- Using `loadController` may surface previously hidden controller naming conflicts; however, that aligns with Egg’s expectations and surfaces issues earlier.

## Migration Plan
1. Refactor `src/lib/loader.ts` to delegate controller loading to `app.loader.loadController` and export the collected directory metadata (shared helper).
2. Introduce a ts-helper helper (e.g., `src/lib/loaderPaths.ts`) plus `config.tsHelper` defaults so `npx ets` picks up `app/io/controller|middleware`.
3. Update typings/tests/docs, then provide an integration test that runs `npx ets` against a fixture with sample controllers/middleware.

## Open Questions
- Do we expose configuration flags to let apps opt out of the ts-helper integration (e.g., for non-TypeScript users)?
- Should the ts-helper generator also surface namespace metadata (event routes) for stricter typing, or is that out of scope for this change?

