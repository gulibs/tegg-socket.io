import assert from 'node:assert';
import { Namespace } from 'socket.io';
import is from 'is-type-of';
import debug from 'debug';
const debugLog = debug('egg-socket.io:lib:socket.io:namespace');
export const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');
Namespace.prototype.route = function (event, handler) {
    assert(is.string(event), 'event must be string!');
    if (!this[RouterConfigSymbol]) {
        this[RouterConfigSymbol] = new Map();
    }
    if (!this[RouterConfigSymbol].has(event)) {
        debugLog('[egg-socket.io] set router config: %s', event);
        this[RouterConfigSymbol].set(event, handler);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZXNwYWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9zb2NrZXQuaW8vbmFtZXNwYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sTUFBTSxNQUFNLGFBQWEsQ0FBQztBQUNqQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3RDLE9BQU8sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUM1QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFHMUIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7QUFFaEUsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBUzNFLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQWtDLEtBQWEsRUFBRSxPQUFxQjtJQUNoRyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0lBRWxELElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN6QyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDIn0=