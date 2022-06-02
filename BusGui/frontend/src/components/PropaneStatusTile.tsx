import {Box, Typography} from "@mui/material";
import {makeRelayCommand, RelayFixtures} from "../models/Command";
import React from "react";
import BusInfo from "../models/BusInfo";
import {useBus} from "../data/hooks/useSocket";
import {useEffect, useState} from "preact/hooks";
import {RelayControlType} from "../models/Relay";
import SimpleAlertDialog from "./SimpleAlertDialog";

interface IProps {
  data: BusInfo
}

const PropaneStatusTile = ({data}: IProps) => {

  // Hooks
  const bus = useBus();

  // State
  const [loadingPropane, setLoadingPropane] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  useEffect(() => {
    // Reset loading propane/pump
    setLoadingPropane(false);
  }, [data]); // eslint-disable-line

  // Send command to toggle propane
  const togglePropane = () => {
    setShowDialog(false);
    if(!data.relays) return;
    const state = {on: !data.relays[RelayFixtures.PropaneValve], state: RelayControlType.Manual};
    bus.runCommand(makeRelayCommand(RelayFixtures.PropaneValve, state)).then(() => {
      setLoadingPropane(true);
    });
  }

  return (
    <>
      <Box
        sx={{textAlign: "center", userSelect: "none"}}
        onTouchStart={(e) => {
          // Long press opens the override menu
          let ended = false;
          const timeout = setTimeout(() => {
            ended = true;
            setShowDialog(true);
          }, 250);
          e.target.addEventListener("touchend", (e) => {
            if (ended) return;
            clearTimeout(timeout);
          });
        }}
      >
        <Typography
          variant={"h4"}
          color={!data.relays || loadingPropane ? "warning.main" : !data.relays[RelayFixtures.PropaneValve] ? "error.main" : ""}
        >
          {data.propane_0 ?? "---"} psi
        </Typography>
        <Typography variant={"caption"}>Propane Tanks</Typography>
        <Typography
          variant={"h4"}
          color={!data.relays || loadingPropane ? "warning.main" : !data.relays[RelayFixtures.PropaneValve] ? "error.main" : ""}
        >
          {data.propane_1 ?? "---"} psi
        </Typography>
      </Box>

      {/* Toggle Dialog */}
      <SimpleAlertDialog
        onClose={() => {}}
        title={`${data.relays && data.relays[RelayFixtures.PropaneValve] ? "Disable" : "Enable"} Propane?`}
        open={showDialog && !loadingPropane}
        message={`Are you sure you want to ${data.relays && data.relays[RelayFixtures.PropaneValve] ? "disable" : "enable"} the propane?`}
        cancelText={"Cancel"}
        yesText={data.relays && data.relays[RelayFixtures.PropaneValve] ? "Disable" : "Enable"}
        onYes={togglePropane}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}

export default PropaneStatusTile;