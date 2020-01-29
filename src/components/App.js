import React, { useState, useEffect, Fragment } from 'react';
import { ipcRenderer } from 'electron';
import Log from '@components/Log';

import '~/app.scss';

const App = () => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);

  // Global deftools listener
  useEffect(() => {
    ipcRenderer.on('deftools', (event, type, payload) => {
      if ( process.env.ENV === 'development' ) {
        console.log('deftools', type, payload);
      }

      switch(type) {
        case 'open-settings':
          alert('Besok dibikin');
          break;
        default:
      }
    } );

    return () => {
      ipcRenderer.removeAllListeners('deftools');
    }
  }, []) // listen to some vars


  // deftlog listener, for now just add it here
  useEffect(() => {
    ipcRenderer.on('deftlog', (event, type, payload) => {
      if ( process.env.ENV === 'development' ) {
        console.log('deftlog', type, payload);
      }

      switch(type) {
        case 'message':
          setLogs(prevState => [...prevState, payload]);
          window.scrollTo( 0,document.body.scrollHeight );
          break;
        case 'clear':
          setLogs([]);
          break;
        default:
          setStatus(type);
          if ( process.env.ENV === 'development' ) {
            console.log(type + ':', payload);
          }
      }
    } );

    return () => {
      ipcRenderer.removeAllListeners('deftlog');
    }
  }, []) // listen to some vars

	return (
    <Fragment>
      <div className="logs">
        { logs.length ? logs.map((log, key) => <Log key={key} collapsed={logs.length > 1 && key < logs.length - 1} log={ log } />) : null }
      </div>
      <div id="connection-status">{ logs.length ? status : 'waiting..' }</div>
    </Fragment>
	)
}
export default App;
