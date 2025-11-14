# testing Specification

## Purpose
This specification defines the testing requirements for the `@eggjs/tegg-socket.io` plugin. It ensures that all plugin features are properly tested, including Socket.IO server initialization, controller system, middleware system, namespace management, Redis adapter, error handling, session support, and TypeScript support.

## MODIFIED Requirements

### Requirement: Test Fixtures
The plugin SHALL provide test fixtures for various scenarios.

#### Scenario: Test fixture structure
- **WHEN** test fixtures are created
- **THEN** they SHALL be organized in `test/fixtures/apps/` directory
- **AND** each fixture SHALL represent a specific test scenario
- **AND** fixtures SHALL include controllers, middleware, and configuration
- **AND** fixtures SHALL use descriptive names (e.g., `socket.io-test`, `socket.io-controller-class`)
- **AND** fixtures SHALL use TypeScript (`.ts` files) for all code files (controllers, routers, config)
- **AND** fixtures SHALL use proper TypeScript type imports from `egg` module
- **AND** fixtures SHALL use ES module syntax (`import`/`export`) to match project conventions

#### Scenario: Test fixture TypeScript format
- **WHEN** test fixtures are created
- **THEN** controller files SHALL be TypeScript files (`*.ts`) with proper type annotations
- **AND** router files SHALL be TypeScript files (`*.ts`) with `Application` type imports
- **AND** config files SHALL be TypeScript files (`*.ts`) with `EggAppConfig` type annotations
- **AND** fixtures MAY include `tsconfig.json` files if needed for compiler configuration
- **AND** TypeScript fixtures SHALL be compatible with Egg.js FileLoader

#### Scenario: Test fixture cleanup
- **WHEN** tests are executed
- **THEN** test fixtures SHALL be properly cleaned up
- **AND** log files SHALL be cleaned
- **AND** run files SHALL be cleaned
- **AND** test resources SHALL be released

