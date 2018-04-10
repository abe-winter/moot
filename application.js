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
    var plans = document.querySelector('div.plans');
    for (var elt of document.querySelectorAll('a.plan-link'))
      elt.remove();
    for (let plan of this.storage.plans) {
      let elt = document.createElement('a');
      elt.className = 'plan-link';
      elt.textContent = plan.name;
      elt.href = '#';
      elt.onclick = () => this.selectPlan(document, plan.name);
      plans.appendChild(elt);
    }
    
    var plan = this.storage.findPlan(this.activePlanName);
    
    for (var elt of document.querySelectorAll('div.req-item'))
      elt.remove();
    
    for (var elt of document.querySelectorAll('div.plan-item'))
      elt.remove();
    
    if (plan) {
      var dets = document.querySelector('div.plan-details');
      for (let task of plan.tasks) {
        let elt = document.createElement('div');
        elt.className = 'req-item';
        elt.textContent = task.name;
        dets.appendChild(elt);
      }

      var reqs = document.querySelector('div.requirements');
      for (let task of plan.reqs) {
        let elt = document.createElement('div');
        elt.className = 'req-item';
        elt.textContent = task.name;
        reqs.appendChild(elt);
      }
    }
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
    console.log('select plan', name);
    this.activePlanName = name;
    this.render(document);
  }

  addReq(document, name) {
    this.addChange(document, {noun: 'req', verb: 'add', name: name, parentName: this.activePlanName});
  }

  addTask(document, name) {
    this.addChange(document, {noun: 'task', verb: 'add', name: name, parentName: this.activePlanName});
  }

  addNextup(document, name) {
    this.addChange(document, {noun: 'nextup', verb: 'add', name: name});
  }
}
