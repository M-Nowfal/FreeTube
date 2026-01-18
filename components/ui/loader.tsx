"use client";

import "./loader.css";
import { JSX } from "react";

type LoaderProps = {
  size?: number;
  className?: string;
};

export function Loader({ size = 20, className = "" }: LoaderProps): JSX.Element {
  return (
    <div 
      className={`spinner mt-1 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20" />
      </svg>
    </div>
  );
}
