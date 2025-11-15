const PlayButton = ({ handlePlay, theme }: { handlePlay: () => void, theme: "dark" | "light" }) => {
  return (
    <button
      className={`bg-black lg:text-lg rounded-lg px-3 text-white flex items-center gap-2 py-1.5 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
      onClick={() => handlePlay()}
    >
      <span className="hidden md:block">Play</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 64 64" role="img" aria-labelledby="playTitle">
        <title id="playTitle">Play</title>
        <circle cx="32" cy="32" r="30" fill="#fff" stroke="#000" strokeWidth="2" />
        <polygon points="26,20 26,44 46,32" fill="#000" />
      </svg>
    </button>
  )
}

export default PlayButton