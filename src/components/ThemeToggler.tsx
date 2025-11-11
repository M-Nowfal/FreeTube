interface ThemeTogglerProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeToggler = ({ theme, toggleTheme }: ThemeTogglerProps) => {
  return (
    <button
      className={`font-semibold rounded-md cursor-pointer transition-all active:scale-80`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
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
      ) : (
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
      )}
    </button>
  )
}

export default ThemeToggler