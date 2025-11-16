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

### Requirement: egg-ts-helper Integration Configuration

The plugin MUST provide a correct `.egg_ts_helper.json` configuration that enables automatic type generation for Socket.IO controllers and middleware.

#### Scenario: egg-ts-helper Generates Types for Middleware

**Given** a user has installed the plugin in an Egg.js TypeScript project  
**And** the user has configured `.egg_ts_helper.json` with the provided configuration  
**When** the user runs `npx ets` or starts dev server with `npm run dev`  
**Then** egg-ts-helper MUST generate type declarations in `typings/app/io/index.d.ts`  
**And** the generated types MUST extend `CustomMiddleware` interface  
**And** middleware files in `app/io/middleware/` MUST be automatically detected

#### Scenario: egg-ts-helper Generates Types for Controllers

**Given** a user has installed the plugin in an Egg.js TypeScript project  
**And** the user has configured `.egg_ts_helper.json` with the provided configuration  
**When** the user runs `npx ets` or starts dev server with `npm run dev`  
**Then** egg-ts-helper MUST generate type declarations in `typings/app/io/index.d.ts`  
**And** the generated types MUST extend `CustomController` interface  
**And** controller files in `app/io/controller/` MUST be automatically detected

#### Scenario: declareTo Properly Injects Types

**Given** the `.egg_ts_helper.json` configuration includes `declareTo` fields  
**When** egg-ts-helper generates type declarations  
**Then** the types MUST be declared to `Application.io.middleware` and `Application.io.controller`  
**And** TypeScript IntelliSense MUST work for `app.io.middleware.xxx`  
**And** TypeScript IntelliSense MUST work for `app.io.controller.xxx`

### Requirement: Context args Property Type Safety

The `Context` interface MUST include an `args` property to support Socket.IO message arguments without TypeScript errors.

#### Scenario: Using ctx.args in Controller

**Given** a Socket.IO controller method  
**When** the code accesses `this.ctx.args`  
**Then** TypeScript MUST NOT report "Object is of type 'unknown'" error  
**And** `ctx.args` MUST be typed as `unknown[] | undefined`  
**And** the property MUST be optional (using `?`)

#### Scenario: Type Safety for args Access

**Given** a controller method accessing `this.ctx.args`  
**When** the developer writes `const data = this.ctx.args![0]`  
**Then** TypeScript MUST recognize `args` as an array  
**And** TypeScript MUST allow non-null assertion operator (`!`)  
**And** individual array elements MUST be typed as `unknown`

### Requirement: Documentation for egg-ts-helper Setup

The README MUST provide clear instructions for configuring egg-ts-helper to automatically generate types.

#### Scenario: User Reads egg-ts-helper Setup Instructions

**Given** a user reads the README  
**When** they look for TypeScript support information  
**Then** they MUST find a "TypeScript Support" section  
**And** the section MUST include a sub-section about egg-ts-helper automatic type generation  
**And** the section MUST provide the complete `.egg_ts_helper.json` configuration

#### Scenario: User Understands the Benefits

**Given** the README documentation  
**When** a user reads about type generation options  
**Then** the documentation MUST explain the difference between:
  - Automatic type generation (egg-ts-helper)
  - Manual type declarations
**And** the documentation MUST recommend the automatic approach
**And** the documentation MUST provide examples for both approaches

