// main.js

var electron = require('electron');
var path = require('path');
var url = require('url');

function createWindow() {
  win = new electron.BrowserWindow;
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));
}

electron.app.on('ready', createWindow);
