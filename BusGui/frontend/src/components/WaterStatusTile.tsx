import {Box, Typography} from "@mui/material";
import {RelayFixtures} from "../models/Command";
import React from "react";
import {useEffect, useState} from "preact/hooks";
import WaterPumpDialog from "./WaterPumpDialog";
import BusInfo from "../models/BusInfo";

interface IProps {
  data: BusInfo
}

const WaterStatusTile = ({data}: IProps) => {

  // State
  const [showTank, setShowTank] = useState<boolean>(true);
  const [loadingPump, setLoadingPump] = useState<boolean>(false);
  const [showPumpDialog, setShowPumpDialog] = useState<boolean>(false);

  useEffect(() => {
    // If we have no shore water, ;
    setShowTank(data.relays && data.relays[RelayFixtures.WaterPump]);
    // Reset loading pump
    setLoadingPump(false);
  }, [data]); // eslint-disable-line

  // When pump dialog closes
  const pumpDialogClose = (changed: boolean) => {
    setShowPumpDialog(false);
    if (changed) {
      setLoadingPump(true);
    }
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
            setShowPumpDialog(true);
          }, 250);
          e.target.addEventListener("touchend", () => {
            if (ended) return;
            clearTimeout(timeout);
            setShowTank(!showTank);
          });
        }}
      >
        {!!showTank &&
        <>
          <Typography
            variant={"h4"}
            color={!data.relays || loadingPump ? "warning.main" : !data.relays[RelayFixtures.WaterPump] ? "error.main" : ""}
          >
            {data.water_percent ?? "---"} %
          </Typography>
          <Typography variant={"caption"}>Water Tank</Typography>
        </>
        }
        {!showTank &&
        <>
          <Typography variant={"h4"}>{data.shore_water_pressure ?? "---"} psi</Typography>
          <Typography variant={"caption"}>Shore Water</Typography>
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