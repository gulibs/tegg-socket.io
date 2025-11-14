import type { EggAppConfig, PowerPartial } from 'egg';

export default {
  keys: '123456',
} satisfies PowerPartial<EggAppConfig>;

