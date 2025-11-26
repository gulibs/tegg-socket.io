import type { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.keys = 'test-key';

  config.teggSocketIO = {
    namespace: {
      '/': {
        connectionMiddleware: ['auth'],
        packetMiddleware: ['log'],
      },
      '/admin': {
        connectionMiddleware: ['auth', 'adminAuth'],
        packetMiddleware: [],
      },
    },
  };

  return config;
};

