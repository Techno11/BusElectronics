import React from "react";
import { createContext, ReactChild } from "react";
import BusSocket from "../helpers/BusSocket";

const ws = new BusSocket(window.location.hostname + ":8008");

export const SocketContext = createContext(ws);

interface ISocketProvider {
  children: ReactChild;
}

export const SocketProvider = (props: ISocketProvider) => (
  <SocketContext.Provider value={ws}>{props.children}</SocketContext.Provider>
);