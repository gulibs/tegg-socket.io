import type { Application } from 'egg';
import { EggWebSocketServer } from './lib/server';

export default (app: Application) => {
    const wss = new EggWebSocketServer(app);
    app.beforeStart(async () => {
        wss.start();
    });
}


