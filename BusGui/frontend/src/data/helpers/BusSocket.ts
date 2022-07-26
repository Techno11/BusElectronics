import {io, Socket} from "socket.io-client";
import Command from "../../models/Command";
import SocketMessage, {SocketMessageHeartbeat} from "../../models/SocketMessage";
import Config, {SocketConfigResponse} from "../../models/Config";

const rateLimit = 50; // how many MS to wait between sending requests to avoid spamming
type Listener = (payload: SocketMessage) => any;
type ListenerPool = { [key: string]: Listener };

export default class BusSocket {
  private _path: string;
  private _socket: Socket;
  private _lastReq: number = 0;

  private _listenerPool: ListenerPool = {};

  constructor(path: string) {
    this._path = path;
    // Setup socket
    this._socket = io(path, {autoConnect: false});
    // Setup events
    this._socket.on("arduino-update", d => this._emitAll(d));
    this._socket.on("command-executed", d => this._emitAll({type: "command", command: d}));
    this._socket.on("connect", () => this._emitAll({type: "socket", connected: true}));
    this._socket.on("disconnect", () => this._emitAll({type: "socket", connected: false}));
    this._socket.on("error", () => this._emitAll({type: "socket", connected: false}));
    this._socket.on("reconnect", () => this._emitAll({type: "socket", connected: true}));
    // Connect socket
    this._socket.connect();
  }

  /**
   * Get if socket is connected
   */
  public isConnected(): boolean {
    return this._socket.connected;
  }

  /**
   * Execute a command
   * @param command
   */
  public runCommand(command: Command): Promise<boolean> {
    return new Promise(resolve => {
      if (Date.now() - this._lastReq > rateLimit) {
        this._socket.once("control-response", json => {
          resolve(json.success)
        })
        this._socket.emit("control", command);
        this._lastReq = Date.now();
      } else {
        resolve(false);
      }
    })
  }

  /**
   * Get config
   */
  public getConfig(): Promise<SocketConfigResponse | false> {
    return new Promise(resolve => {
      this._socket.once("get-config-response", json => {
        if (!json.success) resolve(false);
        else resolve(json);
      })
      this._socket.emit("get-config");
    })
  }

  /**
   * Get Debug Status
   */
  public getDebugEnabled(): Promise<boolean> {
    return new Promise(resolve => {
      this._socket.once("debug-status-response", json => {
        resolve(json.status);
      });
      this._socket.emit("debug-status");
    });
  }

  /**
   * Get status
   */
  public getStatus(): Promise<SocketMessageHeartbeat> {
    return new Promise(resolve => {
      this._socket.once("get-status-response", json => {
        resolve({
          type: "healthy",
          serial_healthy: json.serial_healthy,
          software_healthy: json.software_healthy,
          last_heartbeat: new Date(json.last_heartbeat)
        })
      });
      this._socket.emit("get-status");
    })
  }

  /**
   * Update config
   */
  public updateConfig(key: keyof Config, val: any): Promise<boolean> {
    return new Promise(resolve => {
      this._socket.once("update-config-response", json => {
        resolve(json.success);
      })
      this._socket.emit("update-config", {key, val});
    })
  }

  /**
   * Perform an arduino update
   * @param file HEX file to send to arduino
   * @param onUploadComplete optional callback for when file is done uploading
   */
  public doUpdate(file: File, onUploadComplete?: () => any): Promise<boolean> {
    return new Promise(resolve => {
      this._socket.once("update-arduino-response", json => {
        console.log(json)
        resolve(json.success);
      });
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      // Upload file
      fetch(document.location.protocol + "//" + this._path + "/api/arduino/update", {method: "POST", body: formData})
        .then(() => {
          if(typeof onUploadComplete === "function") onUploadComplete();
        })
        .catch(() => {
          // de-register listener
          this._socket.off("update-arduino-response");
          // resolve failure
          resolve(false)
        });
    })
  }

  /**
   * Start debug session
   */
  public toggleDebug(start: boolean): Promise<boolean> {
    const str = start ? "start-debug" : "end-debug";
    return new Promise(resolve => {
      this._socket.once(str + "-response", json => {
        resolve(json.success);
      });
      this._socket.emit(str);
    });
  }

  /**
   * Send signal to kill API (and technically systemd will restart it, hopefully)
   */
  public restartServer(): Promise<boolean> {
    return new Promise(resolve => {
      // Register a listener for ourself on the reconnect event
      this._socket.once("connect", () => resolve(true));
      this._socket.emit("restart");
    })
  }

  /**
   * Add a listener to the status update
   */
  public addListener(key: string, cb: Listener) {
    this._listenerPool[key] = cb;
  }

  /**
   * Remove a listener for the board-update event
   */
  public removeListener(key: string) {
    if (typeof this._listenerPool[key] !== "undefined") {
      delete this._listenerPool[key];
    }
  }

  /**
   * Emit to all listeners
   * @param payload
   * @private
   */
  private _emitAll(payload: SocketMessage) {
    for (const key in this._listenerPool) {
      this._listenerPool[key](payload);
    }
  }
}
