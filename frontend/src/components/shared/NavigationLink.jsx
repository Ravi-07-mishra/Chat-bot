import React from 'react';
import { Link } from 'react-router-dom';

const NavigationLink = ({ to, bg, text, textColor, OnClick }) => {
  return (
    <div style={{ width: "100%" }}>
      <Link
        className="nav-link"
        to={to}
        onClick={OnClick}
        style={{
          background: bg,
          color: textColor,
          display: "inline-block",
          width: "100%",
          maxWidth: "200px",
          textAlign: "center",
        }}
      >
        {text}
      </Link>
    </div>
  );
};

export default NavigationLink;
