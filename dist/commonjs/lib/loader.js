"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadControllersAndMiddleware = loadControllersAndMiddleware;
const node_path_1 = __importDefault(require("node:path"));
const debug_1 = __importDefault(require("debug"));
const debugLog = (0, debug_1.default)('egg-socket.io:lib:loader');
/**
 * Load controllers and middleware using Tegg-compatible FileLoader pattern
 * This matches the approach used in tegg-wss
 */
function loadControllersAndMiddleware(app) {
    const { loader } = app;
    const { FileLoader } = loader;
    // Load middleware from app/io/middleware/ across all load units
    const middlewareDirs = loader.getLoadUnits().map(unit => node_path_1.default.join(unit.path, 'app', 'io', 'middleware'));
    // Runtime uses LoadedMiddleware, but types use CustomMiddleware
    // Initialize middleware object if it doesn't exist
    if (!app.io.middleware) {
        app.io.middleware = {};
    }
    // Use type assertion to access LoadedMiddleware for FileLoader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const middlewareTarget = app.io.middleware;
    new FileLoader({
        directory: middlewareDirs,
        target: middlewareTarget,
        inject: app,
    }).load();
    // Reassign to ensure type compatibility
    // TypeScript may complain here because CustomMiddleware can be extended by users
    // but at runtime, LoadedMiddleware has index signature and is compatible
    app.io.middleware = middlewareTarget;
    debugLog('[egg-socket.io] app.io.middleware: %o', app.io.middleware);
    // Load controllers from app/io/controller/ across all load units
    // Note: Reference implementation uses app.loader.loadController() for controllers
    // but that method is designed for app/controller, not app/io/controller
    // So we use FileLoader here, matching the middleware loading pattern
    const controllerDirs = loader.getLoadUnits().map(unit => node_path_1.default.join(unit.path, 'app', 'io', 'controller'));
    // Runtime uses LoadedController, but types use CustomController
    // Initialize controller object if it doesn't exist
    if (!app.io.controller) {
        app.io.controller = {};
    }
    // Use type assertion to access LoadedController for FileLoader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controllerTarget = app.io.controller;
    new FileLoader({
        directory: controllerDirs,
        target: controllerTarget,
        inject: app,
    }).load();
    // Reassign to ensure type compatibility
    // TypeScript may complain here because CustomController can be extended by users
    // but at runtime, LoadedController has index signature and is compatible
    app.io.controller = controllerTarget;
    debugLog('[egg-socket.io] app.io.controller: %o', app.io.controller);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFpQkEsb0VBd0RDO0FBekVELDBEQUE2QjtBQUU3QixrREFBMEI7QUFTMUIsTUFBTSxRQUFRLEdBQUcsSUFBQSxlQUFLLEVBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUVuRDs7O0dBR0c7QUFDSCxTQUFnQiw0QkFBNEIsQ0FBQyxHQUFnQjtJQUMzRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ3ZCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUM7SUFFOUIsZ0VBQWdFO0lBQ2hFLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDdEQsbUJBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUNoRCxDQUFDO0lBRUYsZ0VBQWdFO0lBQ2hFLG1EQUFtRDtJQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN2QixHQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsR0FBRyxFQUFpQyxDQUFDO0lBQ3hELENBQUM7SUFDRCwrREFBK0Q7SUFDL0QsOERBQThEO0lBQzlELE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFxQyxDQUFDO0lBQ3RFLElBQUksVUFBVSxDQUFDO1FBQ2IsU0FBUyxFQUFFLGNBQWM7UUFDekIsTUFBTSxFQUFFLGdCQUFnQjtRQUN4QixNQUFNLEVBQUUsR0FBRztLQUNaLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNWLHdDQUF3QztJQUN4QyxpRkFBaUY7SUFDakYseUVBQXlFO0lBQ3pFLEdBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxHQUFHLGdCQUErQyxDQUFDO0lBRXBFLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRXJFLGlFQUFpRTtJQUNqRSxrRkFBa0Y7SUFDbEYsd0VBQXdFO0lBQ3hFLHFFQUFxRTtJQUNyRSxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3RELG1CQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FDaEQsQ0FBQztJQUVGLGdFQUFnRTtJQUNoRSxtREFBbUQ7SUFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdkIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEdBQUcsRUFBaUMsQ0FBQztJQUN4RCxDQUFDO0lBQ0QsK0RBQStEO0lBQy9ELDhEQUE4RDtJQUM5RCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsVUFBcUMsQ0FBQztJQUN0RSxJQUFJLFVBQVUsQ0FBQztRQUNiLFNBQVMsRUFBRSxjQUFjO1FBQ3pCLE1BQU0sRUFBRSxnQkFBZ0I7UUFDeEIsTUFBTSxFQUFFLEdBQUc7S0FDWixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDVix3Q0FBd0M7SUFDeEMsaUZBQWlGO0lBQ2pGLHlFQUF5RTtJQUN6RSxHQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztJQUVyQyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN2RSxDQUFDIn0=