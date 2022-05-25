import React from "react";
import {Fab} from "@mui/material";
import {ExitToApp} from "@mui/icons-material";

interface IProps {
  goBack: () => void,
}

const Dashboard = ({goBack}: IProps) => {

  return (
    <>

      {/* Exit/Go Back Button */}
      <Fab size={"small"} sx={{m: 0, right: "10px", bottom: "10px", position: 'fixed'}} onClick={goBack}>
        <ExitToApp />
      </Fab>
    </>
  )
}

export default Dashboard;