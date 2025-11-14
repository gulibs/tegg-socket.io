// make sure to import egg typings and let typescript know about it
// @see https://github.com/whxaxes/blog/issues/11
// and https://www.typescriptlang.org/docs/handbook/declaration-merging.html
import 'egg';
import type { Server, Socket } from 'socket.io';

declare module 'egg' {
  /**
   * Custom middleware interface
   * Extend this interface in your application to add type definitions for your middleware
   * @example
   * ```ts
   * declare module 'egg' {
   *   interface CustomMiddleware {
   *     auth: AuthMiddleware;
   *     filter: FilterMiddleware;
   *   }
   * }
   * ```
   */
  interface CustomMiddleware {
    [key: string]: unknown;
  }

  /**
   * Custom controller interface
   * Extend this interface in your application to add type definitions for your controllers
   * @example
   * ```ts
   * declare module 'egg' {
   *   interface CustomController {
   *     chat: ChatController;
   *     index: IndexController;
   *   }
   * }
   * ```
   */
  interface CustomController {
    [key: string]: unknown;
  }

  interface Application {
    /**
     * Socket.IO server instance
     * Created lazily when first accessed
     */
    io: Server & {
      /**
       * Loaded middleware map
       * Middleware loaded from app/io/middleware/ directories
       */
      middleware: CustomMiddleware;
      /**
       * Loaded controller map
       * Controllers loaded from app/io/controller/ directories
       */
      controller: CustomController;
    };
  }

  interface Context {
    /**
     * Socket.IO socket instance
     * Available in Socket.IO middleware and controllers
     */
    socket?: Socket;
  }
}

declare module '@eggjs/core' {
  import type { CustomMiddleware, CustomController } from 'egg';

  interface EggCore {
    /**
     * Socket.IO server instance
     * Created lazily when first accessed
     */
    io: Server & {
      /**
       * Loaded middleware map
       * Middleware loaded from app/io/middleware/ directories
       */
      middleware: CustomMiddleware;
      /**
       * Loaded controller map
       * Controllers loaded from app/io/controller/ directories
       */
      controller: CustomController;
    };
  }
}
