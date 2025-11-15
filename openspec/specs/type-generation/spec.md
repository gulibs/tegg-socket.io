# type-generation Specification

## Purpose
TBD - created by archiving change refactor-loader-type-integration. Update Purpose after archive.
## Requirements
### Requirement: Declaration generation for Socket.IO artifacts
The plugin SHALL expose configuration so `npx ets` (egg-ts-helper) automatically generates controller and middleware declarations based on every load unit.

#### Scenario: ts-helper watch directories
- **WHEN** an application enables the plugin and runs `npx ets`
- **THEN** the plugin’s configuration SHALL register watch directories for `app/io/controller` and `app/io/middleware` across all load units
- **AND** the generator SHALL map file names (respecting Egg’s case style rules) into declaration objects
- **AND** duplicate names across load units SHALL resolve deterministically via load-unit priority

#### Scenario: Custom interface handle
- **WHEN** the watcher emits controller or middleware metadata
- **THEN** the `interfaceHandle` SHALL merge the results into `CustomController` and `CustomMiddleware`
- **AND** the generated `typings/index.d.ts` SHALL contain those names under the interfaces defined at `src/typings/index.d.ts` (lines 21-40)
- **AND** developers SHALL not need to hand-edit the plugin’s declarations to get IDE hints

