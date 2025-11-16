import type { Application } from 'egg';

export default (app: Application) => {
  // Access controller immediately to ensure loader already populated
  const notification = app.io.controller.notification;
  app.io.of('/').route('join-organization', notification.joinOrganization);
};
