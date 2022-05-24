import {type} from "os";

type Command = ColorCommand | IntensityCommand | OnOffCommand;

type CommandBase = {
  fixture: Fixture
  device: Device
}

type ColorCommand = {
  type: CommandType.Color,
  red: number,
  green: number,
  blue: number
} & CommandBase

type IntensityCommand = {
  type: CommandType.Intensity
  intensity: number
} & CommandBase

type OnOffCommand = {
  type: CommandType.On | CommandType.Off
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
  RELAY8,
}

enum LEDFixtures {
  BedroomPassRear,
  BedroomDriver,
  LED2,
  LED3,
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
  On,
  Off
}

/**
 * Validate if a command received is valid
 * @param data
 */
const validateCommand = (data: Command) => {
  // Ensure device and fixture are numbers
  if(typeof data.device !== "number" || typeof data.fixture !== "number" || typeof data.type !== "number") {
    return false;
  }
  // Check specific types
  if (data.type === CommandType.Color) {
    return (
      typeof data.red === "number" &&
      typeof data.green === "number" &&
      typeof data.blue === "number" &&
      data.red >= 0 && data.red <= 255 &&
      data.green >= 0 && data.green <= 255 &&
      data.blue >= 0 && data.blue <= 255
    )
  } else if (data.type === CommandType.Intensity) {
    return (
      typeof data.intensity === "number" &&
      data.intensity >= 0 && data.intensity <= 255
    )
  } else if (data.type === CommandType.On || data.type === CommandType.Off) {
    return true
  } else {
    return false;
  }
}

/**
 * Create a command string to send to the arduino
 *
 * A command written to the arduino is as follows:
 * {command_type} {device} {fixture} {0 (off) | 1 (on)} {data1 (intensity | red)} {data2 (green)} {data3 (blue)} ...
 *
 * @param command Command to send
 */
const formatCommand = (command: Command): string => {
  // Command string base
  let commandString = `${command.type} ${command.device} ${command.fixture}`;
  if(command.type === CommandType.Intensity) {
    commandString += ` 1 ${command.intensity}`;
  } else if (command.type === CommandType.Color) {
    commandString += ` 1 ${command.red} ${command.green} ${command.blue}`
  } else if (command.type === CommandType.On) {
    commandString += ` 1`;
  } else if (command.type === CommandType.Off) {
    commandString += ` 0`;
  }
  return commandString;
}

export {validateCommand, formatCommand};
export default Command;