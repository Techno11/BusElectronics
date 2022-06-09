import BusInfo from "./BusInfo";

type SocketMessage = SocketMessageArduino | SocketMessageHeartbeat | SocketError

type SocketMessageHeartbeat = {
  type: "healthy" | "unhealthy"
  last_heartbeat: string
}

type SocketMessageArduino = {
  type: "info",
  data: BusInfo
}

type SocketError = {
  type: "socket",
  connected: boolean
}

export default SocketMessage;