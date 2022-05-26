import SerialPort from "serialport";
import Command, {formatCommand, validateCommand} from "./models/Command";
import SocketServerTransmitMessage, {SocketServerInfoMessage} from "./models/SocketServerTransmitMessage";

const heartbeatExpected = process.env.EXPECT_HEARTBEAT_EVERY_SECONDS ? parseInt(process.env.EXPECT_HEARTBEAT_EVERY_SECONDS) : 10;

type Listener = (payload: SocketServerTransmitMessage) => any;
type ListenerPool = {[key: string]: Listener};
/**
 * This class initializes a connection to our main bus arduino.
 */
class Arduino {

  // Arduino Connection Info
  private serial: SerialPort;
  private port: string;
  private baud: number;

  // Serial "Buffer"
  private buffer: Buffer = Buffer.from("");

  // Heartbeat information
  private heartbeatTimeout: NodeJS.Timeout;
  private healthy: boolean = false;
  private lastHeartbeat: Date | null = null;

  // Listener information
  private listeners: ListenerPool = {};

  constructor() {
    // Initialize connection info
    this.port = process.env.SERIAL_PORT ?? "";
    this.baud = process.env.SERIAL_BAUD ? parseInt(process.env.SERIAL_BAUD) : 9600;

    // Setup serial
    this.serial = new SerialPort(this.port, {
      baudRate: this.baud,
      autoOpen: false,
    });

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
    this.heartbeatTimeout = setTimeout(() => {this.healthy = false}, heartbeatExpected * 1000);

    // Setup Serial listener
    this.serial.on("data", (data) => this.onData(data))
  }

  /**
   * Get if the arduino connection is healthy
   */
  public isHealthy(): boolean {
    return this.healthy;
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
    this.healthy = false;
    this.emitToListeners({type: "unhealthy", last_heartbeat: this.lastHeartbeat})
  }
}

export default Arduino;