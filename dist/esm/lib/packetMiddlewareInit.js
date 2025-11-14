import http from 'node:http';
import { EventEmitter } from 'node:events';
import { delegateSocket } from './util.js';
import { RouterConfigSymbol } from './socket.io/namespace.js';
import { CtxEventSymbol } from './types.js';
import debug from 'debug';
const debugLog = debug('egg-socket.io:lib:packetMiddlewareInit');
/**
 * Initialize packet middleware execution
 * This runs for each socket packet/message
 */
export function packetMiddlewareInit(app, socket, packet, next, packetMiddlewares, nsp) {
    const request = socket.request;
    request.socket = socket;
    const ctx = app.createContext(request, new http.ServerResponse(request));
    ctx.packet = packet;
    ctx[CtxEventSymbol] = new EventEmitter();
    delegateSocket(ctx);
    packetMiddlewares(ctx, async () => {
        packet.push(ctx);
        next();
        const eventName = packet[0];
        const routerMap = nsp[RouterConfigSymbol];
        if (routerMap && routerMap.has(eventName)) {
            debugLog('[egg-socket.io] wait controller finished!');
            // After controller execute finished, resume middlewares
            await new Promise((resolve, reject) => {
                ctx[CtxEventSymbol]?.on('finshed', (error) => {
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
export { CtxEventSymbol };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2V0TWlkZGxld2FyZUluaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3BhY2tldE1pZGRsZXdhcmVJbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBSzNDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDOUQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUM1QyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFMUIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7QUFFakU7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUNsQyxHQUFnQixFQUNoQixNQUFjLEVBQ2QsTUFBc0IsRUFDdEIsSUFBMkIsRUFDM0IsaUJBQTZDLEVBQzdDLEdBQXNCO0lBRXRCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFtRSxDQUFDO0lBQzFGLE9BQW1DLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUNyRCxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQThCLEVBQUUsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQThCLENBQUMsQ0FBb0IsQ0FBQztJQUMxSSxHQUFHLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUNwQixHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUN6QyxjQUFjLENBQUMsR0FBeUIsQ0FBQyxDQUFDO0lBRTFDLGlCQUFpQixDQUFDLEdBQXlCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdEQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixJQUFJLEVBQUUsQ0FBQztRQUNQLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUMxQyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDMUMsUUFBUSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7WUFDdEQsd0RBQXdEO1lBQ3hELE1BQU0sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBYSxFQUFFLEVBQUU7b0JBQ25ELFFBQVEsQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO29CQUM1RSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ1gsT0FBTyxFQUFFLENBQUM7b0JBQ1osQ0FBQzt5QkFBTSxDQUFDO3dCQUNOLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEIsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQVEsRUFBRSxFQUFFO1FBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdDQUFnQztRQUN6QyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUMifQ==