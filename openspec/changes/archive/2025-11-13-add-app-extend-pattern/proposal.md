# Change: Add Application Extension Pattern Support

## Why

The current implementation uses the modern Tegg pattern with `Reflect.defineProperty` in `boot.ts` to extend the Application object with `app.io`. However, the reference implementation (`egg-socket.io-master`) uses the traditional Egg.js plugin pattern with `app/extend/application.js`.

To ensure compatibility and alignment with the reference implementation, we should add support for the traditional `app/extend/application.js` pattern. This pattern:
1. **Matches Reference Implementation** - Follows the exact pattern used in `egg-socket.io-master`
2. **Leverages Framework Loading** - Uses Egg.js's built-in extension loading mechanism
3. **Maintains Compatibility** - Works with both traditional and modern plugin patterns
4. **Provides Consistency** - Ensures the plugin structure matches expected Egg.js plugin conventions

## What Changes

This proposal adds support for the traditional `app/extend/application.js` pattern:

1. **Create `src/app/extend/application.ts`** - Add traditional extension file that exports an object with `io` getter
2. **Migrate Extension Logic** - Move application extension from `boot.ts` to `app/extend/application.ts`
3. **Update Boot Hook** - Remove application extension from `boot.ts`, keep only lifecycle initialization logic
4. **Maintain Functionality** - Ensure `app.io` is accessible with same lazy initialization behavior
5. **Update Type Definitions** - Ensure TypeScript types remain correct

### Key Differences from Reference

- **TypeScript Support** - Use TypeScript instead of JavaScript
- **Type Safety** - Maintain comprehensive type definitions
- **Middleware/Controller Support** - Initialize `middleware` and `controller` objects (not in reference)
- **Modern Patterns** - Use modern Socket.IO Server API while maintaining compatibility

## Impact

- **Affected specs**: Add new `application-extension` spec to document the extension pattern
- **Affected code**: 
  - Create `src/app/extend/application.ts`
  - Update `src/boot.ts` to remove application extension logic
  - Ensure type definitions remain correct
- **Breaking changes**: None - this is a structural change that maintains API compatibility
- **Migration path**: No migration needed - API remains the same

## References

- **Reference implementation**: `refers/egg-socket.io-master/app/extend/application.js` - Traditional extension pattern
- **Current implementation**: `src/boot.ts` - Modern Tegg pattern
- **Documentation**: `refers/docs/tegg文档/基础功能/框架扩展.md` - Application extension documentation

