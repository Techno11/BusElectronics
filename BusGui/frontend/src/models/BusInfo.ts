type BusInfo = {
  water_percent: number, // percent
  propane_0: number, // psi
  propane_1: number, // psi
  shore_water_pressure: number, // psi
  water_pump_run_state: WaterPumpRunState,
  water_flow: number, // gpm
  current: number,
  digital_inputs: number[],
  relays: boolean[],
  dimmers: number[]
}

enum WaterPumpRunState {
  AUTO,
  MANUAL
}

export {
  WaterPumpRunState
}

export default BusInfo;