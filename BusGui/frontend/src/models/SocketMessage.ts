import BusInfo from "./BusInfo";

type SocketMessage = SocketMessageArduino | SocketMessageHeartbeat

type SocketMessageHeartbeat = {
  type: "healthy" | "unhealthy"
  last_heartbeat: string
}

type SocketMessageArduino = {
  type: "info",
  data: BusInfo
}

export default SocketMessage;