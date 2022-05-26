import React from "react";
import {Lightbulb, LightbulbOutlined} from "@mui/icons-material";
import Mosfet from "../models/Mosfet";
import {Typography} from "@mui/material";

interface IProps {
  opacity: number,
  on?: boolean,
  size?: "small" | "medium" | "large" | "inherit"
}

interface IPropsAlt {
  fixture: Mosfet
  size?: "small" | "medium" | "large" | "inherit"
}

const FadableLightIcon = (props: IProps | IPropsAlt) => {
  const p = props as any;
  const opacity = p.fixture ? p.fixture.i : p.opacity;
  const on = p.fixture ? p.fixture.on : p.on;
  const size = props.size;

  return (
    <div style={{display: "grid", textAlign: "center", height: "100%"}}>
      <Lightbulb fontSize={size} sx={{gridColumn: 1, gridRow: 1, opacity: opacity, m: 'auto'}}/>
      <LightbulbOutlined fontSize={size} sx={{gridColumn: 1, gridRow: 1, m: 'auto'}}/>
      {/* "/" through light*/}
      {!on &&
      <>
        {/* Mimic a stroke */}
        <Typography
          variant={"h3"}
          sx={{gridColumn: 1, gridRow: 1, m: 'auto', transform: "rotate(45deg)"}}
          style={{"-webkit-text-stroke": "6px black"} as any}
        >
          I
        </Typography>
        {/* Not a stroke */}
        <Typography
          variant={"h3"}
          sx={{gridColumn: 1, gridRow: 1, m: 'auto', transform: "rotate(45deg)", fontWeight: "100"}}
        >
          I
        </Typography>
      </>
      }
    </div>
  )
}

export default FadableLightIcon;