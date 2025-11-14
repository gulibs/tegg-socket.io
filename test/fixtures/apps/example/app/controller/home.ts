import { Controller } from 'egg';

export default class HomeController extends Controller {
  async index() {
    this.ctx.body = 'hi, ' + this.app.plugins.teggSocketIO.name;
    this.logger.warn('plugin config: %o', this.app.config.teggSocketIO);
  }
}

