# Design: Migrate Test Fixtures to TypeScript

## Context

The current test fixtures use JavaScript (`.js` files) while the main test file and project are TypeScript. This creates inconsistency and misses opportunities for type safety. Reference implementations (`egg-socket.io-master`, `mysql-master`) demonstrate TypeScript test fixtures are viable and beneficial.

## Goals / Non-Goals

### Goals

- Migrate all test fixture files from JavaScript to TypeScript
- Maintain functional equivalence - all tests should continue to pass
- Provide proper TypeScript types for better type safety
- Follow project TypeScript conventions (ES modules, type imports)
- Ensure compatibility with Egg.js FileLoader

### Non-Goals

- Rewriting test logic (only file format changes)
- Changing test coverage scope
- Modifying test execution framework
- Adding new test scenarios (separate from migration)

## Decisions

### Decision 1: File Conversion Strategy

**What**: Convert all `.js` files to `.ts` files in test fixtures

**Why**:
- Straightforward conversion maintains functionality
- TypeScript loader supports `.ts` files
- Matches reference implementation patterns

**Implementation**:
- Convert controller files: `*.js` → `*.ts`
- Convert router files: `*.js` → `*.ts`
- Convert config files: `*.js` → `*.ts`
- Use ES modules syntax (`import`/`export`) to match project style
- Add proper type annotations

### Decision 2: TypeScript Configuration

**What**: Add `tsconfig.json` to fixture directories as needed

**Why**:
- TypeScript compiler needs configuration
- May need to inherit from root `tsconfig.json`
- Fixture-specific settings may be needed

**Implementation**:
- Check if root `tsconfig.json` is sufficient
- Add fixture-specific `tsconfig.json` if needed
- Use `extends` to inherit from root configuration
- Configure appropriate compiler options for test environment

### Decision 3: Type Import Strategy

**What**: Use proper TypeScript type imports from `egg` module

**Why**:
- Provides type safety for Application, Context, Controller
- Matches reference implementation patterns
- Enables IDE support and autocomplete

**Implementation**:
- Import types: `import type { Application, Context } from 'egg'`
- Use type annotations for function parameters
- Add type declarations for custom interfaces if needed
- Follow project conventions for type imports

### Decision 4: Module Export Format

**What**: Use ES module exports (`export default`, `export`) instead of CommonJS

**Why**:
- Project uses ES modules (`type: "module"` in package.json)
- Matches reference implementation (`mysql-master` uses ES modules)
- Consistent with modern TypeScript practices

**Implementation**:
- Replace `module.exports = ...` with `export default ...`
- Replace `module.exports.foo = ...` with named exports
- Ensure compatibility with FileLoader

### Decision 5: Controller Export Format

**What**: Maintain existing controller export patterns (factory functions, classes, objects)

**Why**:
- Different controllers use different export formats
- Must maintain compatibility with existing router configurations
- FileLoader handles multiple export formats

**Implementation**:
- Factory function: `export default (app: Application) => { ... }`
- Class export: `export default class Controller extends app.Controller { ... }`
- Object export: `export default { ... }`
- Function export: `export async function handler() { ... }`

## Risks / Trade-offs

### Risk 1: FileLoader Compatibility

**Risk**: TypeScript files may not be loaded correctly by FileLoader

**Mitigation**:
- Verify FileLoader supports `.ts` files
- Check reference implementation for TypeScript fixture loading
- Test with sample conversion first
- May need TypeScript compilation step or ts-node support

### Risk 2: Type Definition Complexity

**Risk**: Complex type definitions may be needed for some fixtures

**Mitigation**:
- Start with simple type annotations
- Use type inference where possible
- Reference existing type definitions in project
- Add minimal type declarations only when necessary

### Risk 3: Test Execution Time

**Risk**: TypeScript compilation may slow down test execution

**Mitigation**:
- Use cached compilation if available
- Ensure TypeScript files are precompiled or handled efficiently
- Monitor test execution time
- Optimize tsconfig.json for faster compilation

### Risk 4: Breaking Changes

**Risk**: Conversion may introduce subtle bugs

**Mitigation**:
- Maintain functional equivalence
- Run all tests after conversion
- Convert incrementally (one fixture at a time)
- Review each conversion carefully

## Implementation Plan

### Phase 1: Preparation
- Review reference implementations for TypeScript fixture patterns
- Verify FileLoader TypeScript support
- Check TypeScript compiler configuration

### Phase 2: Sample Conversion
- Convert one simple fixture as a proof of concept
- Verify test execution works
- Validate type safety improvements

### Phase 3: Incremental Migration
- Convert controllers first (simpler)
- Convert routers next
- Convert config files last
- Run tests after each conversion

### Phase 4: Validation
- Run full test suite
- Verify all tests pass
- Check for type errors
- Ensure no regressions

### Phase 5: Cleanup
- Remove any unnecessary JavaScript files
- Update documentation
- Add TypeScript-specific notes if needed

## Migration Examples

### Controller Conversion

**Before (JavaScript):**
```javascript
'use strict';

module.exports = () => {
  return async function() {
    this.socket.emit('res', 'hello');
  };
};
```

**After (TypeScript):**
```typescript
import type { Context } from 'egg';

export default () => {
  return async function(this: Context) {
    this.socket.emit('res', 'hello');
  };
};
```

### Router Conversion

**Before (JavaScript):**
```javascript
'use strict';

module.exports = app => {
  app.io.route('chat', app.io.controller.chat);
};
```

**After (TypeScript):**
```typescript
import type { Application } from 'egg';

export default (app: Application) => {
  app.io.route('chat', app.io.controller.chat);
};
```

### Config Conversion

**Before (JavaScript):**
```javascript
'use strict';

exports.teggSocketIO = {
  namespace: {
    '/': {
      connectionMiddleware: [],
      packetMiddleware: [],
    },
  },
};

exports.keys = '123';
```

**After (TypeScript):**
```typescript
import type { EggAppConfig, PowerPartial } from 'egg';

export default {
  teggSocketIO: {
    namespace: {
      '/': {
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
  },
  keys: '123',
} satisfies PowerPartial<EggAppConfig>;
```

