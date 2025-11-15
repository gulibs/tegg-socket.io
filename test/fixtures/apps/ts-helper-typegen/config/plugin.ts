import path from 'node:path';
import type { EggPlugin } from 'egg';

export default {
  teggSocketIO: {
    enable: true,
    path: path.join(__dirname, '../../../../../..'),
  },
} satisfies EggPlugin;


