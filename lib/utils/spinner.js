const ora = require('ora');

class Spinner {
  constructor() {
    this.spinner = null;
  }

  start(text) {
    this.spinner = ora(text).start();
  }

  succeed(text) {
    if (this.spinner) {
      this.spinner.succeed(text);
    }
  }

  fail(text) {
    if (this.spinner) {
      this.spinner.fail(text);
    }
  }

  info(text) {
    if (this.spinner) {
      this.spinner.info(text);
    }
  }
}

module.exports = new Spinner();