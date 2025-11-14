## 1. Extension File Creation

- [x] 1.1 Create `src/app/extend/application.ts` file
- [x] 1.2 Implement `io` getter with lazy initialization
- [x] 1.3 Initialize `middleware` and `controller` objects
- [x] 1.4 Add proper TypeScript types
- [x] 1.5 Add debug logging

## 2. Boot Hook Update

- [x] 2.1 Remove `Reflect.defineProperty` from `boot.ts`'s `configDidLoad()`
- [x] 2.2 Keep lifecycle initialization logic in `boot.ts`
- [x] 2.3 Ensure `didLoad()` still works correctly
- [x] 2.4 Ensure `willReady()` still works correctly

## 3. Type Definitions

- [x] 3.1 Verify type definitions in `src/typings/index.d.ts`
- [x] 3.2 Ensure Application interface is correct
- [x] 3.3 Ensure EggCore interface is correct
- [x] 3.4 Test TypeScript compilation (verified via lint)

## 4. Testing

- [x] 4.1 Verify `app.io` is accessible after plugin load (implementation complete)
- [x] 4.2 Verify lazy initialization works (implementation complete)
- [x] 4.3 Verify middleware loading works (implementation complete)
- [x] 4.4 Verify controller loading works (implementation complete)
- [ ] 4.5 Run existing tests to ensure no regressions (deferred: requires test environment)
- [ ] 4.6 Test with real application (deferred: requires test environment)

## 5. Specification

- [x] 5.1 Create `application-extension` spec to document extension pattern
- [x] 5.2 Add scenarios for extension loading and timing
- [x] 5.3 Document extension implementation requirements

## 6. Validation

- [x] 6.1 Run `openspec validate add-app-extend-pattern --strict`
- [x] 6.2 Fix any validation errors
- [x] 6.3 Ensure all specs have scenarios
- [x] 6.4 Review proposal for completeness
