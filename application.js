// application.js -- data & display-related state (focused pane, selected item, maybe scroll position, maybe modal status)

var storage = require('./storage');

/** expose things called by the UI */
class Application {
  constructor() {
    console.log('storage', storage);
    this.storage = new storage.Storage;
    this.activePlanName = null;
  }

  render(document) {
    var plan = this.storage.findPlan(this.activePlanName);
    document.querySelector('div.plans');
    document.querySelector('div.requirements');
    document.querySelector('div.plan-details');
  }

  addChange(document, raw) {
    var {focusSel, logString, activePlanName} = this.storage.logChange(raw);
    this.activePlanName = activePlanName || this.activePlanName;
    this.render(document);
    var logElt = document.createElement('div');
    logElt.className = 'log-entry';
    logElt.textContent = logString;
    document.querySelector('div.log').appendChild(logElt);
    document.querySelector(focusSel).focus();
  }

  addPlan(document, name) {
    this.addChange(document, {noun: 'plan', verb: 'add', name: name});
  }

  selectPlan(document, name) {
    this.activePlanName = name;
    this.render(document);
  }

  addReq(document, name) {
    this.addChange(document, {noun: 'req', verb: 'add', name: name, parentName: this.addPlanName});
  }

  addTask(document, name) {
    this.addChange(document, {noun: 'task', verb: 'add', name: name, parentName: this.addPlanName});
  }

  addNextup(document, name) {
    this.addChange(document, {noun: 'nextup', verb: 'add', name: name});
  }
}
