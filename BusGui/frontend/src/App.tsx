import * as React from 'react';
import {Box, Container, Grid, Typography} from "@mui/material";
import LightControl from "./Views/LightControl";
import {useState} from "preact/hooks";
import Dashboard from "./Views/Dashboard";
import {AirportShuttle, Dashboard as DashboardIcon, DirectionsCar, DoorFront, Hotel, Light} from "@mui/icons-material";

enum Views {
  Lights,
  Dashboard,
  Main,
}

export default function App() {

  const [currentView, setCurrentView] = useState<Views>(Views.Main)

  const sxBase = {
    ml: "auto",
    border: "solid 5px white",
    width: "45vw",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }

  return (
    <Container sx={{width: "100vw", height: "95vh", m: 0, p: 0}}>
      <Box sx={{ m: "auto", mt: 1 }}>
        {currentView === Views.Lights &&
          <LightControl goBack={() => setCurrentView(Views.Main)} />
        }
        {currentView === Views.Dashboard &&
          <Dashboard goBack={() => setCurrentView(Views.Main)} />
        }
        {currentView === Views.Main &&
          <>
            {/* Title*/}
            <Box sx={{textAlign: "center"}}>
              <Typography variant={"h4"}>BSOD the Bus Control Center</Typography>
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
                onClick={() => setCurrentView(Views.Lights)}
              >
                <AirportShuttle sx={{mr: 2}} />
                <Typography>Main Presets</Typography>
              </Grid>
              <Grid
                item
                sx={{ ...sxBase, height: "10vh" }}
                onClick={() => setCurrentView(Views.Dashboard)}
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
                onClick={() => setCurrentView(Views.Lights)}
              >
                <DoorFront sx={{mr: 2}} />
                <Typography>Entry Presets</Typography>
              </Grid>
              <Grid
                item
                sx={{ ...sxBase, height: "10vh" }}
                onClick={() => setCurrentView(Views.Dashboard)}
              >
                <Hotel sx={{mr: 2}} />
                <Typography>Bedroom Presets</Typography>
              </Grid>
            </Grid>
          </>
        }
      </Box>
    </Container>
  );
}
