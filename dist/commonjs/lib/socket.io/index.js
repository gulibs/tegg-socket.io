"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const socket_io_1 = require("socket.io");
Object.defineProperty(exports, "Server", { enumerable: true, get: function () { return socket_io_1.Server; } });
require("./namespace.js");
require("./socket.js");
socket_io_1.Server.prototype.route = function (event, handler) {
    return this.sockets.route(event, handler);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3NvY2tldC5pby9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5Q0FBbUM7QUFtQjFCLHVGQW5CQSxrQkFBTSxPQW1CQTtBQWxCZiwwQkFBd0I7QUFDeEIsdUJBQXFCO0FBYXJCLGtCQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxVQUFTLEtBQWEsRUFBRSxPQUFxQjtJQUNwRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMifQ==