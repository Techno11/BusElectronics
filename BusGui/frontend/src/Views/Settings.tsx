import * as React from "react";
import {
  Box,
  Button, CircularProgress,
  Dialog, DialogActions, DialogContent,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import Config, {PortInfo} from "../models/Config";
import {useEffect, useRef, useState} from "preact/hooks";
import {useBus} from "../data/hooks/useSocket";
import BusInfo from "../models/BusInfo";

enum DialogState {
  NONE,
  UPLOADING,
  UPDATING,
  UPDATE_SUCCESS,
  UPDATE_FAILURE,
  RESTARTING,
  RESTART_SUCCESS,
}

interface IProps {
  data: BusInfo
}

const Settings = ({data}: IProps) => {

  // Hooks
  const bus = useBus();

  // State
  const [config, setConfig] = useState<Config>();
  const [availSerial, setAvailSerial] = useState<PortInfo[]>();
  const [version, setVersion] = useState<string>("Unknown");
  const [error, setError] = useState<boolean>(false);
  const [upload, setUpload] = useState<string>("");
  const [dialogState, setDialogState] = useState<DialogState>(DialogState.NONE);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false);
  const [debugBuffer, setDebugBuffer] = useState<string>("");

  // Refs
  const uploadRef = useRef<HTMLInputElement>();
  const debugBufferRef = useRef<string>(debugBuffer);

  useEffect(() => {
    // Get settings
    bus.getConfig().then(data => {
      if (data) {
        setConfig(data.config);
        setVersion(data.version);
        setAvailSerial(data.serial)
      } else {
        setError(true);
      }
    });

    // Check status of debug
    debugStatusCheck();

    // Register listener for debug data
    bus.addListener("settings-page", data => {
      if(data.type === "debug") {
        appendDebugBuffer(data.data);
      }
    });
  }, []); // eslint-disable-line

  // Status check
  const debugStatusCheck = () => {
    // Check status of debug
    bus.getDebugEnabled().then(enabled => {
      setDebugEnabled(enabled);
    });
  };

  const appendDebugBuffer = (n: string) => {
    updateBuffer(debugBufferRef.current + n);
  };

  const clearBuffer = () => {
    updateBuffer("");
    debugStatusCheck();
  };

  const updateBuffer = (val: string) => {
    debugBufferRef.current = val;
    setDebugBuffer(val);
  };

  const runUpload = () => {
    if(!uploadRef.current || !uploadRef.current.files) return;
    if(uploadRef.current.files.length < 1) return;
    setDialogState(DialogState.UPLOADING);
    bus.doUpdate(uploadRef.current.files[0], onUploadComplete).then(success => {
      console.log(success);
      setDialogState(success ? DialogState.UPDATE_SUCCESS : DialogState.UPDATE_FAILURE);
    })
  };

  const onUploadComplete = () => {
    if(dialogState === DialogState.UPLOADING) setDialogState(DialogState.UPDATING);
  };

  const closeUpdateDialog = () => {
    setDialogState(DialogState.NONE);
    setUpload("");
    // Clear upload field
    if(uploadRef.current) uploadRef.current.value = "";
  };

  const doServerRestart = () => {
    setDialogState(DialogState.RESTARTING);
    bus.restartServer().then(() => {
      setDialogState(DialogState.RESTART_SUCCESS);
    });
  };

  const doDebugToggle = () => {
    bus.toggleDebug(!debugEnabled).then(success => {
      if(success) setDebugEnabled(!debugEnabled);
    });
  };

  const doArduinoRestart = () => {
    // heh
  };

  return (
    <>
      {/* Title*/}
      <Box sx={{textAlign: "center"}}>
        <Typography variant={"h4"} sx={{display: "inline"}}>Settings</Typography>
      </Box>

      {/* Loading */}
      {(!config || !availSerial) && !error &&
      <LinearProgress sx={{width: 1}}/>
      }

      {/* Error */}
      {error &&
      <Typography>There was an error fetching the current configuration</Typography>
      }

      {/* Start Settings */}
      {config && availSerial &&
      <Grid container direction={"column"} spacing={1}>

        {/* Serial Data */}
        <Divider sx={{mt: 2}}>Arduino Data Connection</Divider>
        <Grid item sx={{display: "flex"}}>
          <Box sx={{width: 1/2, pr: 1}}>
            <Typography>Serial Port</Typography>
            <Select
              variant={"outlined"}
              defaultValue={config.arduino_data_serialport}
              fullWidth
              onChange={(v) => bus.updateConfig("arduino_data_serialport", v.target.value)}
            >
              {availSerial.map(s =>
                <MenuItem key={s.path} value={s.path}>
                  {s.path}{s.manufacturer ? ` - ${s.manufacturer}` : ''}
                </MenuItem>
              )}
            </Select>
          </Box>

          <Box sx={{width: 1/2, pl: 1}}>
            <Typography>Serial Baud</Typography>
            <Select
              variant={"outlined"}
              defaultValue={config.arduino_data_baud}
              fullWidth
              onChange={(v) => bus.updateConfig("arduino_data_baud", v.target.value)}
            >
              <MenuItem value={9600}>9600</MenuItem>
              <MenuItem value={115200}>115200</MenuItem>
            </Select>
          </Box>
        </Grid>

        {/* Update Arduino */}
        <Divider sx={{mt: 2}}>Update Arduino Controller</Divider>
        <Grid item sx={{display: "flex"}}>
          <Box sx={{width: 1/3, pr: 1}}>
            <Typography>Serial Port</Typography>
            <Select
              variant={"outlined"}
              defaultValue={config.arduino_data_serialport}
              fullWidth
              onChange={(v) => bus.updateConfig("arduino_update_serialport", v.target.value)}
            >
              {availSerial.map(s =>
                <MenuItem key={s.path} value={s.path}>
                  {s.path}{s.manufacturer ? ` - ${s.manufacturer}` : ''}
                </MenuItem>
              )}
            </Select>
          </Box>

          <Box sx={{width: 4/9, px: 1}}>
            <Typography>Compiled Binary</Typography>
            <TextField
              type={"file"}
              variant={"outlined"}
              onChange={v => setUpload(v.target.value)}
              inputProps={{ref: uploadRef}}
              id={"upload-hex"}
            />
          </Box>

          <Box sx={{width: 2/9, pl: 1, pt: 2.8}}>
            <Button
              variant={"contained"}
              size={"large"}
              fullWidth
              sx={{ minHeight: 1 }}
              disabled={upload.length < 1}
              onClick={runUpload}
            >
              Update
            </Button>
          </Box>
        </Grid>

        {/* Debug */}
        <Divider sx={{mt: 2}}>Debugging</Divider>
        {debugEnabled &&
          <Grid container direction={"column"}>
            <Grid item>
                <TextField value={debugBuffer} fullWidth />
            </Grid>
            <Grid item>
                <Button variant={"contained"} fullWidth onClick={clearBuffer}>Clear Buffer</Button>
            </Grid>
          </Grid>
        }
        <Button variant={"contained"} onClick={doDebugToggle} fullWidth>{debugEnabled ? "Disable " : "Enable "}Debugging</Button>


        {/* Software Versions / Restart */}
        <Divider sx={{mt: 2}}>Software Versions</Divider>
        <Grid item sx={{display: "flex", textAlign: "center"}}>
          {/* Arduino */}
          <Box sx={{width: .5, mr: 1}}>
            <Button variant={"outlined"} onClick={doArduinoRestart} disabled>Restart Arduino</Button>
            <Typography sx={{mt: 1}}>Arduino Software Version: v{data.version ?? "Unknown"}</Typography>
          </Box>

          {/* Server */}
          <Box sx={{width: .5, ml: 1}}>
            <Button variant={"outlined"} onClick={doServerRestart}>Restart Server</Button>
            <Typography sx={{mt: 1}}>BusGui Server Version: v{version ?? "Unknown"}</Typography>
          </Box>
        </Grid>

      </Grid>
      }

      <Dialog open={dialogState !== DialogState.NONE}>
        <DialogContent sx={{display: "flex"}}>
          { dialogState !== DialogState.UPDATE_SUCCESS &&
            dialogState !== DialogState.UPDATE_FAILURE &&
            dialogState !== DialogState.RESTART_SUCCESS &&
            dialogState !== DialogState.NONE &&
            <CircularProgress sx={{mr: 2}} />
          }
          <Typography variant={"h6"} sx={{display: "inline", mt: 1}}>
            {dialogState === DialogState.UPLOADING ? "Uploading File to Server..." :
              dialogState === DialogState.UPDATING ? "Updating Arduino..." :
              dialogState === DialogState.UPDATE_FAILURE ? "Update Failed" :
              dialogState === DialogState.UPDATE_SUCCESS ? "Update Successful" :
              dialogState === DialogState.RESTART_SUCCESS ? "Restart Successful" :
              dialogState === DialogState.RESTARTING ? "Restarting..." :
                "Unknown"
            }
          </Typography>
        </DialogContent>
        {(dialogState === DialogState.UPDATE_SUCCESS || dialogState === DialogState.UPDATE_FAILURE || dialogState === DialogState.RESTART_SUCCESS) &&
          <DialogActions>
            <Button onClick={closeUpdateDialog}>Close</Button>
          </DialogActions>
        }
      </Dialog>
    </>
  )
};

export default Settings;
