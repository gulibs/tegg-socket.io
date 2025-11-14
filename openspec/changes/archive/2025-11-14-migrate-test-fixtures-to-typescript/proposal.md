# Change: Migrate Test Fixtures to TypeScript

## Why

The current test fixtures use JavaScript (`.js` files) while the main test file (`test/socket.io.test.ts`) and the entire project are written in TypeScript. This inconsistency creates several issues:

1. **Type Safety** - JavaScript fixtures don't benefit from TypeScript's type checking, leading to potential runtime errors that could be caught at compile time
2. **Consistency** - The project is TypeScript-first, so fixtures should match this convention
3. **Developer Experience** - TypeScript fixtures provide better IDE support, autocomplete, and type hints
4. **Reference Implementation** - Both `egg-socket.io-master` and `mysql-master` have TypeScript test fixture examples that we should follow

Migrating test fixtures to TypeScript will:
- Improve type safety and catch errors earlier
- Maintain consistency with project conventions
- Provide better developer experience
- Align with modern TypeScript-first development practices

## What Changes

This proposal migrates all test fixtures from JavaScript to TypeScript:

1. **Convert Fixture Files** - Convert all `.js` files in `test/fixtures/apps/` to `.ts` files
   - Controller files: `app/io/controller/*.js` → `app/io/controller/*.ts`
   - Router files: `app/router.js` → `app/router.ts`
   - Config files: `config/config.default.js` → `config/config.default.ts`
   - Other app files if any

2. **Add TypeScript Configuration** - Add `tsconfig.json` files to test fixtures that need them
   - Each fixture app may need its own `tsconfig.json` or inherit from parent
   - Configure appropriate compiler options for test fixtures

3. **Update Type Definitions** - Ensure TypeScript fixtures use proper type imports
   - Import types from `egg` module
   - Use proper Application, Context, Controller types
   - Add type declarations where needed

4. **Maintain Compatibility** - Ensure converted fixtures work with Egg.js loader
   - FileLoader should handle TypeScript files correctly
   - Test execution should not break

5. **Update Documentation** - Update any documentation that references fixture file formats

## Impact

- **Affected specs**: 
  - `specs/testing/spec.md` - May need to update test fixture format requirements
- **Affected code**: 
  - All files in `test/fixtures/apps/*/` directories
  - May need `tsconfig.json` files in fixture directories
  - Test file `test/socket.io.test.ts` should not need changes
- **Breaking changes**: None - this is a test-only change, fixtures remain functionally equivalent
- **Migration path**: No migration needed - existing tests will continue to work after conversion

## References

- **Reference TypeScript fixtures**: `refers/egg-socket.io-master/test/fixtures/apps/ts/socket.io-common/` - TypeScript Socket.IO fixtures
- **Reference TypeScript fixtures**: `refers/mysql-master/test/fixtures/apps/mysqlapp-ts-esm/` - TypeScript MySQL fixtures
- **TypeScript configuration**: `tsconfig.json` in root directory for compiler options

