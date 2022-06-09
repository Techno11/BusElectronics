import Config from "./models/Config";
import path from "path";
import getAppDataPath from "appdata-path";
import fs from "fs";

/**
 * This class initializes a connection to our main bus arduino.
 * The connection expects to receive a heartbeat from the arduino at a configured interval
 */
export default class ConfigManager {

  private configuration: Config
  private configDir: string = getAppDataPath("busgui");
  private configFile: string = path.resolve(this.configDir, 'config.json');

  constructor() {
    // Ensure config directory exists
    if(!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, {recursive: true});
    }

    // Track if we need to update the file
    let updateFile = true;
    let loadSuccess = false;

    // Check if config file exists
    if(fs.existsSync(this.configFile)) {
      // Load config
      const cfg = fs.readFileSync(this.configFile);
      const str = cfg.toString();
      if(str.length > 0) {
        try {
          this.configuration = JSON.parse(cfg.toString());
          updateFile = false;
          loadSuccess = true;
        } catch (e) {}
      }
    }
    // @ts-ignore
    if (!loadSuccess || !this.configuration){
      this.configuration = {
        arduino_data_serialport: process.env.DATA_SERIALPORT || "",
        arduino_update_serialport: process.env.UPDATE_SERIALPORT || "",
        arduino_data_baud: parseInt(process.env.DATA_BAUD ?? "115200") || 115200,
      }
    }

    // Check configuration integrity and load defaults
    if (!this.configuration.arduino_update_serialport) {
      this.configuration.arduino_update_serialport = process.env.UPDATE_SERIALPORT || "";
      updateFile = true;
    }

    if (!this.configuration.arduino_data_serialport) {
      this.configuration.arduino_data_serialport = process.env.DATA_SERIALPORT || "";
      updateFile = true;
    }

    if (!this.configuration.arduino_data_baud) {
      this.configuration.arduino_data_baud = parseInt(process.env.DATA_BAUD ?? "115200") || 115200;
      updateFile = true;
    }

    // Write config to file
    if(updateFile) {
      fs.writeFile(this.configFile, JSON.stringify(this.configuration), () => {
        console.log(`✅ Created config file at '${this.configFile}'`)
      });
    } else {
      console.log(`✅ Loaded config file from '${this.configFile}'`)
    }
  }

  public getConfig(): Config {
    return {...this.configuration};
  }

  public updateConfig(key: keyof Config, prop: string | number) {
    if(typeof prop === "number" && key === "arduino_data_baud") {
      this.configuration[key] = prop;
    } else if (typeof prop === "string" && (key === "arduino_data_serialport" || key === "arduino_update_serialport")) {
      this.configuration[key] = prop;
    }

    // Asycronously update config file
    fs.writeFile(this.configFile, JSON.stringify(this.configuration), () => {});
  }

}