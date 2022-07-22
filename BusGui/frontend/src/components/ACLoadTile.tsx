import BusInfo from "../models/BusInfo";
import {Box, Typography} from "@mui/material";
import React from "react";


interface IProps {
  data: BusInfo
}

const ACLoadTile = ({data}: IProps) => {
  return (
    <Box sx={{textAlign: "center", width: '100%', userSelect: "none"}}>
      <Typography variant={"h4"} display={"inline"}>
        {((data.current ?? 0) * (data.ac_voltage ?? 0)).toFixed(2)}
      </Typography>
      <Typography variant={"h6"} display={"inline"}>{" watts"}</Typography>
      <Typography variant={"caption"} display={"block"}>AC Load</Typography>
      <Typography variant={"body1"} display={"inline"}>
        {`${(data.current ?? 0).toFixed(2)} amps @ ${(data.ac_voltage ?? 0).toFixed(2)} v`}
      </Typography>
    </Box>
  );
}

export default ACLoadTile;