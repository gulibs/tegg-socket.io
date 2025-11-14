import { Server } from '../../lib/socket.io/index.js';
import type { LoadedMiddleware, LoadedController } from '../../lib/types.js';
/**
 * Application extension for Socket.IO
 * Extends Application with app.io property using traditional Egg.js extension pattern
 * This matches the reference implementation (egg-socket.io-master)
 *
 * In Egg.js extensions, 'this' refers to the Application instance.
 * The framework merges this object into the Application prototype.
 */
declare const _default: {
    readonly io: Server & {
        middleware: LoadedMiddleware;
        controller: LoadedController;
    };
};
export default _default;
