import React from 'react'
import { TextField } from '@mui/material'
const CustomizedInput = ({name,type,label}) => {
  return (
    <TextField name={name} label={label} type={type} InputLabelProps={{style: {color:'white'}}}
    inputProps={{style: {width:"400px", borderRadius: 10,fontSize: 20,color:"white"

    }}}
    >
    
    </TextField>
  )
}

export default CustomizedInput
