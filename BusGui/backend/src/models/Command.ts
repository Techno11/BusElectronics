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

type RelayCommand = {
  type: CommandType.Relay
  state: RelayControlType
} & CommandBase

type IntensityCommand = {
  type: CommandType.Intensity
  intensity: number
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

enum RelayControlType {
  Auto,
  Manual
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
  } else if (data.type === CommandType.Relay) {
    return (
      typeof data.state === "number" &&
      data.state >= 0 &&
      data.state <= 1
    )
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
const formatCommand = (command: Command): number[] => {
  // Command string base
  let commandArr = [command.type, command.device, command.fixture, command.on ? 1 : 0];
  if(command.type === CommandType.Intensity) {
    // Nothing can equal 10
    if (Math.floor(command.intensity) === 10) command.intensity = 11;
    commandArr.push(Math.floor(command.intensity));
  } else if (command.type === CommandType.Color) {
    // Nothing can equal 10
    if(Math.floor(command.red) === 10) command.red = 11;
    if(Math.floor(command.green) === 10) command.green = 11;
    if(Math.floor(command.blue) === 10) command.blue = 11;
    commandArr.push(Math.floor(command.red), Math.floor(command.green), Math.floor(command.blue));
  } else if (command.type === CommandType.Relay) {
    commandArr.push(command.state);
  }
  // \n triggers the "go" on the arduino or end-of-command  
  commandArr.push(10); // 10 == \n
  return commandArr;
}

export {validateCommand, formatCommand};
export default Command;