## 1. Preparation

- [x] 1.1 Verify FileLoader supports TypeScript files in test fixtures
- [x] 1.2 Check TypeScript compiler configuration for test fixtures
- [x] 1.3 Review reference implementations (egg-socket.io-master, mysql-master) for TypeScript fixture patterns
- [x] 1.4 Check if root tsconfig.json needs updates for test fixtures

## 2. Sample Conversion (Proof of Concept)

- [x] 2.1 Convert `test/fixtures/apps/socket.io-test/app/io/controller/chat.js` to TypeScript
- [x] 2.2 Convert `test/fixtures/apps/socket.io-test/app/router.js` to TypeScript
- [x] 2.3 Convert `test/fixtures/apps/socket.io-test/config/config.default.js` to TypeScript
- [x] 2.4 Add `tsconfig.json` to `test/fixtures/apps/socket.io-test/` if needed (not needed, root config sufficient)
- [x] 2.5 Run tests to verify conversion works
- [x] 2.6 Fix any type errors or compatibility issues

## 3. Socket.IO Test Fixtures

- [x] 3.1 Convert `test/fixtures/apps/socket.io-test/` (already done in sample, verify)
- [x] 3.2 Verify all files converted correctly
- [x] 3.3 Run tests for socket.io-test fixture

## 4. Controller Class Fixtures

- [x] 4.1 Convert `test/fixtures/apps/socket.io-controller-class/app/io/controller/chat.js` to TypeScript
- [x] 4.2 Convert `test/fixtures/apps/socket.io-controller-class/app/router.js` to TypeScript
- [x] 4.3 Convert `test/fixtures/apps/socket.io-controller-class/config/config.default.js` to TypeScript
- [x] 4.4 Add `tsconfig.json` if needed (not needed)
- [x] 4.5 Run tests to verify conversion works

## 5. Controller Async Fixtures

- [x] 5.1 Convert `test/fixtures/apps/socket.io-controller-async/app/io/controller/chatAsyncClass.js` to TypeScript
- [x] 5.2 Convert `test/fixtures/apps/socket.io-controller-async/app/io/controller/chatAsyncObject.js` to TypeScript
- [x] 5.3 Convert `test/fixtures/apps/socket.io-controller-async/app/router.js` to TypeScript
- [x] 5.4 Convert `test/fixtures/apps/socket.io-controller-async/config/config.default.js` to TypeScript
- [x] 5.5 Add `tsconfig.json` if needed (not needed)
- [x] 5.6 Run tests to verify conversion works

## 6. Namespace Fixtures

- [x] 6.1 Convert `test/fixtures/apps/socket.io-namespace/app/io/controller/chat.js` to TypeScript
- [x] 6.2 Convert `test/fixtures/apps/socket.io-namespace/app/router.js` to TypeScript
- [x] 6.3 Convert `test/fixtures/apps/socket.io-namespace/config/config.default.js` to TypeScript
- [x] 6.4 Add `tsconfig.json` if needed (not needed)
- [x] 6.5 Run tests to verify conversion works

## 7. Example Fixture

- [x] 7.1 Convert `test/fixtures/apps/example/app/controller/home.js` to TypeScript
- [x] 7.2 Convert `test/fixtures/apps/example/app/router.js` to TypeScript
- [x] 7.3 Convert `test/fixtures/apps/example/config/config.default.js` to TypeScript
- [x] 7.4 Add `tsconfig.json` if needed (not needed)
- [x] 7.5 Run tests to verify conversion works

## 8. Validation

- [x] 8.1 Run full test suite to ensure all tests pass (5 passing, 3 timeout - same as before conversion)
- [x] 8.2 Check for any TypeScript type errors (fixed with type assertions)
- [x] 8.3 Verify no regressions in test behavior (test results unchanged)
- [x] 8.4 Verify FileLoader correctly loads TypeScript files (working correctly)
- [x] 8.5 Check test execution time (should not significantly increase)

## 9. Cleanup

- [x] 9.1 Remove any remaining `.js` files (if all converted)
- [x] 9.2 Verify no `.js` files remain in fixture directories
- [x] 9.3 Clean up any temporary files
- [x] 9.4 Update .gitignore if needed (not needed)

## 10. Documentation

- [x] 10.1 Update testing spec to reflect TypeScript fixture requirement (already done in proposal spec delta)
- [x] 10.2 Update README if it references fixture file formats (README already uses TypeScript in all examples, no update needed)
- [x] 10.3 Add notes about TypeScript fixture patterns if needed (not needed, README examples already demonstrate TypeScript patterns)
