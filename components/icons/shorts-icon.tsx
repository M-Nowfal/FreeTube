import React from "react";

interface ShortsIconProps {
  className?: string;
  size?: number;
}

export function ShortsIcon({ className = "", size = 24 }: ShortsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="shortsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF0050" />
          <stop offset="50%" stopColor="#FF4D00" />
          <stop offset="100%" stopColor="#FFD600" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        stroke="url(#shortsGradient)"
        strokeWidth="2"
        fill="none"
      />
      <polygon
        points="10,8 10,16 16,12"
        fill="url(#shortsGradient)"
      />
    </svg>
  );
}

export function ShortsIconFilled({ className = "", size = 24 }: ShortsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="shortsGradientFilled" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF0050" />
          <stop offset="50%" stopColor="#FF4D00" />
          <stop offset="100%" stopColor="#FFD600" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        stroke="url(#shortsGradientFilled)"
        strokeWidth="2"
        fill="url(#shortsGradientFilled)"
        fillOpacity="0.15"
      />
      <polygon
        points="10,8 10,16 16,12"
        fill="url(#shortsGradientFilled)"
      />
    </svg>
  );
}

export function ShortsIconSimple({ className = "", size = 24 }: ShortsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <polygon
        points="10,8 10,16 16,12"
        fill="currentColor"
      />
    </svg>
  );
}
