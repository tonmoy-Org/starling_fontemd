import React from 'react';
import { Box, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';

export const SubmitHealthReport = () => {
  return (
    <Box>
      <Helmet>
        <title>Submit Health Report | Sterling Septic & Plumbing LLC</title>
        <meta name="description" content="Tech Submit Health Report page" />
      </Helmet>
      <Typography gutterBottom sx={{ mb: 4, fontSize: 14 }}>
        This Page Is Coming Soon....
      </Typography>
    </Box>
  );
};
