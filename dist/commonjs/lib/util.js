"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateSocket = delegateSocket;
const delegates_1 = __importDefault(require("delegates"));
/**
 * Delegate socket methods and properties to Koa context
 * This allows accessing socket methods via ctx.socket.*
 */
function delegateSocket(ctx) {
    (0, delegates_1.default)(ctx, 'socket')
        .getter('client')
        .getter('server')
        .getter('adapter')
        .getter('id')
        .getter('conn')
        .getter('rooms')
        .getter('acks')
        .getter('json')
        .getter('volatile')
        .getter('broadcast')
        .getter('connected')
        .getter('disconnected')
        .getter('handshake')
        .method('join')
        .method('leave')
        .method('emit')
        .method('to')
        .method('in')
        .method('send')
        .method('write')
        .method('disconnect');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQU9BLHdDQXVCQztBQTlCRCwwREFBaUM7QUFHakM7OztHQUdHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLEdBQVk7SUFDekMsSUFBQSxtQkFBUSxFQUFDLEdBQUcsRUFBRSxRQUFRLENBQUM7U0FDcEIsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNoQixNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ2hCLE1BQU0sQ0FBQyxTQUFTLENBQUM7U0FDakIsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNaLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDZCxNQUFNLENBQUMsT0FBTyxDQUFDO1NBQ2YsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUNkLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDZCxNQUFNLENBQUMsVUFBVSxDQUFDO1NBQ2xCLE1BQU0sQ0FBQyxXQUFXLENBQUM7U0FDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQztTQUNuQixNQUFNLENBQUMsY0FBYyxDQUFDO1NBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUM7U0FDbkIsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUNkLE1BQU0sQ0FBQyxPQUFPLENBQUM7U0FDZixNQUFNLENBQUMsTUFBTSxDQUFDO1NBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUM7U0FDWixNQUFNLENBQUMsTUFBTSxDQUFDO1NBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQztTQUNmLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMxQixDQUFDIn0=