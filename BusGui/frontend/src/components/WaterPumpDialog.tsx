import React from "react";
import {useBus} from "../data/hooks/useSocket";
import {Button, Dialog, DialogActions, DialogTitle, List, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import {AutoAwesome, Report, Warning} from "@mui/icons-material";
import {RelayControlType} from "../models/Relay";
import {makeRelayCommand, RelayFixtures} from "../models/Command";

interface IProps {
  open: boolean,
  onClose: (changed: boolean) => void
}

const WaterPumpDialog = ({open, onClose}: IProps) => {

  // Hooks
  const bus = useBus();

  const commandPump = (ctrlMode: RelayControlType, on?: boolean) => {
    const state = {on: !!on, state: ctrlMode};
    bus.runCommand(makeRelayCommand(RelayFixtures.WaterPump, state)).then(() => {
      onClose(true);
    });
  }

  return (
    <>
      <Dialog open={open} sx={{userSelect: "none"}}>
        <DialogTitle>Select Water Pump Mode</DialogTitle>
        <List sx={{ pt: 0 }}>
          <ListItem button onClick={() => commandPump(RelayControlType.Auto)}>
            <ListItemIcon><AutoAwesome/></ListItemIcon>
            <ListItemText primary={"Automatic"} secondary={"Pump automatically turns off when shore water is connected"} />
          </ListItem>
          <ListItem button onClick={() => commandPump(RelayControlType.Manual, true)}>
            <ListItemIcon><Warning color={"error"}/></ListItemIcon>
            <ListItemText primary={"Force Enable"} />
          </ListItem>
          <ListItem button onClick={() => commandPump(RelayControlType.Manual, false)}>
            <ListItemIcon><Report color={"error"}/></ListItemIcon>
            <ListItemText primary={"Force Disable"} />
          </ListItem>
        </List>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );

}

export default WaterPumpDialog;