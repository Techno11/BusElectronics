import SerialPort from "serialport";
import Command, {formatCommand, validateCommand} from "./models/Command";
import SocketServerTransmitMessage, {SocketServerInfoMessage} from "./models/SocketServerTransmitMessage";
import ConfigManager from "./ConfigManager";

const heartbeatExpected = 10;

type Listener = (payload: SocketServerTransmitMessage) => any;
type ListenerPool = {[key: string]: Listener};
/**
 * This class initializes a connection to our main bus arduino.
 */
export default class Arduino {

  // Arduino Connection Info
  private serial: SerialPort;
  private port: string;
  private baud: number;

  // Serial "Buffer"
  private buffer: Buffer = Buffer.from("");

  // Heartbeat information
  private heartbeatTimeout: NodeJS.Timeout | undefined;
  private healthy: boolean = false;
  private lastHeartbeat: Date | null = null;

  // Listener information
  private listeners: ListenerPool = {};

  constructor(config: ConfigManager) {
    // Initialize connection info
    this.port = config.getConfig().arduino_data_serialport;
    this.baud = config.getConfig().arduino_data_baud;

    // Setup serial
    this.serial = new SerialPort(this.port, {
      baudRate: this.baud,
      autoOpen: false,
    });

    // Finish setup
    this.setupSerial();
  }

  /**
   * Restart the serial connection with potentially new parameters
   * @param config Config to use
   */
  public restart(config: ConfigManager) {
    // Close current connection (if open)
    this.closeConnection();

    // Open new connection
    this.port = config.getConfig().arduino_data_serialport;
    this.baud = config.getConfig().arduino_data_baud;

    // Setup serial
    this.serial = new SerialPort(this.port, {
      baudRate: this.baud,
      autoOpen: false,
    });

    // Finish setup
    this.setupSerial();
  }

  /**
   * Close current serial connection
   * @private
   */
  private closeConnection() {
    // Close current connection
    if(this.serial && this.serial.isOpen) this.serial.close();

    // Clear heartbeat timeout
    clearTimeout(this.heartbeatTimeout);
  }

  /**
   * Finish setting up the serial connection
   * @private
   */
  private setupSerial() {
    // Setup Connection Event
    this.serial.on('open', () => {
      console.log(`✅ Successfully arduino controller on '${this.port}' at ${this.baud} baud`);
    })

    // Try Connecting
    try {
      this.serial.open();
    } catch {
      console.log(`❌ Failed to connect to arduino controller on '${this.port}' at ${this.baud} baud`);
    }

    // Setup initial heartbeat timeout
    this.heartbeatTimeout = setTimeout(() => this.unhealthy(), heartbeatExpected * 1000);

    // Setup Serial listener
    this.serial.on("data", d => this.onData(d))

    // Setup Serial closed listener
    this.serial.on("close", () => this.unhealthy())
  }

  /**
   * Get if the arduino connection is healthy
   */
  public isHealthy(): boolean {
    return this.healthy && this.serial.isOpen;
  }

  /**
   * Get date of the last heartbeat
   */
  public getLastHeartbeat(): Date | null {
    return this.lastHeartbeat;
  }

  /**
   * Register a listener
   * @param name name of listener
   * @param callback callback function to register
   */
  public registerListener(name: string, callback: Listener) {
    this.listeners[name] = callback;
  }

  /**
   * Remove a listener
   * @param name name to remove
   */
  public removeListener(name: string) {
    if(typeof this.listeners[name] !== "undefined") delete this.listeners[name];
  }

  /**
   * Called when data is received on the serial line
   * @param data
   * @private
   */
  private onData(data: Buffer) {
    // If we get a newline (\n)
    if(data.indexOf(0x0d) > -1) {
      this.buffer = Buffer.concat([this.buffer, data]);
      this.dataDone();
    } else {
      this.buffer = Buffer.concat([this.buffer, data]);
    }
  }

  /**
   * Called when the \n character is recieved, marking end of a message
   * @private
   */
  private dataDone() {
    try {
      // Messages from arduino are sent in json
      const parsed = JSON.parse(this.buffer.toString('utf8').trim());
      // Reset Buffer
      this.buffer = Buffer.from("");
      // Handle heartbeat
      this.handleHeartbeat();
      // Create message
      const msg: SocketServerInfoMessage = {type: "info", data: parsed};
      // Emit to our listeners
      this.emitToListeners(msg);
    } catch (err) {
      // Print invalid message
      console.log(`Invalid message from arduino: \n"${this.buffer.toString('utf8')}"`, err);
      // Reset Buffer
      this.buffer = Buffer.from("");
    }
  }

  /**
   * Send a command to be executed
   * @param command
   */
  public sendCommand(command: Command): boolean {
    if(!validateCommand(command)) return false;
    this.serial.write(formatCommand(command));
    return true;
  }

  /**
   * If we receive a message from the arduino, we treat it as a heartbeat
   * @private
   */
  private handleHeartbeat() {
    // Reset Timeout
    clearTimeout(this.heartbeatTimeout);
    this.heartbeatTimeout = setTimeout(() => this.unhealthy(), heartbeatExpected * 1000);
    // Update last heartbeat date
    this.lastHeartbeat = new Date();
    // If we are recovering from being unhealthy, emit that we're healthy again
    if(!this.healthy) {
      this.healthy = true;
      this.emitToListeners({type: "healthy", last_heartbeat: this.lastHeartbeat})
    }
  }

  /**
   * Emit to all listening clients
   * @param data Data to emit
   * @private
   */
  private emitToListeners(data: SocketServerTransmitMessage) {
    for (const key in this.listeners) {
      try{
        this.listeners[key](data);
      } catch {
        // Failed to emit, but we just don't want it to stop everything
      }
    }
  }

  /**
   * Mark arduino as unhealthy
   */
  private unhealthy() {
    if(this.healthy) {
      this.healthy = false;
      this.emitToListeners({type: "unhealthy", last_heartbeat: this.lastHeartbeat})
    }
  }
}
