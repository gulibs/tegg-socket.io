# Change: Add Auto Route Generation for Socket.IO Controllers

## Why

Currently, Socket.IO controllers are automatically loaded by the plugin, but routes must be manually configured in `app/router.ts`. This is inconsistent with Egg.js HTTP routing patterns and adds unnecessary boilerplate code.

Users expect:
- Controllers to be automatically loaded (already implemented)
- Routes to be automatically registered based on controller files and methods (not implemented)
- Similar experience to Egg.js HTTP controllers where routes are more automatic

Current pain points:
- Every controller method requires manual route registration in `app/router.ts`
- Users must remember to update router configuration when adding new controllers
- Inconsistent with Egg.js plugin conventions where loading and routing are often automatic
- More boilerplate code than necessary

## What Changes

This proposal adds automatic route generation for Socket.IO controllers:

1. **Convention-Based Routing** - Automatically register routes based on controller file names and method names
2. **Default Event Naming** - Use controller method names as event names by default
3. **Configuration Option** - Add option to enable/disable auto route generation
4. **Backward Compatibility** - Keep manual route registration in `app/router.ts` for custom event names
5. **Namespace Support** - Auto-register routes to appropriate namespaces based on configuration

## Impact

- **Affected specs**:
  - `controller-system` - Add requirement for auto route generation
- **Affected code**:
  - `src/lib/loader.ts` - Add route auto-registration logic
  - `src/config/config.default.ts` - Add configuration option
  - `src/typings/index.d.ts` - Update type definitions if needed
- **Breaking changes**: None - this is opt-in via configuration, manual routes still work
- **Migration path**: No migration needed - existing code continues to work, users can opt-in to auto routes

## References

- **Egg.js HTTP Routing**: HTTP controllers have convention-based routing
- **Reference implementation**: `egg-socket.io-master` also requires manual route configuration
- **Egg.js FileLoader**: Pattern used for loading controllers that could be extended for auto-routing
