import { useContext, useRef } from "react";
import { X } from "./Icons";
import { ThemeContext } from "../context/ThemeProvider";

interface InputVideoUrlProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  handlePlay: () => void;
}

const InputVideoUrl = ({ inputUrl, setInputUrl, handlePlay }: InputVideoUrlProps) => {
  const { theme } = useContext(ThemeContext);
  const inp = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 flex items-center gap-3 font-semibold lg:text-lg">
      <input
        ref={inp}
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handlePlay()}
        type="text"
        className="w-full focus:outline-0 ps-2"
        placeholder="Place the URL here"
      />
      {inputUrl && <button
        className="cursor-pointer"
        onClick={() => {
          setInputUrl("");
          inp.current?.focus();
        }}
      >
        <X theme={theme === "light" ? "dark" : "light"} />
      </button>}
    </div>
  )
}

export default InputVideoUrl