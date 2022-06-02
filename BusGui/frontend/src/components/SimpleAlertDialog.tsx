import React from "preact/compat";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";

interface IProps {
  title?: string,
  message?: string,
  cancelText?: string,
  yesText?: string,
  onYes?: () => any,
  onCancel?: () => any,
  onClose: () => void,
  open: boolean,
}

const SimpleAlertDialog = ({onCancel, message, onYes, open, title, yesText, cancelText, onClose}: IProps) => {



  return (
    <>
      {/* @ts-ignore */}
      <Dialog open={open} onClose={onClose} sx={{userSelect: "none"}}>
        <DialogTitle>{title ?? "Alert"}</DialogTitle>
        <DialogContent>
          {/* @ts-ignore */}
          <DialogContentText>{message ?? "Yes or no?"}</DialogContentText>
        </DialogContent>
        {/* @ts-ignore */}
        <DialogActions>
          <Button onClick={onCancel}>{cancelText ?? "No"}</Button>
          <Button onClick={onYes} autoFocus>{yesText ?? "Yes"}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SimpleAlertDialog;