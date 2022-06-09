import * as React from 'react';
import {Box, Container, Fab, Tooltip} from "@mui/material";
import LightControl from "./Views/LightControl";
import {useEffect, useState} from "preact/hooks";
import Dashboard from "./Views/Dashboard";
import Views from "./models/Views";
import Home from "./Views/Home";
import {ExitToApp} from "@mui/icons-material";
import BusInfo from "./models/BusInfo";
import {useBus} from "./data/hooks/useSocket";
import Settings from "./Views/Settings";

const makePageTitle = (t: string) => `${t} | BSOD the Bus`

export default function App() {

  // Hooks
  const bus = useBus();

  // State
  const [currentView, setCurrentView] = useState<Views>(Views.Home);
  const [busData, setBusData] = useState<BusInfo>({} as BusInfo);
  const [connectedSocket, setConnectedSocket] = useState<boolean>(false);
  const [connectedArduino, setConnectedArduino] = useState<boolean>(false);

  useEffect(() => {
    // Request status
    bus.getStatus().then(data => {
      setConnectedArduino(data.healthy);
    });

    // Get socket connection status
    setConnectedSocket(bus.isConnected());

    // Register listener to update bus data
    bus.addListener("app", payload => {
      if(payload.type === "info" && payload.data) setBusData(payload.data);
      else if (payload.type === "socket") setConnectedSocket(payload.connected);
      else if (payload.type === "healthy") setConnectedArduino(true);
      else if (payload.type === "unhealthy") setConnectedArduino(false);
    });

    // Load view based on URL location
    switch(document.location.pathname.toLowerCase()) {
      case "/lights":
        setCurrentView(Views.Lights);
        break;
      case "/dashboard":
        setCurrentView(Views.Dashboard);
        break;
      case "/presets/main":
        setCurrentView(Views.MainPresets);
        break;
      case "/presets/entry":
        setCurrentView(Views.EntryPresets);
        break;
      case "/presets/driver":
        setCurrentView(Views.DriverPresets);
        break;
      case "/presets/bedroom":
        setCurrentView(Views.BedroomPresets);
        break;
      case "/settings":
        setCurrentView(Views.Settings);
        break;
      default: // unknown url
        window.history.replaceState(null, makePageTitle("Home"), "/")
        break;
    }
  }, []); // eslint-disable-line

  const goTo = (view: Views) => {
    switch(view) {
      case Views.Lights:
        window.history.pushState(null, makePageTitle("Lights"), "/lights")
        break;
      case Views.Dashboard:
        window.history.pushState(null, makePageTitle("Dashboard"), "/dashboard")
        break;
      case Views.MainPresets:
        window.history.pushState(null, makePageTitle("Main Presets"), "/presets/main")
        break;
      case Views.EntryPresets:
        window.history.pushState(null, makePageTitle("Entry Presets"), "/presets/entry")
        break;
      case Views.DriverPresets:
        window.history.pushState(null, makePageTitle("Driver Presets"), "/presets/driver")
        break;
      case Views.BedroomPresets:
        window.history.pushState(null, makePageTitle("Bedroom Presets"), "/presets/bedroom")
        break;
      case Views.Settings:
        window.history.pushState(null, makePageTitle("Settings"), "/settings")
        break;
      case Views.Home:
        window.history.pushState(null, makePageTitle("Home"), "/")
        break;
    }
    setCurrentView(view);
  }

  return (
    <Container sx={{width: "100vw", height: "95vh", m: 0, p: 0}}>
      {/* Socket or Arduino connection error */}
      {(!connectedArduino || !connectedSocket) &&
        <Box sx={{width: "100vw", background: "darkred", position: "absolute", top: 0, left: 0, textAlign: "center"}}>
          {!connectedSocket ? "Socket Connection Error" : "Mainframe Connection Error"}
        </Box>
      }

      {/* Views */}
      <Box sx={{ m: "auto", mt: 1 }}>
        {currentView === Views.Lights &&
          <LightControl />
        }
        {currentView === Views.Dashboard &&
          <Dashboard data={busData} />
        }
        {currentView === Views.Home &&
          <Home setCurrentView={goTo} />
        }
        {currentView === Views.Settings &&
          <Settings data={busData} />
        }
        {currentView !== Views.Home &&
          <Fab
            size={"small"}
            sx={{m: 0, right: "10px", bottom: "10px", position: 'fixed'}}
            onClick={() => goTo(Views.Home)}
          >
            <Tooltip title={"Main Menu"}>
              <ExitToApp />
            </Tooltip>
          </Fab>
        }
      </Box>
    </Container>
  );
}
