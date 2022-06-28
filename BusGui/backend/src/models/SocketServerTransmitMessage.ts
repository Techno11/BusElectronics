import BusInfo from "./BusInfo";

type SocketServerHealthMessage = {
  type: "healthy" | "unhealthy",
  software_healthy: boolean,
  serial_healthy: boolean,
  last_heartbeat: Date | null,
}

type SocketServerInfoMessage = {
  type: "info",
  data: BusInfo,
}

type SocketServerTransmitMessage = SocketServerHealthMessage | SocketServerInfoMessage;

export {
  SocketServerHealthMessage,
  SocketServerInfoMessage
}
export default SocketServerTransmitMessage;