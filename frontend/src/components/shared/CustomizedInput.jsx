import React from 'react';
import { TextField, useMediaQuery } from '@mui/material';

const CustomizedInput = ({ name, type, label }) => {
  const isSmallScreen = useMediaQuery('(max-width:600px)');

  return (
    <TextField
      name={name}
      label={label}
      type={type}
      fullWidth
      InputLabelProps={{ style: { color: 'white' } }}
      inputProps={{
        style: {
          width: isSmallScreen ? '100%' : '400px',
          borderRadius: 10,
          fontSize: 20,
          color: 'white',
        },
      }}
    />
  );
};

export default CustomizedInput;
