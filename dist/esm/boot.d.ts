import type { EggCore, ILifecycleBoot } from '@eggjs/core';
/**
 * Socket.IO Boot Hook
 * Implements ILifecycleBoot interface for modern Tegg plugin pattern
 */
export declare class SocketIOBootHook implements ILifecycleBoot {
    private readonly app;
    constructor(app: EggCore);
    /**
     * Config did load hook
     * Application extension is now defined in app/extend/application.ts
     * This hook is kept for future extension logic if needed
     */
    configDidLoad(): void;
    /**
     * Did load hook
     * Load controllers and middleware after all files are loaded
     */
    didLoad(): Promise<void>;
    /**
     * Will ready hook
     * Initialize namespaces and middleware before application is ready
     */
    willReady(): Promise<void>;
    /**
     * Initialize namespace
     * Set up connection and packet middleware, and event handlers
     */
    private initNsp;
}
