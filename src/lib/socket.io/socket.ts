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

