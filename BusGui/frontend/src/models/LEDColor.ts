type LEDColor = {
  r: number,
  g: number,
  b: number,
  a: number
}

const getNew = (): LEDColor => {
  return {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  }
}

const getRGBA = (color: LEDColor) => {
  return `rgba(${color.r},${color.g},${color.b},${color.a})`
}

export {getNew, getRGBA}
export default LEDColor;