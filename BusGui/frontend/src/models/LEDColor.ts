type LEDColor = {
  r: number,
  g: number,
  b: number,
  a: number,
  on: boolean
}

const getNew = (): LEDColor => {
  return {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
    on: false,
  }
}

const getRGBA = (color: LEDColor) => {
  return color.on ? `rgba(${color.r},${color.g},${color.b},${color.a})` : `rgba(0, 0, 0, 0)`;
}

export {getNew, getRGBA}
export default LEDColor;