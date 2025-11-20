import { Play, Plus } from "./Icons"
import { useContext } from "react"
import { ThemeContext } from "../context/ThemeProvider"

const PlayButton = ({ handlePlay, lock }: { handlePlay: () => void, lock: boolean }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <button
      className={`bg-black lg:text-lg rounded-lg px-3 text-white flex items-center gap-2 py-1.5 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
      onClick={() => handlePlay()}
    >
      <span className="hidden md:block">
        {lock ? "Add" : "Play"}
      </span>
      {lock ? <Plus /> : <Play />}
    </button>
  )
}

export default PlayButton