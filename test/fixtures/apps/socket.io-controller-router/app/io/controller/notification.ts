import type { Application } from 'egg';

export default (app: Application) => {
  return class NotificationController extends app.Controller {
    async joinOrganization() {
      const payload = (this.ctx.args?.[0] ?? {}) as { organizationId?: string };
      const organizationId = payload.organizationId ?? 'unknown';
      this.ctx.socket.emit('joined-organization', { organizationId });
    }
  };
};
