# moot

Moot is a micro-outlining tool. Micro-outlining means keeping a constant shorthand plan for what you're doing in order to:

* survive interruptions / resume work after a break by looking at the log of what you just finished
* reduce the penalty of task-switching
* communicate effectively about estimates & status

The UX is written in electron

## starting the UX

To use, check out the repo, run `npm install && npm start`, and get mooting.

## screenshot

(todo)

## privacy policy & contributor agreement

* The moot application code won't do any remote-machine RPC except as clearly marked in settings, and then not by default.
* The moot application won't initiate any phone-home RPC, i.e. RPC to author-controlled storage, without express user permission for each instance.
* Node, third-party libraries, or the electron libraries may not comply with these terms. 'moot application' only refers to the js files in this repo. Actions initiated by third-party code e.g. that may be bundled with node, npm or pulled by npm install are not covered by this policy.
* The moot application won't scan your drive -- it will only do explicit IO on files below its root directory. Other bundled components, such as node / electron / webkit, may crawl your drive on their own.
* Contributors agree not to add RPC, disk IO, or phone-home features without conforming to these terms
* These terms are subject to change at any time but each release will comply with its bundled terms
* These terms will only apply to release-tagged commits from the master branch
* If the moot contributors breach these terms, users are not entitled to any damages, but the moot team will (a) announce the violation on moot message boards (if any), and (b) modify the codebase or these terms so the application is in compliance.
* Moot keeps deleted data in its log and in stock configuration will never delete anything even if it appears gone from the user interface. If you need your data deleted, delete the log.json file yourself.

## missing features

* cross-device sync / backup
* sharing
* timestamps on log messages
* mobile
* look at what's in the icebox
* clean up old plans, full delete
