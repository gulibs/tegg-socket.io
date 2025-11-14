import { Server } from '../../lib/socket.io/index.js';
import debug from 'debug';
const debugLog = debug('egg-socket.io:app:extend:application');
const SocketIOSymbol = Symbol.for('EGG-SOCKET.IO#IO');
/**
 * Application extension for Socket.IO
 * Extends Application with app.io property using traditional Egg.js extension pattern
 * This matches the reference implementation (egg-socket.io-master)
 *
 * In Egg.js extensions, 'this' refers to the Application instance.
 * The framework merges this object into the Application prototype.
 */
export default {
    get io() {
        // 'this' refers to the Application instance in Egg.js extensions
        // Use type assertion to access Symbol property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const app = this;
        if (!app[SocketIOSymbol]) {
            debugLog('[egg-socket.io] create SocketIO instance!');
            app[SocketIOSymbol] = new Server();
            app[SocketIOSymbol].serveClient(false);
            // Initialize controller and middleware objects
            app[SocketIOSymbol].controller = {};
            app[SocketIOSymbol].middleware = {};
        }
        return app[SocketIOSymbol];
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwL2V4dGVuZC9hcHBsaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFdEQsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRTFCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUV0RDs7Ozs7OztHQU9HO0FBQ0gsZUFBZTtJQUNiLElBQUksRUFBRTtRQUNKLGlFQUFpRTtRQUNqRSwrQ0FBK0M7UUFDL0MsOERBQThEO1FBQzlELE1BQU0sR0FBRyxHQUFHLElBQVcsQ0FBQztRQUN4QixJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7WUFDekIsUUFBUSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7WUFDdEQsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksTUFBTSxFQUE2RSxDQUFDO1lBQzlHLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsK0NBQStDO1lBQy9DLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxVQUFVLEdBQUcsRUFBc0IsQ0FBQztZQUN4RCxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsVUFBVSxHQUFHLEVBQXNCLENBQUM7UUFDMUQsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7Q0FDRixDQUFDIn0=