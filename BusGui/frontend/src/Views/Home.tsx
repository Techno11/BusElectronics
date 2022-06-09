import {Box, Grid, Typography} from "@mui/material";
import {AirportShuttle, Dashboard as DashboardIcon, DirectionsCar, DoorFront, Hotel, Light} from "@mui/icons-material";
import * as React from "react";
import Views from "../models/Views";

interface IProps {
  setCurrentView: (view: Views) => void
}

const sxBase = {
  ml: "auto",
  border: "solid 5px white",
  width: "45vw",
  borderRadius: "10px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}

const Home = ({setCurrentView}: IProps) => {
   return (
     <>
       {/* Title*/}
       <Box sx={{textAlign: "center"}}>
         <Typography variant={"h4"} sx={{display: "inline"}}>BSOD the </Typography>
         <Typography
           variant={"h4"}
           sx={{display: "inline"}}
           onClick={() => setCurrentView(Views.Settings)}
         >
           Bus
         </Typography>
         <Typography variant={"h4"} sx={{display: "inline"}}> Control Center</Typography>
       </Box>

       {/* Lights/Dashboard Buttons */}
       <Grid container direction={"row"}>
         <Grid
           item
           sx={{ ...sxBase, height: "60vh" }}
           onClick={() => setCurrentView(Views.Lights)}
         >
           <Box sx={{textAlign: "center"}}>
             <Light fontSize={"large"} />
             <Typography>Control Lights</Typography>
           </Box>
         </Grid>
         <Grid
           item
           sx={{ ...sxBase, height: "60vh" }}
           onClick={() => setCurrentView(Views.Dashboard)}
         >
           <Box sx={{textAlign: "center"}}>
             <DashboardIcon fontSize={"large"} />
             <Typography>View Dashboard</Typography>
           </Box>
         </Grid>
       </Grid>

       {/* Scene Selection Viewer Top Row*/}
       <Grid container direction={"row"} sx={{my: 1}}>
         <Grid
           item
           sx={{ ...sxBase, height: "10vh"}}
           onClick={() => setCurrentView(Views.MainPresets)}
         >
           <AirportShuttle sx={{mr: 2}} />
           <Typography>Main Presets</Typography>
         </Grid>
         <Grid
           item
           sx={{ ...sxBase, height: "10vh" }}
           onClick={() => setCurrentView(Views.DriverPresets)}
         >
           <DirectionsCar sx={{mr: 2}} />
           <Typography>Driver Presets</Typography>
         </Grid>
       </Grid>

       {/* Scene Selection Viewer Bottom Row*/}
       <Grid container direction={"row"} sx={{my: 1}}>
         <Grid
           item
           sx={{ ...sxBase, height: "10vh" }}
           onClick={() => setCurrentView(Views.EntryPresets)}
         >
           <DoorFront sx={{mr: 2}} />
           <Typography>Entry Presets</Typography>
         </Grid>
         <Grid
           item
           sx={{ ...sxBase, height: "10vh" }}
           onClick={() => setCurrentView(Views.BedroomPresets)}
         >
           <Hotel sx={{mr: 2}} />
           <Typography>Bedroom Presets</Typography>
         </Grid>
       </Grid>
     </>
   )
}

export default Home;