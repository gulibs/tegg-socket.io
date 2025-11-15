# History

## 0.0.4 (2025-11-14)

- Switch the IO loader to Egg's `loadController()` for controllers while keeping middleware loading via `FileLoader` so load-unit ordering stays deterministic.
- Expose `egg.tsHelper.generatorConfig` to `egg-ts-helper` so `npx ets` emits `typings/app/io/controller/index.d.ts` and `typings/app/io/middleware/index.d.ts` automatically.
- Add a fixture and integration test (`test/ts-helper.test.ts`) that runs `egg-ts-helper` with a custom loader stub to verify the generated declarations, and document the workflow in both README files.

