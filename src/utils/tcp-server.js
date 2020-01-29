import * as net from 'net';

const port = process.env.TCP_SERVER_PORT;
const host = '127.0.0.1';

const server = net.createServer();
server.listen(port, host, () => {
  if ( process.env.ENV === 'development' ) {
    console.log('_______________________________________________');
    console.log('# TCP Server is running on port ' + port + '. #');
    console.log('-----------------------------------------------');
  }
});

export default server;
