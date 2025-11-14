"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CtxEventSymbol = void 0;
exports.packetMiddlewareInit = packetMiddlewareInit;
const node_http_1 = __importDefault(require("node:http"));
const node_events_1 = require("node:events");
const util_js_1 = require("./util.js");
const namespace_js_1 = require("./socket.io/namespace.js");
const types_js_1 = require("./types.js");
Object.defineProperty(exports, "CtxEventSymbol", { enumerable: true, get: function () { return types_js_1.CtxEventSymbol; } });
const debug_1 = __importDefault(require("debug"));
const debugLog = (0, debug_1.default)('egg-socket.io:lib:packetMiddlewareInit');
/**
 * Initialize packet middleware execution
 * This runs for each socket packet/message
 */
function packetMiddlewareInit(app, socket, packet, next, packetMiddlewares, nsp) {
    const request = socket.request;
    request.socket = socket;
    const ctx = app.createContext(request, new node_http_1.default.ServerResponse(request));
    ctx.packet = packet;
    ctx[types_js_1.CtxEventSymbol] = new node_events_1.EventEmitter();
    (0, util_js_1.delegateSocket)(ctx);
    packetMiddlewares(ctx, async () => {
        packet.push(ctx);
        next();
        const eventName = packet[0];
        const routerMap = nsp[namespace_js_1.RouterConfigSymbol];
        if (routerMap && routerMap.has(eventName)) {
            debugLog('[egg-socket.io] wait controller finished!');
            // After controller execute finished, resume middlewares
            await new Promise((resolve, reject) => {
                ctx[types_js_1.CtxEventSymbol]?.on('finshed', (error) => {
                    debugLog('[egg-socket.io] controller execute finished, resume middlewares');
                    if (!error) {
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                });
            });
        }
    }).catch((e) => {
        next(e); // throw to the native socket.io
        app.coreLogger.error(e);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2V0TWlkZGxld2FyZUluaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3BhY2tldE1pZGRsZXdhcmVJbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQWlCQSxvREFzQ0M7QUF2REQsMERBQTZCO0FBQzdCLDZDQUEyQztBQUszQyx1Q0FBMkM7QUFDM0MsMkRBQThEO0FBQzlELHlDQUE0QztBQWlEbkMsK0ZBakRBLHlCQUFjLE9BaURBO0FBaER2QixrREFBMEI7QUFFMUIsTUFBTSxRQUFRLEdBQUcsSUFBQSxlQUFLLEVBQUMsd0NBQXdDLENBQUMsQ0FBQztBQUVqRTs7O0dBR0c7QUFDSCxTQUFnQixvQkFBb0IsQ0FDbEMsR0FBZ0IsRUFDaEIsTUFBYyxFQUNkLE1BQXNCLEVBQ3RCLElBQTJCLEVBQzNCLGlCQUE2QyxFQUM3QyxHQUFzQjtJQUV0QixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBbUUsQ0FBQztJQUMxRixPQUFtQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDckQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUE4QixFQUFFLElBQUksbUJBQUksQ0FBQyxjQUFjLENBQUMsT0FBOEIsQ0FBQyxDQUFvQixDQUFDO0lBQzFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3BCLEdBQUcsQ0FBQyx5QkFBYyxDQUFDLEdBQUcsSUFBSSwwQkFBWSxFQUFFLENBQUM7SUFDekMsSUFBQSx3QkFBYyxFQUFDLEdBQXlCLENBQUMsQ0FBQztJQUUxQyxpQkFBaUIsQ0FBQyxHQUF5QixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3RELE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakIsSUFBSSxFQUFFLENBQUM7UUFDUCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLGlDQUFrQixDQUFDLENBQUM7UUFDMUMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQzFDLFFBQVEsQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1lBQ3RELHdEQUF3RDtZQUN4RCxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUMxQyxHQUFHLENBQUMseUJBQWMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFhLEVBQUUsRUFBRTtvQkFDbkQsUUFBUSxDQUFDLGlFQUFpRSxDQUFDLENBQUM7b0JBQzVFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxPQUFPLEVBQUUsQ0FBQztvQkFDWixDQUFDO3lCQUFNLENBQUM7d0JBQ04sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNoQixDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUU7UUFDcEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDO1FBQ3pDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyJ9