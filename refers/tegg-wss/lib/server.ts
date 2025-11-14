import assert from 'assert';
import { Application, EggLogger, TeggWssClient, TeggWssHeartbeat } from 'egg';
import { IncomingMessage, ServerResponse } from 'http';
import is from 'is-type-of';
import type { Context, ParameterizedContext } from 'koa';
import type { ComposedMiddleware, Middleware } from 'koa-compose';
import compose from 'koa-compose';
import path from 'path';
import { v1 } from 'uuid';
import { WebSocket, WebSocketServer } from "ws";
import ClientManager from './ClientManager';

const onSocketError = (err) => {
    console.error(err);
}

export interface LoadMiddlewares {
    [key: string]: Middleware<ParameterizedContext>
}

export class BaseClient<T extends object = any> implements TeggWssClient<T> {

    public uuid: string;
    public socket: WebSocket;
    public ip?: string;
    public subject?: any;
    public app: Application;
    public isAlive = false;
    private isPong = false;
    private logger: EggLogger;
    private heartbeatConfig?: TeggWssHeartbeat;

    constructor(app: Application, socket: WebSocket, uuid: string, ip?: string, subject?: any) {
        this.app = app;
        this.socket = socket;
        this.uuid = uuid;
        this.ip = ip;
        this.subject = subject;
        this.logger = app.logger;
        this.heartbeatConfig = this.app.config.wss.heartbeat;
    }

    heartbeat() {
        if (!this.isPong) {
            this.logger.info("[tegg-wss]", "bind heartbeat.");
            this.socket.on('pong', this.heartbeatCallback.bind(this));
            this.isPong = true;
        }
    }

    private heartbeatCallback(data: Buffer) {
        const logging = this.heartbeatConfig?.logging;
        logging && this.logger.info("[tegg-wss]", `"[Client:${this.uuid}] execute heartbeat callback ${data.toString("utf-8")}."`);
        this.isAlive = true;
    }
}

export class EggWebSocketServer extends WebSocketServer {

    private app: Application;
    private logger: EggLogger;
    private loadMiddlewares: LoadMiddlewares = {};
    private middlewares = new Map<string, ComposedMiddleware<ParameterizedContext>>();
    private manager: ClientManager;

    constructor(app: Application) {
        const { config, logger } = app;
        const { wss: wssConfig } = config;
        assert(wssConfig && wssConfig.options, 'please add plugin config.')
        super({ ...wssConfig.options });

        const { heartbeat } = wssConfig;
        this.app = app;
        this.app.wss = this;
        this.manager = new ClientManager(app);
        this.app.clientManager = this.manager;
        this.logger = logger;

        heartbeat && this.manager.startDetect(heartbeat.ms);

        this.on('connection', (ws, req) => {
            if ("noServer" in wssConfig.options && !wssConfig.options.noServer)
                this.execCustomModel(ws, req);
            const { currentClient } = this.app;
            currentClient.isAlive = true;
            heartbeat && currentClient.heartbeat();
            this.manager.pushClient(currentClient);
            this.logger.info(`[tegg-wss] connection client {${currentClient.uuid}}.`);
            ws.on('error', (err) => {
                this.manager.removeClient(currentClient.uuid);
                this.logger.error("[tegg-wss]", err);
            });
            ws.on('close', (code, reason) => {
                this.manager.removeClient(currentClient.uuid);
                this.logger.warn(`[tegg-wss] client disconnection by ${JSON.stringify({ uuid: currentClient.uuid, code, reason: reason.toString('utf-8') }, null, 2)}.`);
            });
        });
        this.on("close", () => {
            heartbeat && this.manager.closeDetect();
        });
        this.loaderFiles();
    }

    private loaderFiles() {
        const { loader } = this.app;
        const { FileLoader } = loader;
        const dirs = loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'wss', 'middleware'));
        new FileLoader({
            directory: dirs,
            target: this.loadMiddlewares,
            inject: this.app,
        }).load();
    }

    start() {
        const namespace = this.app.config.wss.namespace;
        for (const nsp in namespace) {
            const middlewares = namespace[nsp].middleware;
            this.logger.info("[tegg-wss] current middlewares", middlewares)
            let connectionMiddlewares: Middleware<ParameterizedContext>[] = [];
            if (middlewares) {
                assert(is.array(middlewares), 'config.wss.namespace.middleware must be Array!');
                for (const middleware of middlewares) {
                    assert(this.loadMiddlewares[middleware], `can't find middleware: ${middleware} !`);
                    this.logger.info(`[tegg-wss] connection middleware {${middleware}}`)
                    connectionMiddlewares.push(this.loadMiddlewares[middleware]);
                }
            }
            const composedMiddlewares = compose([
                ...connectionMiddlewares
            ]);
            this.middlewares.set(nsp, composedMiddlewares);
        }
        this.prepareMiddlewares();
        this.logger.info("[tegg-wss] init success.");
    }

    private async execCustomModel(ws: WebSocket, request: IncomingMessage) {

        const { config } = this.app;
        const { wss } = config;

        this.logger.info(`[tegg-wss] exec custom model`);
        this.logger.info("[tegg-wss] parsing middlewares.");

        const pathname = new URL(request.url || "/").pathname;

        this.logger.info(`[tegg-wss] ${pathname}`);

        const middlware = this.middlewares.get(pathname || '/');

        assert(middlware, `[tegg-wss] can't find exec middleware.`);
        this.logger.info("[tegg-wss] start exec middleware.");

        const ctx: Context = this.app.createContext(request, new ServerResponse(request));

        if (wss.generateClient) {
            const client = wss.generateClient({
                app: this.app,
                socket: ws,
                uuid: v1(),
                ip: request.socket.remoteAddress
            });
            this.app.currentClient = client;
        } else {
            this.app.currentClient = new BaseClient(this.app, ws, v1(), request.socket.remoteAddress);
        }

        try {
            await middlware(ctx);
            this.logger.info("[tegg-wss] client connection done.");
        } catch (e) {
            if (!ws.CLOSED) {
                ws.close();
            }
            ctx.onerror(e);
        }
    }

    private async execNoServerModel(request: IncomingMessage, socket, head) {

        const { config } = this.app;
        const { wss } = config;

        this.logger.info(`[tegg-wss] exec noServer model`);
        this.logger.info("[tegg-wss] parsing middlewares.");

        const pathname = new URL(request.url || "/", `ws://${request.headers.host}`).pathname;
        const middlware = this.middlewares.get(pathname || '/');

        this.logger.info(`[tegg-wss] register path ${pathname}`);

        assert(middlware, `[tegg-wss] can't find exec middleware.`)

        socket.on('error', onSocketError);

        this.logger.info("[tegg-wss] start exec middleware.");
        this.handleUpgrade(request, socket, head, async ws => {

            const ctx = this.app.createContext(request, new ServerResponse(request));
            if (wss.generateClient) {
                const client = wss.generateClient({
                    app: this.app,
                    socket: ws,
                    uuid: v1(),
                    ip: request.socket.remoteAddress
                });
                this.app.currentClient = client;
            } else {
                this.app.currentClient = new BaseClient(this.app, ws, v1(), request.socket.remoteAddress);
            }

            try {
                await middlware(ctx);
                this.logger.info("[tegg-wss] client connection done.");
                socket.removeListener('error', onSocketError);
                this.emit('connection', ws, request);
            } catch (e) {
                if (!ws.CLOSED) {
                    ws.close();
                }
                ctx.onerror(e);
            }
        });
    }

    private prepareMiddlewares() {
        this.logger.info("[tegg-wss] prepared middlewares.");
        this.app.on("server", server => {
            server.on('upgrade', async (request, socket, head) => {
                await this.execNoServerModel(request, socket, head);
            });
        });
    }
}