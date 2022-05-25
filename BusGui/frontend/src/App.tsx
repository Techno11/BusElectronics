import * as React from 'react';
import {Box, Container, Grid, Typography} from "@mui/material";
import LightControl from "./Views/LightControl";
import {useState} from "preact/hooks";
import Dashboard from "./Views/Dashboard";
import {Dashboard as DashboardIcon, Light} from "@mui/icons-material";

enum Views {
  Lights,
  Dashboard,
  Main,
}

export default function App() {

  const [currentView, setCurrentView] = useState<Views>(Views.Main)

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
            <Box sx={{textAlign: "center"}}>
              <Typography variant={"h4"}>BSOD the Bus Control Center</Typography>
            </Box>
            <Grid container direction={"row"}>
              <Grid
                item
                sx={{
                  border: "solid 5px white",
                  paddingTop: "20%",
                  width: "45vw",
                  height: "80vh",
                  borderRadius: "10px",
                  textAlign: "center"
                }}
                onClick={() => setCurrentView(Views.Lights)}
              >
                <Light fontSize={"large"} />
                <Typography>Control Lights</Typography>
              </Grid>
              <Grid
                item
                sx={{
                  ml: "auto",
                  paddingTop: "20%",
                  border: "solid 5px white",
                  width: "45vw",
                  height: "80vh",
                  borderRadius: "10px",
                  textAlign: "center"
                }}
                onClick={() => setCurrentView(Views.Dashboard)}
              >
                <DashboardIcon fontSize={"large"} />
                <Typography>View Dashboard</Typography>
              </Grid>
            </Grid>
          </>
        }
      </Box>
    </Container>
  );
}
