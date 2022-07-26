import BusInfo from "./BusInfo";
import Command from "./Command";

type SocketMessage = SocketMessageArduino | SocketMessageHeartbeat | SocketError | SocketMessageCommand | SocketMessageDebug

export type SocketMessageHeartbeat = {
  type: "healthy" | "unhealthy",
  software_healthy: boolean,
  serial_healthy: boolean,
  last_heartbeat: Date | null,
}

type SocketMessageDebug = {
  type: "debug",
  data: string,
}

type SocketMessageArduino = {
  type: "info",
  data: BusInfo
}

type SocketMessageCommand = {
  type: "command",
  command: Command
}

type SocketError = {
  type: "socket",
  connected: boolean
}

export default SocketMessage;
