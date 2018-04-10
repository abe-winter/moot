// storage.js -- log-based storage system

var readline = require('readline');
var fs = require('fs');

class AddVerb {
  constructor(noun, name, parentName) {
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
  constructor(noun, name, state, parentName) {
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

class DeleteVerb {
  constructor(noun, name, parentName) {
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
  constructor(noun, oldName, newName, newDetails, parentName) {
    this.noun = noun;
    this.oldName = oldName;
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
    return `edit ${this.noun}.${this.oldName} -> ${this.newName}, details ${this.newDetails}`;
  }
}

function inflateChange(rawChange) {
  switch (rawChange.verb) {
  case 'add':
    return new AddVerb(rawChange.noun, rawChange.name, rawChange.parentName);
  case 'finished':
    return new FinishedVerb(rawChange.noun, rawChange.name, rawChange.state, rawChange.parentName);
  case 'delete':
    return new DeleteVerb(rawChange.noun, rawChange.name, rawChange.parentName);
  case 'edit':
    return new EditVerb(rawChange.noun, rawChange.oldName, rawChange.newName, rawChange.newDetails, rawChange.parentName);
  default:
    throw new Error("data from newer version? unk type "+change.type);
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
          throw new Error(`plan ${change.name} already exists`)
        this.plans.push(new Plan(change.name));
        break;
      // case 'finished':
      // case 'delete':
      default: throw new Error(`unsupported ${change.noun}, ${change.verb}`);
    }
    return 'div.plans input.item';
  }

  changeTask(change) {
    var plan = this.findPlan(change.parentName, true);
    switch (change.verb) {
      case 'add':
        plan.tasks.push({name: change.name, finished: false});
        break;
      // case 'finished':
      // case 'delete':
      default: throw new Error(`unsupported ${change.noun}, ${change.verb}`);
    }
    return 'div.plan-details input.item';
  }

  changeReq(change) {
    var plan = this.findPlan(change.parentName, true);
    switch (change.verb) {
      case 'add':
        plan.reqs.push({name: change.name, finished: false});
        break;
      // case 'finished':
      // case 'delete':
      default: throw new Error(`unsupported ${change.noun}, ${change.verb}`);
    }
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
    rl.on('line', line => {
      console.log('line', line);
      this.logChange(JSON.parse(line), true);
    });
    rl.on('close', callback);
  }
}

exports.Storage = Storage;
