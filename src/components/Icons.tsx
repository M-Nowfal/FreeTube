import type { JSX } from "react";

export const Sun = (): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 64 64" role="img" aria-labelledby="sunTitle">
      <title id="sunTitle">Sun</title>
      <circle cx="32" cy="32" r="12" fill="#fff" />
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="60" />
        <line x1="4" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="60" y2="32" />
        <line x1="12" y1="12" x2="19" y2="19" />
        <line x1="45" y1="45" x2="52" y2="52" />
        <line x1="12" y1="52" x2="19" y2="45" />
        <line x1="52" y1="12" x2="45" y2="19" />
      </g>
    </svg>
  )
}

export const Moon = (): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 64 64" role="img" aria-labelledby="moonTitle">
      <title id="moonTitle">Moon</title>
      <defs>
        <mask id="moonMask">
          <rect width="64" height="64" fill="white" />
          <circle cx="40" cy="24" r="18" fill="black" />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="20" fill="black" mask="url(#moonMask)" />
    </svg>
  )
}

export const Play = (): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 64 64" role="img" aria-labelledby="playTitle">
      <title id="playTitle">Play</title>
      <circle cx="32" cy="32" r="30" fill="#fff" stroke="#000" strokeWidth="2" />
      <polygon points="26,20 26,44 46,32" fill="#000" />
    </svg>
  )
}

type x = {
  theme: "light" | "dark";
  size?: number;
}

export const X = ({ theme, size = 12 }: x): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" role="img" aria-labelledby="xTitle">
      <title id="xTitle">Clear</title>
      <line x1="4" y1="4" x2="20" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="4" x2="4" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export const Trash = (): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" role="img" aria-label="Delete">
      <title>Delete</title>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </g>
    </svg>
  )
}

export const User = (): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="9" r="3"></circle>
      <path d="M7 17c2-2 8-2 10 0"></path>
    </svg>
  );
}

export const LeftArrow = (): JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="20" y1="12" x2="4" y2="12"></line>
      <polyline points="10 18 4 12 10 6"></polyline>
    </svg>
  );
}