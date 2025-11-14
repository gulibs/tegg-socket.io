"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./lib/server");
exports.default = (app) => {
    const wss = new server_1.EggWebSocketServer(app);
    app.beforeStart(async () => {
        wss.start();
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EseUNBQWtEO0FBRWxELGtCQUFlLENBQUMsR0FBZ0IsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUksMkJBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUN2QixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDaEIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUEifQ==