import React from 'react';
import { Box, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';

export const HealthDepartmentReports = () => {
  return (
    <Box>
      <Helmet>
        <title>Health Department Reports | Sterling Septic & Plumbing LLC</title>
        <meta name="description" content="Tech Health Department Reports page" />
      </Helmet>
      <Typography gutterBottom sx={{ mb: 4, fontSize: 14 }}>
        This Page Is Coming Soon....
      </Typography>
    </Box>
  );
};
