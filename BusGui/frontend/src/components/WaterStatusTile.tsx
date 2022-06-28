import {Box, Typography, useTheme} from "@mui/material";
import {CommandType, Device, RelayFixtures} from "../models/Command";
import React from "react";
import {useEffect, useState} from "preact/hooks";
import WaterPumpDialog from "./WaterPumpDialog";
import BusInfo from "../models/BusInfo";
import {useBus} from "../data/hooks/useSocket";

interface IProps {
  data: BusInfo
}

const WaterStatusTile = ({data}: IProps) => {

  // Hooks
  const bus = useBus();

  const theme = useTheme();

  // State
  const [showTank, setShowTank] = useState<boolean>(true);
  const [overrideAuto, setOverrideAuto] = useState<boolean>(false);
  const [loadingPump, setLoadingPump] = useState<boolean>(false);
  const [showPumpDialog, setShowPumpDialog] = useState<boolean>(false);

  useEffect(() => {
    // If we have no shore water and we haven't overridden auto
    if(!overrideAuto) {
      setShowTank(data.relays && data.relays[RelayFixtures.WaterPump]);
    }
    // Reset loading pump
    setLoadingPump(false);
  }, [data]); // eslint-disable-line

  useEffect(() => {
    bus.addListener("WaterStatusTile", data => {
      if(data.type === "command") {
        // Shorthand
        const c = data.command;

        // If we get any kind of water-pump-relay control command, set loading to true
        if(c.device === Device.RELAY && c.type === CommandType.Relay && c.fixture === RelayFixtures.WaterPump) {
          setLoadingPump(true);
        }
      }
    });
  }, []); // eslint-disable-line

  // When pump dialog closes
  const pumpDialogClose = (changed: boolean) => {
    setShowPumpDialog(false);
    if (changed) {
      setLoadingPump(true);
    }
  }

  const calcColor = (loading: boolean) =>
    !data.relays || loading ? "grey.A700" : !data.relays[RelayFixtures.WaterPump] ? "error.main" : ""

  // If the pump is put in manual mode, show a red border
  const calcBorder = (loading: boolean) =>
    !data.relays || loading ? `5px solid ${theme.palette.grey.A700}` :
      data.water_pump_run_state === 1 ? `5px solid ${theme.palette.error.main}` : ""

  // If the pump is put in manual mode, show warning is manual on, and red if manual off
  const calcBg = (loading: boolean) =>
    !data.relays || loading ? `` : // nothing if no data
      data.water_pump_run_state === 1 && data.relays[RelayFixtures.WaterPump] ? theme.palette.warning.main :
      data.water_pump_run_state === 1 && !data.relays[RelayFixtures.WaterPump] ? theme.palette.error.main :
        "" // otherwise we're in automatic mode

  return (
    <>
      <Box
        sx={{
          textAlign: "center",
          userSelect: "none",
          border: calcBorder(loadingPump),
          background: calcBg(loadingPump),
          width: "100%",
          borderRadius: "15px"
      }}
        onTouchStart={(e) => {
          // Long press opens the override menu
          let ended = false;
          const timeout = setTimeout(() => {
            ended = true;
            setShowPumpDialog(true);
          }, 250);
          e.target.addEventListener("touchend", () => {
            if (ended) return;
            clearTimeout(timeout);
            setOverrideAuto(true);
            setShowTank(!showTank);
            e.target.removeEventListener("touchend", () => {})
          });
        }}
      >
        {!!showTank &&
        <>
          <Typography variant={"h4"} color={calcColor(loadingPump)} display={"inline"}>
            {data.water_percent ?? "---"}
          </Typography>
          <Typography variant={"h6"} color={calcColor(loadingPump)} display={"inline"}>{" %"}</Typography>
          <Typography variant={"caption"} display={"block"}>Water Tank {overrideAuto ? " *" : ""}</Typography>
        </>
        }
        {!showTank &&
        <>
          <Typography variant={"h4"} display={"inline"}>{data.shore_water_pressure ?? "---"}</Typography>
          <Typography variant={"h6"} display={"inline"}>{" psi"}</Typography>
          <Typography variant={"caption"} display={"block"}>Shore Water {overrideAuto ? " *" : ""}</Typography>
        </>
        }
        <Typography variant={"h6"}>{data.water_flow ?? "---"} gpm</Typography>
      </Box>


      {/* Water Pump Dialog */}
      <WaterPumpDialog open={showPumpDialog} onClose={pumpDialogClose}/>
    </>
  )
}

export default WaterStatusTile;