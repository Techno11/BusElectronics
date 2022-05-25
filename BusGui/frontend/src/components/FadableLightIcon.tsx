import React from "react";
import {Lightbulb, LightbulbOutlined} from "@mui/icons-material";

interface IProps {
  opacity: number,
  size?: "small" | "medium" | "large" | "inherit"
}

const FadableLightIcon = ({opacity, size}: IProps) => {

  return (
    <div style={{display: "grid", textAlign: "center", height: "100%"}}>
      <Lightbulb fontSize={size} sx={{gridColumn: 1, gridRow: 1, opacity: opacity, m: 'auto'}} />
      <LightbulbOutlined fontSize={size} sx={{gridColumn: 1, gridRow: 1, m: 'auto'}} />
    </div>
  )
}

export default FadableLightIcon;