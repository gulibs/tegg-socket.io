import type { EggAppConfig, PowerPartial } from 'egg';

export default {
  teggSocketIO: {
    namespace: {
      '/': {
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
  },
  keys: '123',
} satisfies PowerPartial<EggAppConfig>;

