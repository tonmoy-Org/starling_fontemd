import React from 'react';
import { Box, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';

export const MySchedule = () => {
  return (
    <Box>
      <Helmet>
        <title>My Schedule | Sterling Septic & Plumbing LLC</title>
        <meta name="description" content="Tech My Schedule page" />
      </Helmet>
      <Typography gutterBottom sx={{ mb: 4, fontSize: 14 }}>
        This Page Is Coming Soon....
      </Typography>
    </Box>
  );
};
