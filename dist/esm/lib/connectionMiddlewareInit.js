import http from 'node:http';
import { delegateSocket } from './util.js';
import debug from 'debug';
const debugLog = debug('egg-socket.io:lib:connectionMiddlewareInit');
/**
 * Initialize connection middleware execution
 * This runs when a socket connects to a namespace
 */
export function connectionMiddlewareInit(app, socket, next, connectionMiddlewares) {
    const request = socket.request;
    request.socket = socket;
    const ctx = app.createContext(request, new http.ServerResponse(request));
    delegateSocket(ctx);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbk1pZGRsZXdhcmVJbml0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb25uZWN0aW9uTWlkZGxld2FyZUluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBSzdCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRTFCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO0FBRXJFOzs7R0FHRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FDdEMsR0FBZ0IsRUFDaEIsTUFBYyxFQUNkLElBQTJCLEVBQzNCLHFCQUFpRDtJQUVqRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBbUUsQ0FBQztJQUMxRixPQUFtQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDckQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUE4QixFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUE4QixDQUFDLENBQUMsQ0FBQztJQUN2SCxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBRW5CLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNwQyxJQUFJLEVBQUUsQ0FBQztRQUNQLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDZCxtREFBbUQ7UUFDbkQsTUFBTSxJQUFJLE9BQU8sQ0FBTyxPQUFPLENBQUMsRUFBRTtZQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFFO2dCQUMzQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzdDLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztTQUNDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDVCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixJQUFJLEVBQUUsQ0FBQztRQUNULENBQUM7SUFDSCxDQUFDLENBQUM7U0FDRCxLQUFLLENBQUMsQ0FBQyxDQUFRLEVBQUUsRUFBRTtRQUNsQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0M7UUFDekMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIn0=