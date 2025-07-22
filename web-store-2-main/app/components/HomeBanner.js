import React, { useEffect, useRef, useState } from "react";
import { colors, fontFamily } from '../../theme';

const messages = [
  "Free Shipping 🚚",
  "60 Days Return 🔄",
  "Lifetime Warranty 🛡️",
  "Secured Checkout 🔒"
];

export default function HomeBanner() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  return (
    <div style={{
      width: '100%',
      background: colors.ivory,
      color: colors.gold,
      fontWeight: 700,
      fontSize: '1.05rem',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      letterSpacing: '0.02em',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      overflow: 'hidden',
      borderBottom: `2px solid ${colors.softGoldBorder}`,
      boxShadow: '0 2px 8px 0 rgba(191,160,84,0.06)',
      fontFamily: fontFamily.sans,
      textShadow: `0 1px 0 ${colors.white}, 0 0.5px 0 ${colors.softGoldBorder}`,
    }}>
      <span
        style={{
          transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
          opacity: 1,
        }}
        key={index}
      >
        {messages[index]}
      </span>
    </div>
  );
}
