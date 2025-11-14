"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterConfigSymbol = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const socket_io_1 = require("socket.io");
const is_type_of_1 = __importDefault(require("is-type-of"));
const debug_1 = __importDefault(require("debug"));
const debugLog = (0, debug_1.default)('egg-socket.io:lib:socket.io:namespace');
exports.RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');
socket_io_1.Namespace.prototype.route = function (event, handler) {
    (0, node_assert_1.default)(is_type_of_1.default.string(event), 'event must be string!');
    if (!this[exports.RouterConfigSymbol]) {
        this[exports.RouterConfigSymbol] = new Map();
    }
    if (!this[exports.RouterConfigSymbol].has(event)) {
        debugLog('[egg-socket.io] set router config: %s', event);
        this[exports.RouterConfigSymbol].set(event, handler);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZXNwYWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9zb2NrZXQuaW8vbmFtZXNwYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhEQUFpQztBQUNqQyx5Q0FBc0M7QUFDdEMsNERBQTRCO0FBQzVCLGtEQUEwQjtBQUcxQixNQUFNLFFBQVEsR0FBRyxJQUFBLGVBQUssRUFBQyx1Q0FBdUMsQ0FBQyxDQUFDO0FBRW5ELFFBQUEsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBUzNFLHFCQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxVQUFrQyxLQUFhLEVBQUUsT0FBcUI7SUFDaEcsSUFBQSxxQkFBTSxFQUFDLG9CQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFFbEQsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBa0IsQ0FBQyxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLDBCQUFrQixDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3pDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsMEJBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9DLENBQUM7QUFDSCxDQUFDLENBQUMifQ==