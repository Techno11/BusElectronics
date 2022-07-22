import * as dotenv from 'dotenv';
import path from 'path';
import Arduino, {ConnectionType} from "./Arduino";
import ExpressSocketServer from "./ExpressSocketServer";
import {Socket} from "socket.io";
import ConfigManager from "./ConfigManager";
import serialport from "serialport";
import Config from "./models/Config";
import fs from "fs";

const Avrgirl = require('avrgirl-arduino');

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

console.log('✅ env Check Passed. Starting Bus Backend v' + packageJson.version);

const config = new ConfigManager();
const arduino = new Arduino(config, ConnectionType.data);
const arduinoDebug = new Arduino(config, ConnectionType.debug);
const io = new ExpressSocketServer().getIO();

const startDebug = (): boolean => {
  if(!arduinoDebug.isSerialHealthy()) {
    arduinoDebug.restart(config, ConnectionType.debug)
  }
  return true;
};

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
    if(resp) client.broadcast.emit("command-executed", command);
  });

  client.on('get-config', () => {
    serialport.list().then(r => {
      client.emit("get-config-response", {success: true, serial: r, config: config.getConfig(), version: packageJson.version})
    }).catch(() => {
      client.emit("get-config-response", {success: false})
    })
  });

  client.on('get-status', () => {
    client.emit(
      "get-status-response",
      {
        success: true,
        serial_healthy: arduino.isSerialHealthy(),
        software_healthy: arduino.isSoftwareHealthy(),
        last_heartbeat: arduino.getLastHeartbeat()
      }
    )
  });

  client.on('start-debug', () => {
    if(!arduinoDebug) {
      client.emit('start-debug-response', {success: startDebug()});
    }
  });

  client.on('debug-status', () => {
    client.emit('debug-status-response', {success: true, status: arduinoDebug.isSerialHealthy()});
  });

  client.on('restart', () => {
    process.exit(1);
  });

  client.on('update-config', ({key, val}: {key: keyof Config, val: any}) => {
    // Update config
    config.updateConfig(key, val);

    // If we're updating either property for the data arduino connection, restart the arduino connection
    if(key === 'arduino_data_baud' || key === 'arduino_data_serialport')  arduino.restart(config, ConnectionType.data);

    // If we're updating the debug arduino connection (and the connection is open), restart the debug arduino connection
    if(key === 'arduino_update_serialport' && arduinoDebug.isSerialHealthy())  arduinoDebug.restart(config, ConnectionType.debug);

    // Emit that we succeeded
    client.emit('update-config-response', {success: true});
  });
});

// Emit all Arduino updates to socket
arduino.registerListener("main-listener", (data) => {
  io.emit("arduino-update", data);
});

// Listen for an arduino HEX file to be ready to deploy
// @ts-ignore
process.on("arduino-upload-ready", (filePath: string) => {
  const mega = new Avrgirl({
    board: 'mega',
    port: config.getConfig().arduino_update_serialport
  });
  mega.flash(filePath, (error: any) => {
    if(error) {
      console.log("Avrgirl failed:\n", error)
    }
    // Emit success/failure
    io.emit('update-arduino-response', {success: !error});
    // Remove old hex file
    fs.unlink(filePath, () => {});
  })
});


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
