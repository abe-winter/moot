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

  /** helper for checklist rendering w/ callbacks */
  renderChecklist(document, container, plan, noun, items, className) {
    for (let item of items) {
      let elt = document.createElement('label');
      elt.className = className;
      var check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = item.finished;
      check.onchange = (evt) => this.oncheck(document, plan, noun, item, evt);
      elt.appendChild(check);
      elt.appendChild(document.createTextNode(' ' + item.name + ' '));
      var span = document.createElement('span');
      span.textContent = '(del)';
      span.onclick = (evt) => {
        alert('todo: delete things');
        return false;
      };
      elt.appendChild(span);
      container.appendChild(elt);
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
    
    for (var elt of document.querySelectorAll('label.req-item'))
      elt.remove();
    
    for (var elt of document.querySelectorAll('label.plan-item'))
      elt.remove();
    
    if (plan) {
      this.renderChecklist(document, document.querySelector('div.requirements'), plan, 'req', plan.reqs, 'req-item');
      this.renderChecklist(document, document.querySelector('div.plan-details'), plan, 'task', plan.tasks, 'plan-item');
    }
  }

  oncheck(document, plan, noun, item, evt) {
    this.addChange(document, {parentName: plan.name, name: item.name, noun, verb: 'finished', state: evt.target.checked});
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
