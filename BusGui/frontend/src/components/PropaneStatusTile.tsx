import {Box, Typography} from "@mui/material";
import {CommandType, Device, makeRelayCommand, RelayFixtures} from "../models/Command";
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
    bus.addListener("PropaneStatusTile", data => {
      if(data.type === "command") {
        // Shorthand
        const c = data.command;

        // If we get any kind of propane-relay control command, set loading to true
        if(c.device === Device.RELAY && c.type === CommandType.Relay && c.fixture === RelayFixtures.PropaneValve) {
          setLoadingPropane(true);
        }
      }
    });
  }, []); // eslint-disable-line

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

  const calcColor = (loading: boolean) =>
    !data.relays || loading ? "grey.A700" : !data.relays[RelayFixtures.PropaneValve] ? "error.main" : ""

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
          e.target.addEventListener("touchend", () => {
            if (ended) return;
            clearTimeout(timeout);
            e.target.removeEventListener("touchend", () => {});
          });
        }}
      >
        <Typography display={"inline"} variant={"h4"} color={calcColor(loadingPropane)}>
          {(data.propane_0 ?? 0).toFixed(2)}
        </Typography>
        <Typography display={"inline"} variant={"h6"} color={calcColor(loadingPropane)}>{" psi"}</Typography>
        <Typography variant={"caption"} display={"flex"}>Propane Tanks</Typography>
        <Typography display={"inline"}variant={"h4"} color={calcColor(loadingPropane)}>
          {(data.propane_1 ?? 0).toFixed(2)}
        </Typography>
        <Typography variant={"h6"} display={"inline"} color={calcColor(loadingPropane)}>{" psi"}</Typography>
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