import type { EggAppConfig, PowerPartial } from 'egg';

export default {
  keys: 'test-ts-helper',
  teggSocketIO: {
    namespace: {
      '/': {
        connectionMiddleware: [ 'auth' ],
        packetMiddleware: [],
      },
    },
  },
} satisfies PowerPartial<EggAppConfig>;


