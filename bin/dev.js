const app = require('../app');
const http = require('http');

// HTTP running on 80
const httpServer = http.createServer(app).listen(80);

// Re-added just to keep code simple
const port = '80';

// HTTP Logging
httpServer.on('error', onError);

// Error logging
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

    switch(error.code) {
      case 'EACCESS':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
}