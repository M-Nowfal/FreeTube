import { X } from "./Icons";

interface InputVideoUrlProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  handlePlay: () => void;
  theme: "light" | "dark";
}

const InputVideoUrl = ({ inputUrl, setInputUrl, handlePlay, theme }: InputVideoUrlProps) => {

  return (
    <div className="flex-1 flex items-center gap-3 font-semibold lg:text-lg">
      <input
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handlePlay()}
        type="text"
        className="w-full focus:outline-0 ps-2"
        placeholder="Place the URL here"
      />
      {inputUrl && <button
        className="cursor-pointer"
        onClick={() => setInputUrl("")}
      >
        <X theme={theme === "light" ? "dark" : "light"} />
      </button>}
    </div>
  )
}

export default InputVideoUrl