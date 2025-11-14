"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ClientManager {
    static DETECT_MS = 30000;
    heartbeat = false;
    app;
    logger;
    heartbeatConfig;
    detectInterVal;
    clients = new Map();
    constructor(app) {
        this.app = app;
        this.logger = app.logger;
        this.heartbeatConfig = this.app.config.wss.heartbeat;
    }
    getApp() {
        return this.app;
    }
    ping() {
        const logging = this.heartbeatConfig?.logging;
        logging && this.logger.info("[tegg-wss]", "start detect clients.");
        this.clients.forEach((client) => {
            const socket = client.socket;
            if (client.isAlive === false) {
                logging && this.logger.warn(`[tegg-wss] client terminate by uuid:${client.uuid}, because that is not alive.`);
                return socket.terminate();
            }
            client.isAlive = false;
            socket.ping();
        });
    }
    startDetect(ms) {
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
    getClient(uuid) {
        if (this.clients.has(uuid)) {
            return this.clients.get(uuid);
        }
    }
    pushClient(client) {
        return this.clients.set(client.uuid, client);
    }
    removeClient(uuid) {
        if (this.clients.has(uuid)) {
            return this.clients.delete(uuid);
        }
        return false;
    }
}
exports.default = ClientManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xpZW50TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNsaWVudE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxNQUFNLGFBQWE7SUFFUCxNQUFNLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUUxQixTQUFTLEdBQVksS0FBSyxDQUFDO0lBRTFCLEdBQUcsQ0FBYztJQUNqQixNQUFNLENBQVk7SUFDbEIsZUFBZSxDQUFvQjtJQUNuQyxjQUFjLENBQWlCO0lBQy9CLE9BQU8sR0FBK0IsSUFBSSxHQUFHLEVBQXlCLENBQUM7SUFFL0UsWUFBWSxHQUFnQjtRQUN4QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUN6QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7SUFDekQsQ0FBQztJQUVELE1BQU07UUFDRixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDcEIsQ0FBQztJQUVPLElBQUk7UUFDUixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQztRQUM5QyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLHVCQUF1QixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUM1QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzdCLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUU7Z0JBQzFCLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsTUFBTSxDQUFDLElBQUksOEJBQThCLENBQUUsQ0FBQztnQkFDL0csT0FBTyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7YUFDN0I7WUFDRCxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUN2QixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsV0FBVyxDQUFDLEVBQVc7UUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFRCxXQUFXO1FBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDL0MsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUN0QztJQUNMLENBQUM7SUFFRCxVQUFVO1FBQ04sT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxhQUFhO1FBQ1QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztJQUM3QixDQUFDO0lBRUQsU0FBUyxDQUFDLElBQVk7UUFDbEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN4QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pDO0lBQ0wsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFxQjtRQUM1QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELFlBQVksQ0FBQyxJQUFZO1FBQ3JCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDeEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNwQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7O0FBR0wsa0JBQWUsYUFBYSxDQUFDIn0=