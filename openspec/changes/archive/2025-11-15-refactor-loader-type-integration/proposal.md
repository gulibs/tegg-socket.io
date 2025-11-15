# Change: Refactor loader flow and declaration generation

## Why

- The current loader was partially ported to the new Tegg boot hook but still uses a generic `FileLoader` for controllers, which diverges from the reference `egg-socket.io`/`tegg-wss` implementations and does not emit the loader metadata Egg expects. This causes controller discovery to differ per load unit and makes the runtime fragile.
- Applications running `npx ets` (egg-ts-helper) cannot see `app/io/controller` or `app/io/middleware` because the plugin does not register any ts-helper watch directory or interface handle. As a result, `typings/index.d.ts` never gets augmented with real controller or middleware names, leaving `CustomController`/`CustomMiddleware` as loose index signatures.
- Egg’s official TypeScript workflow (`refers/docs/tegg文档/教程/TypeScript.md`) stresses running `ets` before `tsc` so declaration merging stays in sync with every load unit. Without exposing our IO directories, developer builds violate that guidance: `npx ets` runs but produces no Socket.IO-specific declarations, so controllers/middleware stay untyped even though the doc expects plugin authors to ship full d.ts coverage (`refers/docs/tegg文档/教程/TypeScript.md` lines 489-568).
- The `egg-ts-helper` project explicitly supports custom loader directories and generator configs so plugins can feed additional directories into `npx ets` ([egg-js/egg-ts-helper](https://github.com/eggjs/egg-ts-helper)). We currently leave this capability unused, forcing app authors to patch typings manually.
- We need a deterministic loader plan that matches Egg’s loadUnit ordering rules (per `refers/docs/tegg文档/高级功能/加载器（Loader）.md`) and feeds the type generator so downstream Egg apps get correct declarations without manual edits.

## What Changes

- Align the loader with the upstream `egg-socket.io` pattern: use `app.loader.loadController` for `app/io/controller`, keep `FileLoader` for middleware, and ensure directories are derived from every load unit so namespaces/controllers stay in sync even when multiple frameworks/plugins coexist.
- Define a ts-helper (`npx ets`) integration that enumerates the same load-unit directories and feeds them into `CustomController`/`CustomMiddleware`, ensuring the generated `typings/index.d.ts` automatically mirrors the available Socket.IO controllers and middleware.
- Document and test the new loader + declaration workflow so regressions are caught (unit tests for loader ordering and an integration test that runs `npx ets` in a fixture app).

## Impact

- Affected specs: `controller-system`, `middleware-system`, `type-generation`.
- Affected code: `src/lib/loader.ts`, `src/config/config.default.ts`, `src/typings/index.d.ts`, test fixtures under `test/fixtures/apps/*`, docs/readme for loader guidance, and new tooling glue for `npx ets`.
