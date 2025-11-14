import type { Application } from 'egg';

export default (app: Application) => {
  // Use type assertion since TypeScript can't infer the loaded controller type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatAsyncClass = app.io.controller.chatAsyncClass as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatAsyncObject = app.io.controller.chatAsyncObject as any;
  app.io.route('chat-async-class', chatAsyncClass.ping);
  app.io.route('chat-async-object', chatAsyncObject.ping);
};

