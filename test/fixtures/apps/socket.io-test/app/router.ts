import type { Application } from 'egg';

export default (app: Application) => {
  // FileLoader automatically calls factory functions, so chat is already a RouteHandler
  // Use type assertion since TypeScript can't infer the loaded controller type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.io.route('chat', app.io.controller.chat as any);
};

