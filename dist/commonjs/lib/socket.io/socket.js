"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
/**
 * Extend Socket.IO Socket with remoteAddress getter
 * This matches the egg-socket.io reference implementation
 */
/* istanbul ignore next */
Object.defineProperty(socket_io_1.Socket.prototype, 'remoteAddress', {
    get() {
        return this.handshake.address;
    },
    configurable: true,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9zb2NrZXQuaW8vc29ja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQW1DO0FBRW5DOzs7R0FHRztBQUNILDBCQUEwQjtBQUMxQixNQUFNLENBQUMsY0FBYyxDQUFDLGtCQUFNLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRTtJQUN2RCxHQUFHO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztJQUNoQyxDQUFDO0lBQ0QsWUFBWSxFQUFFLElBQUk7Q0FDbkIsQ0FBQyxDQUFDIn0=