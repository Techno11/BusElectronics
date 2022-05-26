import {io, Socket} from "socket.io-client";
import Command from "../../models/Command";

const rateLimit = 50; // how many MS to wait between sending requests to avoid spamming
// TODO: use model for payload
type Listener = (payload: any) => any;
type ListenerPool = {[key: string]: Listener};

export default class BusSocket {
  private _socket: Socket;
  private _lastReq: number = 0;

  private _listenerPool: ListenerPool = {};

  constructor(path: string) {
    this._socket = io(path);
  }

  /**
   * Execute a command
   * @param command
   */
  public runCommand(command: Command): Promise<boolean> {
    return new Promise(resolve => {
      if(Date.now() - this._lastReq >  rateLimit) {
        this._socket.on("control-response", json => {
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
   * Add a listener to the status update
   */
  public addListener(key: string, cb: Listener) {
    this._listenerPool[key] = cb;
  }

  /**
   * Remove a listener for the board-update event
   */
  public removeListener(key: string) {
    if(typeof this._listenerPool[key] !== "undefined") {
      delete this._listenerPool[key];
    }
  }

  /**
   * Emit to all listeners
   * @param payload
   * @private
   */
  private _emitAll(payload: any) {
    for(const key in this._listenerPool) {
      this._listenerPool[key](payload);
    }
  }
}