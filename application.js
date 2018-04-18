// application.js -- data & display-related state (focused pane, selected item, maybe scroll position, maybe modal status)

var storage = require('./storage');
var Vue = require('vue/dist/vue');

Vue.component('moot-log-change', {
  props: ['change'],
  // todo: unfinished, undelete (which means isUndelete key to distinguish vs add)
  template: `<div class="log-entry">
    <img :src="'feather/' + this.verb() + '.svg'" :alt="this.verb()">
    <img :src="'feather/' + this.noun() + '.svg'" :alt="this.noun()">
    {{new Date(change.stamp).toLocaleString()}}
    <a v-if="change.noun == 'plan'" href="#" v-on:click="$parent.$parent.selectPlan(change.name)">{{change.name}}</a>
    <span v-else>{{change.name}}</span>
    <a v-if="change.parentName" href="#" v-on:click="$parent.$parent.selectPlan(change.parentName)">({{change.parentName}})</a>
    <div class="controls">
      <span v-on:click="$parent.$parent.undo(change)">undo</span>
    </div>
  </div>`,
  methods: {
    verb: function verb() {
      switch (this.change.verb) {
      case 'add': return 'file-plus';
      case 'edit': return 'edit';
      case 'delete': return 'trash';
      case 'finished':
        // todo: uncheck case
        return 'check-square';
      default:
        return this.change.verb;
      }
    },
    noun: function noun() {
      switch (this.change.noun) {
      case 'plan': return 'map';
      case 'task': return 'play-circle';
      case 'req': return 'target';
      case 'nextup': return 'gift';
      default:
        return this.change.noun;
      }
    },
  },
});

/** for ordered comparison */
function dateToInt(date) {
  var n = date.getDate();
  n += date.getMonth() * 100;
  n += date.getYear() * 10000;
  return n;
}

Vue.component('moot-changelog', {
  props: ['changeLog'],
  template: `<div class="changelog list">
    <h2>today</h2>
    <moot-log-change v-for="(change, index) in this.today()" :change=change :key="\`today-\${index}\`"></moot-log-change>
    <h2>yesterday</h2>
    <moot-log-change v-for="(change, index) in this.yesterday()" :change=change :key="\`yest-\${index}\`"></moot-log-change>
    <h2>7 days</h2>
    <moot-log-change v-for="(change, index) in this.week()" :change=change :key="\`week-\${index}\`"></moot-log-change>
    <h2>older</h2>
    <moot-log-change v-for="(change, index) in this.older()" :change=change :key="\`older-\${index}\`"></moot-log-change>
  </div>`,
  // todo: is there a way to initialize these rather than doing the same computation 4 times?
  methods: {
    today: function today() {
      var today = dateToInt(new Date);
      return this.changeLog.filter(({stamp}) => dateToInt(new Date(stamp)) == today).reverse();
    },
    yesterday: function yesterday() {
      var yest = dateToInt(new Date(new Date - 86400000));
      return this.changeLog.filter(({stamp}) => dateToInt(new Date(stamp)) == yest).reverse();
    },
    week: function yesterday() {
      var a = dateToInt(new Date(new Date - 86400000));
      var b = dateToInt(new Date(new Date - 86400000 * 7));
      return this.changeLog.filter(({stamp}) => {
        var date = dateToInt(new Date(stamp));
        return date < a && date >= b;
      }).reverse();
    },
    older: function older() {
      var b = dateToInt(new Date(new Date - 86400000 * 7));
      return this.changeLog.filter(({stamp}) => dateToInt(new Date(stamp)) < b).reverse();
    },
  },
});

Vue.component('moot-checkable', {
  props: ['item', 'noun'],
  template: `<div class="item">
    <label>
      <input type="checkbox" v-on:change="$parent.oncheck(noun, item)" v-bind:checked="item.finished">
      {{item.name}}
    </label>
    <div class="controls" v-on:click="$event.stopPropagation()">
      <span v-on:click="$parent.edit(noun, item)">edit</span>
      <span v-on:click="$parent.del(noun, item)">delete</span>
    </div>
  </div>`,
});

Vue.component('moot-plan-line', {
  props: ['plan'],
  template: `<a class="plan-link" href="#" v-on:click="$parent.selectPlan(plan.name)" v-bind:class="{ highlighted: $parent.selectedPlan === plan }">
    {{plan.name}}
    <div class="controls" v-on:click="$event.stopPropagation()">
      <span>history</span>
      <span v-on:click="$parent.edit('plan', plan)">edit</span>
      <span v-on:click="$parent.del('plan', plan)">delete</span>
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
