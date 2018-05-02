var Vue = require('vue/dist/vue');

Vue.component('moot-log-change', {
  props: ['change'],
  // todo: unfinished, undelete (which means isUndelete key to distinguish vs add)
  template: `<div class="log-entry">
    <span class="tooltip">
      <img :src="'feather/' + this.verb() + '.svg'" :alt="this.verb()">
      <span class="tooltiptext">{{this.change.verb}}</span>
    </span>
    <span class="tooltip">
      <img :src="'feather/' + this.noun() + '.svg'" :alt="this.noun()">
      <span class="tooltiptext">{{this.change.noun}}</span>
    </span>
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
      case 'start': return 'wind'; // todo: stop case
      case 'finished': return 'check-square'; // todo: uncheck case
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
      case 'event': return 'activity';
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
