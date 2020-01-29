import React, { useState, useEffect, Fragment } from 'react';
import ReactJson from 'react-json-view';

const Log = ({log, collapsed}) => {
  return (
    <div className="log">
      <div>
        # {log.channel} | {log.level_name} | {log.datetime}
      </div>
      <ReactJson
        name={log.message}
        src={log.context}
        collapsed={collapsed || 1}
        theme="mocha"
        iconStyle="circle"
      />
      <hr />
    </div>
  )
}
export default Log;
