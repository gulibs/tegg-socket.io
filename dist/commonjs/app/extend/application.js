"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../../lib/socket.io/index.js");
const debug_1 = __importDefault(require("debug"));
const debugLog = (0, debug_1.default)('egg-socket.io:app:extend:application');
const SocketIOSymbol = Symbol.for('EGG-SOCKET.IO#IO');
/**
 * Application extension for Socket.IO
 * Extends Application with app.io property using traditional Egg.js extension pattern
 * This matches the reference implementation (egg-socket.io-master)
 *
 * In Egg.js extensions, 'this' refers to the Application instance.
 * The framework merges this object into the Application prototype.
 */
exports.default = {
    get io() {
        // 'this' refers to the Application instance in Egg.js extensions
        // Use type assertion to access Symbol property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const app = this;
        if (!app[SocketIOSymbol]) {
            debugLog('[egg-socket.io] create SocketIO instance!');
            app[SocketIOSymbol] = new index_js_1.Server();
            app[SocketIOSymbol].serveClient(false);
            // Initialize controller and middleware objects
            app[SocketIOSymbol].controller = {};
            app[SocketIOSymbol].middleware = {};
        }
        return app[SocketIOSymbol];
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwL2V4dGVuZC9hcHBsaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDJEQUFzRDtBQUV0RCxrREFBMEI7QUFFMUIsTUFBTSxRQUFRLEdBQUcsSUFBQSxlQUFLLEVBQUMsc0NBQXNDLENBQUMsQ0FBQztBQUMvRCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFFdEQ7Ozs7Ozs7R0FPRztBQUNILGtCQUFlO0lBQ2IsSUFBSSxFQUFFO1FBQ0osaUVBQWlFO1FBQ2pFLCtDQUErQztRQUMvQyw4REFBOEQ7UUFDOUQsTUFBTSxHQUFHLEdBQUcsSUFBVyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztZQUN6QixRQUFRLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUN0RCxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxpQkFBTSxFQUE2RSxDQUFDO1lBQzlHLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsK0NBQStDO1lBQy9DLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxVQUFVLEdBQUcsRUFBc0IsQ0FBQztZQUN4RCxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsVUFBVSxHQUFHLEVBQXNCLENBQUM7UUFDMUQsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7Q0FDRixDQUFDIn0=