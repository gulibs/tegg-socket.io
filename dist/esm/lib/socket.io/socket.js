import { Socket } from 'socket.io';
/**
 * Extend Socket.IO Socket with remoteAddress getter
 * This matches the egg-socket.io reference implementation
 */
/* istanbul ignore next */
Object.defineProperty(Socket.prototype, 'remoteAddress', {
    get() {
        return this.handshake.address;
    },
    configurable: true,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9zb2NrZXQuaW8vc29ja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFbkM7OztHQUdHO0FBQ0gsMEJBQTBCO0FBQzFCLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUU7SUFDdkQsR0FBRztRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7SUFDaEMsQ0FBQztJQUNELFlBQVksRUFBRSxJQUFJO0NBQ25CLENBQUMsQ0FBQyJ9