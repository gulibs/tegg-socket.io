import type { EggAppConfig, PowerPartial } from 'egg';

export default {
  keys: 'socket.io-controller-router',
  teggSocketIO: {
    namespace: {
      '/': {
        connectionMiddleware: [ 'auth' ],
        packetMiddleware: [],
      },
    },
  },
} satisfies PowerPartial<EggAppConfig>;
