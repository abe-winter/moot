// application.js -- data & display-related state (focused pane, selected item, maybe scroll position, maybe modal status)

var storage = require('./storage');
var Vue = require('vue/dist/vue');

Vue.component('moot-checkable', {
  props: ['item', 'noun'],
  template: `<label class="item">
    <input type="checkbox" v-on:change="$parent.oncheck(noun, item)" v-bind:checked="item.finished">
    {{item.name}}
    <span v-on:click="alert('del')">(del)</span>
  </label>`,
});

Vue.component('moot-plan-line', {
  props: ['plan'],
  template: `<a class="plan-link" href="#" v-on:click="$parent.selectPlan(plan.name)">{{plan.name}}</a>`,
});

/** expose things called by the UI */
class Application {
  constructor() {
    console.log('storage', storage);
    this.storage = new storage.Storage;
    var this_ = this;
    this.vue = new Vue({
      el:'div.outer',
      data: {
        plans: [],
        selectedPlan: {reqs:[], tasks:[]},
        changeLog: [],
      },
      methods: {
        selectPlan: function selectPlan(planName) {
          this.selectedPlan = this_.storage.findPlan(planName);
        },
        oncheck: function oncheck(noun, item) {
          this_.storage.logChange({
            parentName: this.selectedPlan.name,
            name: item.name,
            noun,
            verb: 'finished',
            state: !item.finished,
          });
        }
      }
    });
  }

  init1() {
    // todo: set loading modal
    this.storage.deserialize(() => this.init2());
  }

  /** callback for init1 */
  init2() {
    // todo: clear loading modal
    this.vue.plans = this.storage.plans;
    this.vue.changeLog = this.storage.changeLog;
  }

  addPlan(name) {
    this.storage.logChange(document, {noun: 'plan', verb: 'add', name: name});
  }

  addReq(name) {
    if (!this.vue.selectPlan)
      alert("no active plan");
    else
      this.storage.logChange({noun: 'req', verb: 'add', name: name, parentName: this.vue.selectedPlan.name});
  }

  addTask(name) {
    if (!this.vue.selectedPlan)
      alert("no active plan");
    else
      this.storage.logChange({noun: 'task', verb: 'add', name: name, parentName: this.vue.selectedPlan.name});
  }

  addNextup(name) {
    this.storage.logChange({noun: 'nextup', verb: 'add', name: name});
  }
}
