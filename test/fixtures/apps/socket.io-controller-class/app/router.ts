import type { Application } from 'egg';

export default (app: Application) => {
  // chat is a class instance, ping and pingGenerator are RouteHandler methods
  // Use type assertion since TypeScript can't infer the loaded controller type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatController = app.io.controller.chat as any;
  app.io.route('chat', chatController.ping);
  app.io.route('chat-generator', chatController.pingGenerator);
};
