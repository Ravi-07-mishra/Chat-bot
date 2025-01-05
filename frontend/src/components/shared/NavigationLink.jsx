import React from 'react'
import { Link } from 'react-router-dom'
const NavigationLink = ({to,bg,text,textColor,OnClick}) => {
  return (
    <div>
       <Link
      className='nav-link'
      
      to={to}  style={{background: bg, color: textColor}}>
      {text}
      </Link>
    </div>
  )
}

export default NavigationLink
