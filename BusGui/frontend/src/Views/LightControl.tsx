import React from "react";
import {Box, Grid, Slider, Typography} from "@mui/material";
import FadableLightIcon from "../components/FadableLightIcon";
import {useEffect, useRef, useState} from "preact/hooks";
import {
  CommandType,
  Device,
  getName,
  LEDFixtures,
  makeLedCommand,
  makeMosfetCommand,
  MosfetFixtures
} from "../models/Command";
import {AlphaPicker, ColorResult, HuePicker} from "react-color"
import LEDColor, {getNew as newLED, getRGBA} from "../models/LEDColor"
import {useBus} from "../data/hooks/useSocket";
import Mosfet, {getNew as newFet} from "../models/Mosfet";

const bedroomHalfWidth = '15vw';
const rearAisleWidth = '22.5vw';
const frontAisleWidth = "27.5vw";
const frontEntryWidth = "14vw";
const radius = "10px";
const border = "solid 5px white";

const LightControl = () => {

  // Hooks
  const bus = useBus();

  // State
  const [mosfets, setMosfets] = useState<Mosfet[]>([newFet(), newFet(), newFet(), newFet(), newFet(), newFet(), newFet(), newFet(), newFet(), newFet(), ]);
  const [leds, setLeds] = useState<LEDColor[]>([newLED(), newLED(), newLED(), newLED(), newLED()]);
  const [currentFixture, setCurrentFixture] = useState<MosfetFixtures | LEDFixtures>(MosfetFixtures.RearAisle);
  const [currentDevice, setCurrentDevice] = useState<Device.LED | Device.MOSFET>(Device.MOSFET);

  // Refs
  const mosfetRef = useRef<Mosfet[]>(mosfets);
  const ledRef = useRef<LEDColor[]>(leds);

  // Start listening to bus
  useEffect(() => {
    bus.addListener("LightControl", data => {
      if(data.type === "command") {
        // Shorthand
        const c = data.command;

        // Decode command
        if(c.device === Device.MOSFET && c.type === CommandType.Intensity) {
          const fets = [...mosfetRef.current];
          fets[c.fixture] = {i: c.intensity / 255, on: c.on};
          updateFetState(fets);
        } else if (c.device === Device.LED && c.type === CommandType.Color) {
          const led = [...ledRef.current];
          led[c.fixture] = {on: c.on, a: c.alpha, r: c.red / c.alpha, g: c.green / c.alpha, b: c.blue / c.alpha}
          updateLedState(led);
        }
      }
    });
  }, []); // eslint-disable-line

  const updateFetState = (fets: Mosfet[]) => {
    mosfetRef.current = fets;
    setMosfets(fets);
  }

  const updateLedState = (led: LEDColor[]) => {
    ledRef.current = led;
    setLeds(led);
  }

  const selectLight = (fixture: MosfetFixtures) => {
    // Check if this fixture is already selected, if so, toggle it
    if(currentDevice === Device.MOSFET && currentFixture === fixture) {
      toggleMosfetFixture(mosfets[fixture].on, fixture);
    } else {
      setCurrentDevice(Device.MOSFET);
      setCurrentFixture(fixture);
    }
  }

  const selectLed = (fixture: LEDFixtures) => {
    // Check if this fixture is already selected, if so, toggle it
    if(currentDevice === Device.LED && currentFixture === fixture) {
      toggleLeds(leds[fixture].on, fixture);
    } else {
      setCurrentDevice(Device.LED);
      setCurrentFixture(fixture);
    }
  }

  // Bedroom
  const selBedroomRear = () => selectLed(LEDFixtures.BedroomRear);
  const selBedroomPass = () => selectLed(LEDFixtures.BedroomPassenger);
  const selBedroomDriver = () => selectLed(LEDFixtures.BedroomDriver);

  // Rear Aisle Stack
  const selShower = () => selectLight(MosfetFixtures.ShowerLight);
  const selRearAisle = () => selectLight(MosfetFixtures.RearAisle);
  const selCloset = () => selectLight(MosfetFixtures.ClosetLight);

  // Front Aisle Stack
  const selDriverWin = () => selectLed(LEDFixtures.LED2);
  const selFrontAisle = () => selectLight(MosfetFixtures.FrontAisle);
  const selPassWin = () => selectLed(LEDFixtures.LED3);

  // Front Stack
  const selEntry = () => selectLight(MosfetFixtures.EntryLight);
  const selShoebox = () => selectLight(MosfetFixtures.ShoeBox);

  // Update Mosfet Fixture
  const updateMosfetFixture = (val: number | number[], selFix: MosfetFixtures | LEDFixtures) => {
    if(Array.isArray(val)) val = val[0];
    const copy = [...mosfets];
    copy[selFix].i = val;
    copy[selFix].on = true;
    updateFetState(copy);
    bus.runCommand(makeMosfetCommand(currentDevice, selFix, copy[selFix]));
  }

  // Toggle Mosfet Fixture
  const toggleMosfetFixture = (val: boolean, selFix: MosfetFixtures | LEDFixtures) => {
    const copy = [...mosfets];
    copy[selFix].on = !val;
    updateFetState(copy);
    bus.runCommand(makeMosfetCommand(currentDevice, selFix, copy[selFix]));
  }

  // Update LED Fixture
  const updateLeds = (color: ColorResult, selFix: MosfetFixtures | LEDFixtures) => {
    const copy = [...leds];
    copy[selFix] = {...color.rgb, on: true} as LEDColor;
    updateLedState(copy)
    bus.runCommand(makeLedCommand(currentDevice, selFix, copy[selFix]));
  }

  // Update LED Fixture
  const toggleLeds = (val: boolean, selFix: MosfetFixtures | LEDFixtures) => {
    const copy = [...leds];
    copy[selFix].on = !val;
    updateLedState(copy)
    bus.runCommand(makeLedCommand(currentDevice, selFix, copy[selFix]));
  }

  const calcOpacity = (fixture: MosfetFixtures | LEDFixtures): number => {
    const f = mosfets[fixture];
    return f.on ? f.i : 0;
  }

  return (
    <>
      <Grid container direction={"row"} sx={{height: "70vh"}}>

        {/* Bedroom Area Rear */}
        <Grid item>
          <Box
            sx={{
              border: border,
              borderRadius: `${radius} 0 0 ${radius}`,
              borderRight: "none",
              height: 1,
              width: bedroomHalfWidth,
              background: getRGBA(leds[LEDFixtures.BedroomRear])
            }}
            onClick={selBedroomRear}
          />
        </Grid>

        {/* Bedroom Area Front */}
        <Grid item>
          <Box sx={{borderTop: border, height: .5, width: bedroomHalfWidth, background: getRGBA(leds[LEDFixtures.BedroomDriver])}} onClick={selBedroomDriver} />
          <Box sx={{borderBottom: border, height: .5, width: bedroomHalfWidth, background: getRGBA(leds[LEDFixtures.BedroomPassenger])}} onClick={selBedroomPass} />
        </Grid>

        {/* Rear Hallway/Closet/Bathroom */}
        <Grid item>
          <Box sx={{border: border, borderRadius: `0 0 ${radius} ${radius}`, height: 1/3, width: rearAisleWidth}} onClick={selShower}>
            <FadableLightIcon size={"large"} fixture={mosfets[MosfetFixtures.ShowerLight]} />
          </Box>
          <Box sx={{height: 1/3, width: rearAisleWidth}} onClick={selRearAisle}>
            <FadableLightIcon size={"large"} fixture={mosfets[MosfetFixtures.RearAisle]} />
          </Box>
          <Box sx={{border: border, borderRadius: `${radius} ${radius} 0 0`, height: 1/3, width: rearAisleWidth}} onClick={selCloset}>
            <FadableLightIcon size={"large"} fixture={mosfets[MosfetFixtures.ClosetLight]} />
          </Box>
        </Grid>

        {/* Front Hallway/Kitchen */}
        <Grid item>
          {/* Driver Windowsill*/}
          <Box sx={{borderTop: border, height: 1/18, width: frontAisleWidth, background: getRGBA(leds[LEDFixtures.LED2])}} onClick={selDriverWin} />
          {/* Spacer */}
          <Box sx={{height: 5/18, width: frontAisleWidth}} />
          {/* Center Aisle */}
          <Box sx={{height: 1/3, width: frontAisleWidth, display: "flex"}}>
            {/* Tail of rear aisle*/}
            <Box sx={{width: 1/3, height: 1}} onClick={selRearAisle}/>
            {/* Head of Front Aisle*/}
            <Box sx={{width: 2/3, height: 1}} onClick={selFrontAisle}>
              <FadableLightIcon size={"large"} fixture={mosfets[MosfetFixtures.FrontAisle]} />
            </Box>
          </Box>
          {/* Spacer */}
          <Box sx={{height: 5/18, width: frontAisleWidth, display: "flex"}}>
            {/* Spacer */}
            <Box sx={{width: 3/4, height: 1}} />
            {/* Top of Shoebox */}
            <Box sx={{width: 1/4, height: 1}} onClick={selShoebox}>
              <FadableLightIcon size={"large"} fixture={mosfets[MosfetFixtures.ShoeBox]} />
            </Box>
          </Box>
          {/* Passenger Windowsill */}
          <Box sx={{borderBottom: border, height: 1/18, width: frontAisleWidth, display: "flex"}}>
            {/* Windowsill Selector */}
            <Box sx={{width: 3/4, height: 1, background: getRGBA(leds[LEDFixtures.LED3])}} onClick={selPassWin}/>
            {/* Bottom of Shoebox */}
            <Box sx={{width: 1/4, height: 1}} onClick={selShoebox}/>
          </Box>
        </Grid>

        {/* Entry/Driver Light */}
        <Grid item>
          {/* Driver's area*/}
          <Box sx={{borderTop: border, borderRight: border, borderRadius: `0 ${radius} 0 0`,  height: 1/3, width: frontEntryWidth}} />
          {/* Center Aisle Extension */}
          <Box sx={{borderRight: border, height: 1/3, width: frontEntryWidth}} onClick={selFrontAisle}/>
          {/* Entry Light */}
          <Box sx={{borderBottom: border, borderRight: border, borderRadius: `0 0 ${radius} 0`, height: 1/3, width: frontEntryWidth}} onClick={selEntry}>
            <FadableLightIcon size={"large"} fixture={mosfets[MosfetFixtures.EntryLight]} />
          </Box>
        </Grid>
      </Grid>

      {/* Selectors */}
      <Box sx={{m: 2, textAlign: "center"}}>
        <Typography variant={"h5"}>{getName(currentDevice, currentFixture)}</Typography>
        {currentDevice === Device.MOSFET &&
          <>
            <Slider
              onChange={(e, v) => updateMosfetFixture(v, currentFixture)}
              min={0}
              max={1}
              step={0.01}
              value={calcOpacity(currentFixture)}
            />
          </>
        }
        {currentDevice === Device.LED &&
          <>
            <Box sx={{w: 1, m: 2}}>
              <HuePicker width={'100%'} onChange={c => updateLeds(c, currentFixture)} color={leds[currentFixture]} />
            </Box>
            <Box sx={{w: 1, m: 2}}>
              <AlphaPicker width={'100%'} onChange={c => updateLeds(c, currentFixture)} color={leds[currentFixture]} />
            </Box>
          </>
        }
      </Box>
    </>
  )
}

export default LightControl;