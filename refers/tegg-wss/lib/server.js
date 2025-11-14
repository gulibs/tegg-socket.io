"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EggWebSocketServer = exports.BaseClient = void 0;
const assert_1 = __importDefault(require("assert"));
const http_1 = require("http");
const is_type_of_1 = __importDefault(require("is-type-of"));
const koa_compose_1 = __importDefault(require("koa-compose"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const ws_1 = require("ws");
const ClientManager_1 = __importDefault(require("./ClientManager"));
const onSocketError = (err) => {
    console.error(err);
};
class BaseClient {
    uuid;
    socket;
    ip;
    subject;
    app;
    isAlive = false;
    isPong = false;
    logger;
    heartbeatConfig;
    constructor(app, socket, uuid, ip, subject) {
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
    heartbeatCallback(data) {
        const logging = this.heartbeatConfig?.logging;
        logging && this.logger.info("[tegg-wss]", `"[Client:${this.uuid}] execute heartbeat callback ${data.toString("utf-8")}."`);
        this.isAlive = true;
    }
}
exports.BaseClient = BaseClient;
class EggWebSocketServer extends ws_1.WebSocketServer {
    app;
    logger;
    loadMiddlewares = {};
    middlewares = new Map();
    manager;
    constructor(app) {
        const { config, logger } = app;
        const { wss: wssConfig } = config;
        (0, assert_1.default)(wssConfig && wssConfig.options, 'please add plugin config.');
        super({ ...wssConfig.options });
        const { heartbeat } = wssConfig;
        this.app = app;
        this.app.wss = this;
        this.manager = new ClientManager_1.default(app);
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
    loaderFiles() {
        const { loader } = this.app;
        const { FileLoader } = loader;
        const dirs = loader.getLoadUnits().map(unit => path_1.default.join(unit.path, 'app', 'wss', 'middleware'));
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
            this.logger.info("[tegg-wss] current middlewares", middlewares);
            let connectionMiddlewares = [];
            if (middlewares) {
                (0, assert_1.default)(is_type_of_1.default.array(middlewares), 'config.wss.namespace.middleware must be Array!');
                for (const middleware of middlewares) {
                    (0, assert_1.default)(this.loadMiddlewares[middleware], `can't find middleware: ${middleware} !`);
                    this.logger.info(`[tegg-wss] connection middleware {${middleware}}`);
                    connectionMiddlewares.push(this.loadMiddlewares[middleware]);
                }
            }
            const composedMiddlewares = (0, koa_compose_1.default)([
                ...connectionMiddlewares
            ]);
            this.middlewares.set(nsp, composedMiddlewares);
        }
        this.prepareMiddlewares();
        this.logger.info("[tegg-wss] init success.");
    }
    async execCustomModel(ws, request) {
        const { config } = this.app;
        const { wss } = config;
        this.logger.info(`[tegg-wss] exec custom model`);
        this.logger.info("[tegg-wss] parsing middlewares.");
        const pathname = new URL(request.url || "/").pathname;
        this.logger.info(`[tegg-wss] ${pathname}`);
        const middlware = this.middlewares.get(pathname || '/');
        (0, assert_1.default)(middlware, `[tegg-wss] can't find exec middleware.`);
        this.logger.info("[tegg-wss] start exec middleware.");
        const ctx = this.app.createContext(request, new http_1.ServerResponse(request));
        if (wss.generateClient) {
            const client = wss.generateClient({
                app: this.app,
                socket: ws,
                uuid: (0, uuid_1.v1)(),
                ip: request.socket.remoteAddress
            });
            this.app.currentClient = client;
        }
        else {
            this.app.currentClient = new BaseClient(this.app, ws, (0, uuid_1.v1)(), request.socket.remoteAddress);
        }
        try {
            await middlware(ctx);
            this.logger.info("[tegg-wss] client connection done.");
        }
        catch (e) {
            if (!ws.CLOSED) {
                ws.close();
            }
            ctx.onerror(e);
        }
    }
    async execNoServerModel(request, socket, head) {
        const { config } = this.app;
        const { wss } = config;
        this.logger.info(`[tegg-wss] exec noServer model`);
        this.logger.info("[tegg-wss] parsing middlewares.");
        const pathname = new URL(request.url || "/", `ws://${request.headers.host}`).pathname;
        const middlware = this.middlewares.get(pathname || '/');
        this.logger.info(`[tegg-wss] register path ${pathname}`);
        (0, assert_1.default)(middlware, `[tegg-wss] can't find exec middleware.`);
        socket.on('error', onSocketError);
        this.logger.info("[tegg-wss] start exec middleware.");
        this.handleUpgrade(request, socket, head, async (ws) => {
            const ctx = this.app.createContext(request, new http_1.ServerResponse(request));
            if (wss.generateClient) {
                const client = wss.generateClient({
                    app: this.app,
                    socket: ws,
                    uuid: (0, uuid_1.v1)(),
                    ip: request.socket.remoteAddress
                });
                this.app.currentClient = client;
            }
            else {
                this.app.currentClient = new BaseClient(this.app, ws, (0, uuid_1.v1)(), request.socket.remoteAddress);
            }
            try {
                await middlware(ctx);
                this.logger.info("[tegg-wss] client connection done.");
                socket.removeListener('error', onSocketError);
                this.emit('connection', ws, request);
            }
            catch (e) {
                if (!ws.CLOSED) {
                    ws.close();
                }
                ctx.onerror(e);
            }
        });
    }
    prepareMiddlewares() {
        this.logger.info("[tegg-wss] prepared middlewares.");
        this.app.on("server", server => {
            server.on('upgrade', async (request, socket, head) => {
                await this.execNoServerModel(request, socket, head);
            });
        });
    }
}
exports.EggWebSocketServer = EggWebSocketServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9EQUE0QjtBQUU1QiwrQkFBdUQ7QUFDdkQsNERBQTRCO0FBRzVCLDhEQUFrQztBQUNsQyxnREFBd0I7QUFDeEIsK0JBQTBCO0FBQzFCLDJCQUFnRDtBQUNoRCxvRUFBNEM7QUFFNUMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQTtBQU1ELE1BQWEsVUFBVTtJQUVaLElBQUksQ0FBUztJQUNiLE1BQU0sQ0FBWTtJQUNsQixFQUFFLENBQVU7SUFDWixPQUFPLENBQU87SUFDZCxHQUFHLENBQWM7SUFDakIsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNmLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDZixNQUFNLENBQVk7SUFDbEIsZUFBZSxDQUFvQjtJQUUzQyxZQUFZLEdBQWdCLEVBQUUsTUFBaUIsRUFBRSxJQUFZLEVBQUUsRUFBVyxFQUFFLE9BQWE7UUFDckYsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUN6QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7SUFDekQsQ0FBQztJQUVELFNBQVM7UUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNkLElBQUks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