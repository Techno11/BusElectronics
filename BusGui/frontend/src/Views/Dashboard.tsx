import React from "react";
import {Box, Grid, Typography} from "@mui/material";
import BusInfo from "../models/BusInfo";
import WaterStatusTile from "../components/WaterStatusTile";
import PropaneStatusTile from "../components/PropaneStatusTile";
import {ElectricBolt, PropaneTank, WaterDamage} from "@mui/icons-material";

interface IProps {
  data: BusInfo
}

const cellSxBase = {height: 1 / 3, display: "flex", alignItems: "center", justifyContent: "center"}

const Dashboard = ({data}: IProps) => {

  return (
    <>
      <Grid container direction={"row"} sx={{height: "95vh"}}>
        {/* Water, Propane, Current Icons */}
        <Grid item sx={{width: 1 / 18, textAlign: "center"}}>
          <Box sx={cellSxBase}><WaterDamage fontSize={"large"}/></Box>
          <Box sx={cellSxBase}><PropaneTank fontSize={"large"}/></Box>
          <Box sx={cellSxBase}><ElectricBolt fontSize={"large"}/></Box>
        </Grid>

        {/* Water Pressure/Tank / Propane / Current Column */}
        <Grid item sx={{width: 2 / 9}}>
          {/* Water Pressure/Tank */}
          <Box sx={cellSxBase}>
            <WaterStatusTile data={data}/>
          </Box>

          {/* Propane Pressure */}
          <Box sx={cellSxBase}>
            <PropaneStatusTile data={data}/>
          </Box>

          <Box sx={{...cellSxBase, textAlign: "center", userSelect: "none"}}>
            <Box>
              <Typography variant={"h4"} display={"inline"}>{data.current ?? "---"}</Typography>
              <Typography variant={"h6"} display={"inline"}>{" amps"}</Typography>
              <Typography variant={"caption"} display={"flex"}>AC Load</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Column 2 */}
        {/*<Grid item sx={{width: 2 / 9}}>*/}
        {/*  <Box sx={{height: 1 / 3}}>*/}
        {/*    Blah 1*/}
        {/*  </Box>*/}
        {/*  <Box sx={{height: 1 / 3}}>*/}
        {/*    Blah2*/}
        {/*  </Box>*/}
        {/*  <Box sx={{height: 1 / 3}}>*/}
        {/*    Blah3*/}
        {/*  </Box>*/}
        {/*</Grid>*/}
      </Grid>
    </>
  )
}

export default Dashboard;