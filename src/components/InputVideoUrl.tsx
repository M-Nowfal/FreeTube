interface InputVideoUrlProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  handlePlay: () => void;
}

const InputVideoUrl = ({ inputUrl, setInputUrl, handlePlay }: InputVideoUrlProps) => {

  return (
    <div className="flex-1 font-semibold lg:text-lg">
      <input
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handlePlay()}
        type="search"
        className="w-full focus:outline-0 ps-2"
        placeholder="Place the URL here"
      />
    </div>
  )
}

export default InputVideoUrl