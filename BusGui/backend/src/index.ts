import * as http from 'http';
import * as dotenv from 'dotenv';
import path from 'path';
import {Socket, Server as SocketServer} from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import express, { Application, Request, Response, NextFunction } from 'express';
import SerialPort from 'serialport';


// Initiate Logger
const logger = console.log; // ("api:src/index.ts");
// Setup dotenv
dotenv.config({ path: path.join(__dirname, '../.env') });
// Get package.json for version
const packageJson = require('../package.json');

// Check all of our ENV variables
logger('⚠ Checking all .env variables. If the process exits with code 1 before the \'passed\' message, check that all env variables are defined. See example.env for reference.');
if (!process.env.NODE_ENV)             process.exit(1); process.stdout.write('✅ NODE_ENV ')
if (!process.env.PORT)                 process.exit(1); process.stdout.write('✅ PORT ')
if (!process.env.HOST)                 process.exit(1); process.stdout.write('✅ HOST ')


logger('✅ env Check Passed. Starting Bus Backend v' + packageJson.version);


// API Things
export const app: Application = express();
export const mode = (process.env.NODE_ENV || 'development').toUpperCase();
const port = process.env.PORT || 8008;
let host = process.env.HOST || '127.0.0.1';

app.use(express.static(path.resolve(__dirname + '../../../public'), { maxAge: 2628000 })); // One month

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(cors());
app.use(helmet());

app.use("/*", (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.resolve(__dirname + '../../../public/index.html'));
});


// Init API/ HTTP Server (this will serve the webapp as well)
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


// Init Socket
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }
});


// Setup Socket Connector
io.on('connection', async (client: Socket) => {

  client.on('disconnect', () => {
    client.disconnect();
  });

  client.on('drip', () => {
    client.emit('drop');
  });
});


// Serial Port functions
// temp port /dev/ttyS4
const portName = '/dev/ttyS4';

const arduino = new SerialPort(portName, {
        baudRate: 119200,
        autoOpen: false,
    });

// The open event is always emitted
arduino.on('open', function() {
  console.log("✅ Successfully opened tunnel to arduino controller");
})

try {
    arduino.open();
} catch {
    console.log('❌ Failed to connect to arduino!');
}


// Server error handling
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') { throw error; }
  switch (error.code) {
    case 'EACCES':
      logger(`${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger(`${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// On server listening handler
function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr && addr.port}`;
  logger(`⚠ App started and listening on ${bind}`);
}

process.on('SIGTERM', () => {
  logger('❌ Received SIGTERM, api closing...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger('❌ Received SIGINT, api closing...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, p) => {
  logger(`⚠ Unhandled promise rejection thrown: `);
  logger(reason);
  // process.exit(1); // no crashy crashy
});
