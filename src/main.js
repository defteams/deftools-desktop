'use strict'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import JSONStream from 'pixl-json-stream';

import server from './utils/tcp-server';

const isDev = process.env.ENV === 'development';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
var mainWindow;

/**
 * Listen socket connection
 *
 * @type {Array}
 */
const listenSocket = () => {
  let sockets = [];
  server.on('connection', function(socket) {

      mainWindow.webContents.send('deftlog', 'connected', socket);

      sockets.push(socket);
      // new connection, attach JSON stream handler
      const stream = new JSONStream(socket);
      stream.on('json', function(object) {

        mainWindow.webContents.send('deftlog', 'message', object);

        if ( isDev ) {
          console.log('____________________________________________________________');
          console.log('# ' + object.channel + ' | ' + object.level_name + ' | ' + object.datetime);
          console.log('------------------------------------------------------------');
          console.log('Message: ' + object.message);
          console.log('Data: ');
          console.log(JSON.stringify(object.context, null, 2));
        }
      } );

      // Add a 'close' event handler to this instance of socket
      socket.on('close', function(data) {
          let index = sockets.findIndex(function(o) {
              return o.remoteAddress === socket.remoteAddress && o.remotePort === socket.remotePort;
          })
          if (index !== -1) sockets.splice(index, 1);

          mainWindow.webContents.send('deftlog', 'closed', socket);

          if ( isDev ) {
            console.log('CLOSED: ' + socket.remoteAddress + ' ' + socket.remotePort);
          }
      });

      socket.on('error', function(data) {
          mainWindow.webContents.send('deftlog', 'error', data);

          if ( isDev ) {
            console.log('ERROR: ' + data);
          }
      });

      socket.on('uncaughtException', function(data) {
          mainWindow.webContents.send('deftlog', 'uncaught-exception', data);

          if ( isDev ) {
            console.log('uncaughtException: ' + data);
          }
      });
  });
}

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    title: 'Deftools',
    webPreferences: {
      nodeIntegration: true,
    }
  });

  mainWindow.loadURL(
    isDev
      ? `http://localhost:${process.env.DEV_SERVER_PORT}`
      : `file://${path.join(__dirname, 'index.html')}`,
  )

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.focus()
    setImmediate(() => {
      mainWindow.focus()
    })
  });

  mainWindow.webContents.on('did-finish-load', () => {
    listenSocket();
  });

  return mainWindow;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();

  if (isDev) {
    const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));

    installExtension(REDUX_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
  }
})
