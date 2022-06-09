type Config = {
  arduino_data_serialport: string,
  arduino_data_baud: number,
  arduino_update_serialport: string,
}

export type PortInfo = {
  path: string;
  manufacturer?: string | undefined;
  serialNumber?: string | undefined;
  pnpId?: string | undefined;
  locationId?: string | undefined;
  productId?: string | undefined;
  vendorId?: string | undefined;
}

export type SocketConfigResponse = {
  serial: PortInfo[],
  config: Config,
  version: string,
}

export default Config