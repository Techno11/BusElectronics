import LEDColor from "./LEDColor";
import Mosfet from "./Mosfet";
import Relay, {RelayControlType} from "./Relay";

type Command = ColorCommand | IntensityCommand | RelayCommand;

type CommandBase = {
  fixture: Fixture
  device: Device
  on: boolean
}

type ColorCommand = {
  type: CommandType.Color,
  red: number,
  green: number,
  blue: number,
  alpha: number,
} & CommandBase

type IntensityCommand = {
  type: CommandType.Intensity
  intensity: number
} & CommandBase

type RelayCommand = {
  type: CommandType.Relay
  state: RelayControlType
} & CommandBase

type Fixture = MosfetFixtures | RelayFixtures | LEDFixtures | DigitalFixtures | AnalogFixtures;

enum MosfetFixtures {
  MOSFET0,
  MOSFET1,
  MOSFET2,
  MOSFET3,
  ShowerLight,
  ClosetLight,
  EntryLight,
  FrontAisle,
  ShoeBox,
  RearAisle,
}

enum RelayFixtures {
  WaterPump,
  PropaneValve,
  RELAY2,
  RELAY3,
  RELAY4,
  RELAY5,
  RELAY6,
  RELAY7,
}

enum LEDFixtures {
  BedroomPassenger,
  BedroomDriver,
  LED2,
  LED3,
  BedroomRear
}

enum DigitalFixtures {
  ShowerButton,
  ClosetDoor,
  EmergencyWindowDriver,
  EmergencyWindowPassenger,
  DIO4,
  DIO5,
  DIO6,
  DIO7
}

enum AnalogFixtures {
  WaterTank
}

enum Device {
  MOSFET,
  RELAY,
  LED,
  DIGITAL,
  ANALOG
}

enum CommandType {
  Intensity,
  Color,
  Relay,
}

const getName = (device: Device, fixture: Fixture) => {
  switch(device) {
    case Device.MOSFET:
      switch(fixture){
        case MosfetFixtures.FrontAisle: return "Front Aisle";
        case MosfetFixtures.RearAisle: return "Rear Aisle";
        case MosfetFixtures.ShowerLight: return "Shower";
        case MosfetFixtures.ClosetLight: return "Closet";
        case MosfetFixtures.ShoeBox: return "Shoes";
        case MosfetFixtures.EntryLight: return "Entry";
        case MosfetFixtures.MOSFET0: return "Mosfet 0";
        case MosfetFixtures.MOSFET1: return "Mosfet 1";
        case MosfetFixtures.MOSFET2: return "Mosfet 2";
        case MosfetFixtures.MOSFET3: return "Mosfet 3";
      }
      break;
    case Device.LED:
      switch(fixture){
        case LEDFixtures.BedroomDriver: return "Bedroom Front Driver"
        case LEDFixtures.BedroomPassenger: return "Bedroom Front Passenger"
        case LEDFixtures.BedroomRear: return "Bedroom Rear"
        case LEDFixtures.LED2: return "LED 2"
        case LEDFixtures.LED3: return "LED 3"
      }
      break;
    case Device.ANALOG:
      switch(fixture){
        case AnalogFixtures.WaterTank: return "Freshwater Tank Level"
      }
      break;
    case Device.RELAY:
      switch(fixture){
        case RelayFixtures.WaterPump: return "Freshwater Pump"
        case RelayFixtures.PropaneValve: return "Propane Shutoff"
        case RelayFixtures.RELAY2: return "Relay 2"
        case RelayFixtures.RELAY3: return "Relay 3"
        case RelayFixtures.RELAY4: return "Relay 4"
        case RelayFixtures.RELAY5: return "Relay 5"
        case RelayFixtures.RELAY6: return "Relay 6"
        case RelayFixtures.RELAY7: return "Relay 7"
      }
      break;
    case Device.DIGITAL:
      switch(fixture){
        case DigitalFixtures.ShowerButton: return "Freshwater Pump"
        case DigitalFixtures.ClosetDoor: return "Freshwater Pump"
        case DigitalFixtures.EmergencyWindowDriver: return "Freshwater Pump"
        case DigitalFixtures.EmergencyWindowPassenger: return "Freshwater Pump"
        case DigitalFixtures.DIO4: return "Digital 4"
        case DigitalFixtures.DIO5: return "Digital 5"
        case DigitalFixtures.DIO6: return "Digital 6"
        case DigitalFixtures.DIO7: return "Digital 7"
      }
      break;
  }
  return `Unknown Device: ${device}:${fixture}`;
}

const makeLedCommand = (device: Device, fixture: Fixture, state: LEDColor): Command => {
  return {
    type: CommandType.Color,
    device,
    fixture,
    on: state.on,
    red: Math.ceil(state.r * state.a),
    green: Math.ceil(state.g * state.a),
    blue: Math.ceil(state.b * state.a),
    alpha: state.a, // for reproduction on other screens
  }
}

const makeMosfetCommand = (device: Device, fixture: Fixture, state: Mosfet): Command => {
  return {
    type: CommandType.Intensity,
    device,
    fixture,
    on: state.on,
    intensity: Math.ceil(state.i * 255)
  }
}

const makeRelayCommand = (fixture: Fixture, state: Relay): Command => {
  return {
    type: CommandType.Relay,
    device: Device.RELAY,
    fixture,
    state: state.state,
    on: state.on
  }
}

export {
  CommandType,
  Device,
  AnalogFixtures,
  DigitalFixtures,
  RelayFixtures,
  LEDFixtures,
  MosfetFixtures,
  makeLedCommand,
  makeMosfetCommand,
  makeRelayCommand,
  getName,
}
export default Command;