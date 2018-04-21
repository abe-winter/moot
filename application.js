// application.js -- data & display-related state (focused pane, selected item, maybe scroll position, maybe modal status)

var storage = require('./storage');
var Vue = require('vue/dist/vue');
require('./vue-components/change-log');

Vue.component('moot-checkable', {
  props: ['item', 'noun'],
  template: `<div class="item">
    <label>
      <input type="checkbox" v-on:change="$parent.oncheck(noun, item)" v-bind:checked="item.finished">
      {{item.name}}
    </label>
    <div class="controls" v-on:click="$event.stopPropagation()">
      <span v-on:click="$parent.edit(noun, item)" class="tooltip">
        <img alt="edit" src="feather/edit.svg">
        <span class="tooltiptext">edit</span>
      </span>
      <span v-on:click="$parent.del(noun, item)" class="tooltip">
        <img alt="delete" src="feather/trash.svg">
        <span class="tooltiptext" style="right:0">delete</span>
      </span>
    </div>
    <div style="clear:both"></div>
  </div>`,
});

Vue.component('moot-plan-line', {
  props: ['plan'],
  template: `<a class="plan-link" href="#" v-on:click="$parent.selectPlan(plan.name)" v-bind:class="{ highlighted: $parent.selectedPlan === plan }">
    <input type="checkbox" v-on:change="$parent.oncheck('plan', plan)" v-bind:checked="plan.finished" v-on:click="$event.stopPropagation()">
    {{plan.name}}
    <div class="controls" v-on:click="$event.stopPropagation()">
      <span class="tooltip">
        <img alt="history" src="feather/activity.svg">
        <span class="tooltiptext">history</span>
      </span>
      <span v-on:click="$parent.edit('plan', plan)" class="tooltip">
        <img alt="edit" src="feather/edit.svg">
        <span class="tooltiptext">edit</span>
      </span>
      <span v-on:click="$parent.del('plan', plan)" class="tooltip">
        <img alt="delete" src="feather/trash.svg">
        <span class="tooltiptext" style="right:0">delete</span>
      </span>
    </div>
  </a>`,
});

Vue.component('moot-modal', {
  // todo: fix vue warn on input edit
  // todo: focus input on show
  // todo: select first choice on enter
  props: ['modal', 'value'],
  template: `<div class="modal-background" v-on:click="modal.showModal=false" v-if="modal.showModal">
    <div class="modal" v-on:click="$event.stopPropagation()">
      <div class="modal-message">{{modal.message}}</div>
      <input v-if="modal.useInput" v-model="value" v-bind:placeholder="modal.placeholder"></input>
      <div class="modal-choices">
        <button v-for="choice in modal.choices" :class="choice.cssClass" v-on:click="click(choice)">{{choice.name}}</button>
      </div>
    </div>
  </div>`,
  methods: {
    click: function click(choice) {
      this.$emit(choice.name, this.value);
      this.modal.showModal = false;
    },
  }
});

/** expose things called by the UI */
class Application {
  constructor() {
    // todo: don't wrap the vue application
    var store = this.storage = new storage.Storage;
    this.vue = new Vue({
      el:'div.outer',
      data: {
        plans: [],
        selectedPlan: {reqs:[], tasks:[]},
        changeLog: [],
        modal: {
          message: null,
          useInput: true,
          choices: [],
          showModal: false,
        },
      },
      methods: {
        selectPlan: function selectPlan(planName) {
          this.selectedPlan = store.findPlan(planName);
          if (!this.selectedPlan)
            alert('todo: show deleted plans');
        },
        edit: function edit(noun, item) {
          this.modal = {
            message: `rename ${noun} ${item.name}`,
            useInput: true,
            choices: [{name:'ok'}, {name:'cancel'}],
            showModal: true,
            placeholder: 'new name',
          };
          this.$refs.modal.$once('ok', newName =>
            newName ? store.logChange({ noun, name: item.name, parentName: item.parentName, verb: 'edit', newName }) : null
          );
        },
        del: function del(noun, item) {
          store.logChange({ noun, name: item.name, parentName: item.parentName, verb: 'delete' });
        },
        oncheck: function oncheck(noun, item) {
          store.logChange({
            parentName: this.selectedPlan.name,
            name: item.name,
            noun,
            verb: 'finished',
            state: !item.finished,
          });
        },
        undo: function undo(change) {
          alert(`don't know how to undo ${change.noun}.${change.verb}`);
        },
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
    this.storage.logChange({noun: 'plan', verb: 'add', name: name});
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
