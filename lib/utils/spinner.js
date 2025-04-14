const ora = require('ora');

/**
 * A simple spinner class for quick-rv-cli
 */
class Spinner {
  constructor() {
    this.spinner = null;
    this.activeSpinner = false; 
    this.lastText = '';
  }

  /**
   * start a new spinner
   * if there is already a spinner running, stop it first
   */
  start(text) {
    this.lastText = text;
    
    // if there is already a spinner running, stop it first
    if (this.activeSpinner && this.spinner) {
      this.spinner.stop();
    }
    
    this.spinner = ora(text).start();
    this.activeSpinner = true;
    return this.spinner;
  }

  /**
   * succeed the current spinner
   */
  succeed(text) {
    if (this.activeSpinner && this.spinner) {
      this.spinner.succeed(text || this.lastText);
      this.activeSpinner = false;
    }
  }

  /**
   * fail the current spinner
   */
  fail(text) {
    if (this.activeSpinner && this.spinner) {
      this.spinner.fail(text || this.lastText);
      this.activeSpinner = false;
    }
  }

  /**
   * show information
   */
  info(text) {
    if (this.activeSpinner && this.spinner) {
      this.spinner.info(text || this.lastText);
      this.activeSpinner = false;
    }
  }
  
  /**
   * stop the current spinner without showing success or failure
   */
  stop() {
    if (this.activeSpinner && this.spinner) {
      this.spinner.stop();
      this.activeSpinner = false;
    }
  }
}

module.exports = new Spinner();