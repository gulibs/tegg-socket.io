import { Application, EggLogger, TeggWssClient, TeggWssHeartbeat } from "egg";

export interface Manager {
    getClients(): Map<string, TeggWssClient>;
    getClient(uuid: string): TeggWssClient | undefined;
    getClientSize(): number;
    pushClient(client: TeggWssClient): Map<string, TeggWssClient>;
    removeClient(uuid: string): boolean;
}

class ClientManager implements Manager {

    private static DETECT_MS = 30000;

    public heartbeat: boolean = false;

    private app: Application;
    private logger: EggLogger;
    private heartbeatConfig?: TeggWssHeartbeat;
    private detectInterVal: NodeJS.Timeout;
    private clients: Map<string, TeggWssClient> = new Map<string, TeggWssClient>();

    constructor(app: Application) {
        this.app = app;
        this.logger = app.logger;
        this.heartbeatConfig = this.app.config.wss.heartbeat;
    }

    getApp() {
        return this.app;
    }

    private ping() {
        const logging = this.heartbeatConfig?.logging;
        logging && this.logger.info("[tegg-wss]", "start detect clients.");
        this.clients.forEach((client) => {
            const socket = client.socket;
            if (client.isAlive === false) {
                logging && this.logger.warn(`[tegg-wss] client terminate by uuid:${client.uuid}, because that is not alive.`,);
                return socket.terminate();
            }
            client.isAlive = false;
            socket.ping();
        });
    }

    startDetect(ms?: number) {
        this.heartbeat = true;
        this.logger.info("[tegg-wss] started detector.");
        this.detectInterVal = setInterval(this.ping.bind(this), ms || ClientManager.DETECT_MS);
    }

    closeDetect() {
        this.heartbeat = false;
        if (this.detectInterVal) {
            this.logger.info("[tegg-wss] close detector.");
            clearInterval(this.detectInterVal);
        }
    }

    getClients() {
        return this.clients;
    }

    getClientSize() {
        return this.clients.size;
    }

    getClient(uuid: string) {
        if (this.clients.has(uuid)) {
            return this.clients.get(uuid);
        }
    }

    pushClient(client: TeggWssClient) {
        return this.clients.set(client.uuid, client);
    }

    removeClient(uuid: string): boolean {
        if (this.clients.has(uuid)) {
            return this.clients.delete(uuid);
        }
        return false;
    }
}

export default ClientManager;