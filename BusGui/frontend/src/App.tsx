import * as React from 'react';
import {Box, Container, Typography} from "@mui/material";

export default function App() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Preact example
        </Typography>
      </Box>
    </Container>
  );
}
