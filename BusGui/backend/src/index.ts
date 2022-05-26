import * as dotenv from 'dotenv';
import path from 'path';
import Arduino from "./Arduino";
import ExpressSocketServer from "./ExpressSocketServer";
import {Socket} from "socket.io";

// Setup dotenv
dotenv.config({path: path.join(__dirname, '../.env')});
// Get package.json for version
const packageJson = require('../package.json');

// Check all of our ENV variables
console.log('⚠ Checking all .env variables. If the process exits with code 1 before the \'passed\' message, check that all env variables are defined. See example.env for reference.');
if (!process.env.NODE_ENV) process.exit(1);
process.stdout.write('✅ NODE_ENV ')
if (!process.env.PORT) process.exit(1);
process.stdout.write('✅ PORT ')
if (!process.env.HOST) process.exit(1);
process.stdout.write('✅ HOST ')
if (!process.env.SERIAL_PORT) process.exit(1);
process.stdout.write('✅ SERIAL_PORT ')
if (!process.env.SERIAL_BAUD) process.exit(1);
process.stdout.write('✅ SERIAL_BAUD ')
if (!process.env.EXPECT_HEARTBEAT_EVERY_SECONDS) process.exit(1);
process.stdout.write('✅ EXPECT_HEARTBEAT_EVERY_SECONDS ')


console.log('✅ env Check Passed. Starting Bus Backend v' + packageJson.version);

const arduino = new Arduino();
const io = new ExpressSocketServer().getIO();


// Setup Socket Connector
io.on('connection', async (client: Socket) => {

  client.on('disconnect', () => {
    client.disconnect();
  });

  client.on('drip', () => {
    client.emit('drop');
  });

  client.on('control', (command) => {
    if(typeof command === "string") command = JSON.parse(command);
    const resp = arduino.sendCommand(command);
    client.emit("control-response", {success: resp})
    // Emit to rest of server that there has been an update
    // TODO: Maybe??
    // client.broadcast.emit("command-executed", command);
  })
});

// Emit all Arduino updates to socket
arduino.registerListener("main-listener", (data) => {
  io.emit("arduino-update", data);
})


process.on('SIGTERM', () => {
  console.log('❌ Received SIGTERM, api closing...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('❌ Received SIGINT, api closing...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, p) => {
  console.log(`⚠ Unhandled promise rejection thrown: `);
  console.log(reason);
});
