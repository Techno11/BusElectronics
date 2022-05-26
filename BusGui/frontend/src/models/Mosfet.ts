type Mosfet = {
  i: number,
  on: boolean
}

const getNew = (): Mosfet => {
  return {
    i: 0,
    on: false,
  }
}

export {getNew}
export default Mosfet;