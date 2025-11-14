"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionMiddlewareInit = connectionMiddlewareInit;
const node_http_1 = __importDefault(require("node:http"));
const util_js_1 = require("./util.js");
const debug_1 = __importDefault(require("debug"));
const debugLog = (0, debug_1.default)('egg-socket.io:lib:connectionMiddlewareInit');
/**
 * Initialize connection middleware execution
 * This runs when a socket connects to a namespace
 */
function connectionMiddlewareInit(app, socket, next, connectionMiddlewares) {
    const request = socket.request;
    request.socket = socket;
    const ctx = app.createContext(request, new node_http_1.default.ServerResponse(request));
    (0, util_js_1.delegateSocket)(ctx);
    let nexted = false;
    connectionMiddlewares(ctx, async () => {
        next();
        nexted = true;
        // After socket emit disconnect, resume middlewares
        await new Promise(resolve => {
            socket.once('disconnect', (reason) => {
                debugLog('socket disconnect by: %s', reason);
                resolve();
            });
        });
    })
        .then(() => {
        if (!nexted) {
            next();
        }
    })
        .catch((e) => {
        next(e); // throw to the native socket.io
        app.coreLogger.error(e);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbk1pZGRsZXdhcmVJbml0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb25uZWN0aW9uTWlkZGxld2FyZUluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFjQSw0REFnQ0M7QUE5Q0QsMERBQTZCO0FBSzdCLHVDQUEyQztBQUMzQyxrREFBMEI7QUFFMUIsTUFBTSxRQUFRLEdBQUcsSUFBQSxlQUFLLEVBQUMsNENBQTRDLENBQUMsQ0FBQztBQUVyRTs7O0dBR0c7QUFDSCxTQUFnQix3QkFBd0IsQ0FDdEMsR0FBZ0IsRUFDaEIsTUFBYyxFQUNkLElBQTJCLEVBQzNCLHFCQUFpRDtJQUVqRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBbUUsQ0FBQztJQUMxRixPQUFtQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDckQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUE4QixFQUFFLElBQUksbUJBQUksQ0FBQyxjQUFjLENBQUMsT0FBOEIsQ0FBQyxDQUFDLENBQUM7SUFDdkgsSUFBQSx3QkFBYyxFQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztJQUVuQixxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDcEMsSUFBSSxFQUFFLENBQUM7UUFDUCxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2QsbURBQW1EO1FBQ25ELE1BQU0sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUU7WUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxNQUFjLEVBQUUsRUFBRTtnQkFDM0MsUUFBUSxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7U0FDQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ1QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osSUFBSSxFQUFFLENBQUM7UUFDVCxDQUFDO0lBQ0gsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUU7UUFDbEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDO1FBQ3pDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyJ9