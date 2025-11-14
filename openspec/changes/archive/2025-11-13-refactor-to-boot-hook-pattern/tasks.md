## 1. Boot Hook Structure Creation

- [x] 1.1 Create `src/boot.ts` with `SocketIOBootHook` class
- [x] 1.2 Implement `ILifecycleBoot` interface
- [x] 1.3 Add constructor with `app: EggCore` parameter
- [x] 1.4 Add proper TypeScript types

## 2. Application Extension Implementation

- [x] 2.1 Move `app.io` extension to `configDidLoad()` method
- [x] 2.2 Use `Reflect.defineProperty` instead of `Object.defineProperty`
- [x] 2.3 Ensure lazy initialization still works
- [x] 2.4 Add proper type definitions for extension

## 3. Lifecycle Method Implementation

- [x] 3.1 Move controller/middleware loading to `didLoad()` method
- [x] 3.2 Move namespace initialization to `willReady()` method
- [x] 3.3 Register `app.on('server')` listener in `willReady()` method
- [x] 3.4 Move Redis adapter setup to `willReady()` method
- [x] 3.5 Ensure proper async/await handling

## 4. Refactor app.ts

- [x] 4.1 Change `app.ts` to export `SocketIOBootHook` class
- [x] 4.2 Remove function-based initialization export
- [x] 4.3 Update imports to use boot hook

## 5. Code Cleanup

- [x] 5.1 Remove initialization function from `lib/io.ts` (deleted file as no longer needed)
- [x] 5.2 Move initialization logic to boot hook methods
- [x] 5.3 Extract reusable functions where appropriate
- [x] 5.4 Update imports and exports

## 6. Type Definitions

- [x] 6.1 Ensure `app.io` type is properly defined
- [x] 6.2 Add boot hook type exports
- [x] 6.3 Update Application interface extension
- [x] 6.4 Add CustomMiddleware and CustomController interfaces for extensibility
- [x] 6.5 Update EggCore interface extension
- [x] 6.6 Verify TypeScript compilation passes

## 7. Testing

- [x] 7.1 Ensure all existing tests pass
- [x] 7.2 Test lifecycle hook order (verified: configDidLoad → didLoad → willReady)
- [x] 7.3 Test `app.io` availability timing (verified: available after configDidLoad)
- [x] 7.4 Test namespace initialization (verified: works in willReady)
- [x] 7.5 Test server attachment (verified: app.on('server') registered in willReady)
- [x] 7.6 Test Redis adapter setup (verified: setup in willReady if configured)
- [ ] 7.7 Test cluster mode (deferred: requires additional test setup, existing tests confirm basic functionality)

## 8. Validation

- [x] 8.1 Run `openspec validate refactor-to-boot-hook-pattern --strict`
- [x] 8.2 Fix any validation errors
- [x] 8.3 Ensure specs are updated if needed
- [x] 8.4 Review implementation for completeness

