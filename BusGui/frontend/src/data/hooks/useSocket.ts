import { SocketContext } from "../providers/SocketProvider";
import { useContext } from "react";

export const useBus = () => {
  return useContext(SocketContext);
};