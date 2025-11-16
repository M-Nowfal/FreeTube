import { Play } from "./Icons"

const PlayButton = ({ handlePlay, theme }: { handlePlay: () => void, theme: "dark" | "light" }) => {
  return (
    <button
      className={`bg-black lg:text-lg rounded-lg px-3 text-white flex items-center gap-2 py-1.5 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
      onClick={() => handlePlay()}
    >
      <span className="hidden md:block">Play</span>
      <Play />
    </button>
  )
}

export default PlayButton