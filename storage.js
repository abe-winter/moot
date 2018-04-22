// storage.js -- log-based storage system

var readline = require('readline');
var fs = require('fs');

class AddVerb {
  constructor(stamp, noun, name, parentName) {
    this.stamp = stamp;
    this.noun = noun;
    this.name = name;
    this.parentName = parentName;
  }

  get verb() {return 'add';}

  /** make sure noun supports verb */
  checkSupported() {
    return ['nextup', 'plan', 'task', 'req'].indexOf(this.noun) != -1;
  }

  render() {
    return `${this.verb} ${this.noun}.${this.name}`;
  }
}

class FinishedVerb {
  constructor(stamp, noun, name, state, parentName) {
    this.stamp = stamp;
    this.noun = noun;
    this.name = name;
    this.state = state;
    this.parentName = parentName;
  }
  
  get verb() {return 'finished';}

  /** make sure noun supports verb */
  checkSupported() {
    return ['plan', 'task', 'req'].indexOf(this.noun) != -1;
  }

  render() {
    return `${this.verb} ${this.noun}.${this.name} -> ${this.state}`;
  }
}

/** careful: start isn't the opposite of finished. finished means checkbox, start means work-in-progress */
class StartVerb {
  constructor(stamp, noun, name, state, parentName) {
    this.stamp = stamp;
    this.noun = noun;
    this.name = name;
    this.state = state;
    this.parentName = parentName;
  }

  get verb() {return 'start';}

  /** make sure noun supports verb */
  checkSupported() {
    return ['task'].indexOf(this.noun) != -1;
  }

  render() {
    return `${this.verb} ${this.noun}.${this.name} -> ${this.state}`;
  }
}

class DeleteVerb {
  constructor(stamp, noun, name, parentName) {
    this.stamp = stamp;
    this.noun = noun;
    this.name = name;
    this.parentName = parentName;
  }

  get verb() {return 'delete';}

  /** make sure noun supports verb */
  checkSupported() {
    return ['plan', 'task', 'req'].indexOf(this.noun) != -1;
  }

  render() {
    return `${this.verb} ${this.noun}.${this.name}`;
  }
}

class EditVerb {
  constructor(stamp, noun, name, newName, newDetails, parentName) {
    this.stamp = stamp;
    this.noun = noun;
    this.name = name;
    this.newName = newName;
    this.newDetails = newDetails;
    this.parentName = parentName;
  }

  get verb() {return 'edit';}

  /** make sure noun supports verb */
  checkSupported() {
    return ['plan', 'task', 'req'].indexOf(this.noun) != -1;
  }

  render() {
    return `edit ${this.noun}.${this.name} -> ${this.newName}, details ${this.newDetails}`;
  }
}

function inflateChange(rawChange) {
  if (rawChange.v != 0 && rawChange.v != null)
    throw new Error("you're on a new version my friend");
  switch (rawChange.verb) {
  case 'add':
    return new AddVerb(rawChange.stamp, rawChange.noun, rawChange.name, rawChange.parentName);
  case 'finished':
    return new FinishedVerb(rawChange.stamp, rawChange.noun, rawChange.name, rawChange.state, rawChange.parentName);
  case 'delete':
    return new DeleteVerb(rawChange.stamp, rawChange.noun, rawChange.name, rawChange.parentName);
  case 'edit':
    return new EditVerb(rawChange.stamp, rawChange.noun, rawChange.name, rawChange.newName, rawChange.newDetails, rawChange.parentName);
  case 'start':
    return new StartVerb(rawChange.stamp, rawChange.noun, rawChange.name, rawChange.state, rawChange.parentName);
  default:
    throw new Error(`datafile from newer version? unk type ${rawChange.type}`);
  }
}

class Plan {
  constructor(name) {
    this.name = name;
    this.reqs = [];
    this.tasks = [];
  }
}

/** what should be the active plan in UX after applying a change, or null if keep as-is */
function activePlanName(change) {
  switch (change.noun) {
    case 'plan': return change.verb == 'add' ? change.name : null;
    case 'req': // fall through
    case 'task':
      return null; // because if it's open for editing it's already open
    case 'nextup': return null;
    default: throw new Error(`unk noun ${change.noun}`);
  }
}

/** helper */
function find(items, name) {
  for (let item of items)
    if (item.name == name)
      return item;
  return null;
}

class Storage {
  constructor() {
    this.changeLog = []; // log-based storage. stores rawChange (i.e. json serializable)
    this.plans = [];
    this.icebox = [];
    this.logFileName = 'log.json';
  }

  findPlan(name, required) {
    for (var plan of this.plans) {
      if (plan.name == name)
        return plan;
    }
    if (required)
      throw new Error(`couldn't find required plan ${name}`);
    return null;
  }

  changePlan(change) {
    var plan = this.findPlan(change.name, false);
    switch (change.verb) {
      case 'add':
        if (plan != null)
          throw new Error(`plan ${change.name} already exists`);
        this.plans.push(new Plan(change.name));
        break;
      case 'edit':
        if (plan == null)
          throw new Error(`plan ${change.name} not found`);
        plan.name = change.newName;
        break;
      case 'finished':
        if (plan == null)
          throw new Error(`plan ${change.name} not found`);
        plan.finished = change.state;
        break;
      case 'delete':
        if (plan == null)
          throw new Error(`plan ${change.name} not found`);
        this.plans.splice(this.plans.indexOf(plan), 1);
        break;
      default: throw new Error(`unsupported ${change.noun}, ${change.verb}`);
    }
    return 'div.plans input.item';
  }

  changeCommon(collection, change) {
    var plan = this.findPlan(change.parentName, true);
    var item = find(plan[collection], change.name);
    switch (change.verb) {
      case 'add':
        plan[collection].push({name: change.name, finished: false, parentName: change.parentName});
        break;
      case 'finished':
        item.finished = change.state;
        if (item.finished)
          item.started = false;
        break;
      case 'delete':
        plan[collection].splice(plan[collection].indexOf(item), 1);
        break;
      case 'edit':
        item.name = change.newName;
        break;
      case 'start':
        item.started = change.state;
        break;
      default: throw new Error(`unsupported ${change.noun}, ${change.verb}`);
    }
  }

  changeTask(change) {
    this.changeCommon('tasks', change);
    return 'div.plan-details input.item';
  }

  changeReq(change) {
    this.changeCommon('reqs', change);
    return 'div.requirements input.item';
  }

  changeNextup(change) {
    switch (change.verb) {
      case 'add':
        this.icebox.push(change);
        break;
      default: throw new Error(`unsupported ${change.noun}, ${change.verb}`);
    }
    return 'div.nextup input.item';
  }

  /** apply change to this.plans / this.icebox & emit for redraw.
  @returns dom selector of input field to focus after this kind of change */
  processChange(change) {
    if (!change.checkSupported())
      throw new Error("unsupported noun for verb: "+change.render());
    switch (change.noun) {
      case 'plan': return this.changePlan(change);
      case 'task': return this.changeTask(change);
      case 'req': return this.changeReq(change);
      case 'nextup': return this.changeNextup(change);
    }
  }

  /** try applying a change and add to log if successful. return rendering instruction */
  logChange(rawChange, nopush) {
    if (!rawChange.stamp) {
      rawChange.stamp = +new Date;
    }
    if (!rawChange.v) {
      rawChange.v = 0;
    }
    var change = inflateChange(rawChange);
    var focusSel = this.processChange(change);
    this.changeLog.push(change);
    if (!nopush) {
      fs.appendFile(this.logFileName, JSON.stringify(rawChange) + '\n');
    }
    return {focusSel, logString: change.render(), activePlanName: activePlanName(change)};
  }

  /** read from path. wipes what you've got in memory. */
  deserialize(callback) {
    // todo: error detection, UX feedback (loading / finished)
    var rl = readline.createInterface({input: fs.createReadStream(this.logFileName)});
    rl.on('line', line => this.logChange(JSON.parse(line), true));
    rl.on('close', callback);
  }
}

exports.Storage = Storage;
