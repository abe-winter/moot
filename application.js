// application.js -- data & display-related state (focused pane, selected item, maybe scroll position, maybe modal status)

var storage = require('./storage');

/** expose things called by the UI */
class Application {
  constructor() {
    console.log('storage', storage);
    this.storage = new storage.Storage;
    this.activePlanName = null;
  }

  init1(document) {
    // todo: set loading modal
    this.storage.deserialize(() => this.init2(document));
  }

  /** callback for init1 */
  init2(document) {
    // todo: clear loading modal
    this.render(document);
    var logContainer = document.querySelector('div.log');
    for (let change of this.storage.changeLog) {
      this.addLog(document, logContainer, change.render());
    }
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

  /** render a log string to dom */
  addLog(document, container, logString) {
    var logElt = document.createElement('div');
    logElt.className = 'log-entry';
    logElt.textContent = logString;
    container.appendChild(logElt);
  }

  addChange(document, raw) {
    var {focusSel, logString, activePlanName} = this.storage.logChange(raw);
    this.activePlanName = activePlanName || this.activePlanName;
    this.render(document);
    this.addLog(document, document.querySelector('div.log'), logString);
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
    if (!this.activePlanName)
      alert("no active plan");
    else
      this.addChange(document, {noun: 'req', verb: 'add', name: name, parentName: this.activePlanName});
  }

  addTask(document, name) {
    if (!this.activePlanName)
      alert("no active plan");
    else
      this.addChange(document, {noun: 'task', verb: 'add', name: name, parentName: this.activePlanName});
  }

  addNextup(document, name) {
    this.addChange(document, {noun: 'nextup', verb: 'add', name: name});
  }
}
