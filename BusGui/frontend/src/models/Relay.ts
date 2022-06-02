type Relay = {
  state: RelayControlType
  on: boolean
}

enum RelayControlType {
  Auto,
  Manual
}

const getNew = (): Relay => {
  return {
    state: RelayControlType.Auto,
    on: false
  }
}

export {getNew, RelayControlType}
export default Relay;