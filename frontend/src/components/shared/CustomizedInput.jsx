import React from 'react';
import { TextField, useTheme, useMediaQuery } from '@mui/material';

const CustomizedInput = ({ name, type, label, fullWidth = true }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('xs'));

  return (
    <TextField
      name={name}
      type={type}
      label={label}
      fullWidth={fullWidth}
      variant="filled"
      InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
      inputProps={{
        sx: {
          color: 'white',
          fontSize: isXs ? '0.875rem' : '1rem',
          borderRadius: 1,
        },
      }}
      sx={{
        my: 1,
        '& .MuiFilledInput-root': {
          backgroundColor: 'rgba(255,255,255,0.1)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
        },
      }}
    />
  );
};

export default CustomizedInput;