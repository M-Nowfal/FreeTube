import { getVideoId } from "../lib";

interface HistoryProps {
  history: Array<{ url: string; title: string }>;
  removeHistory: (id: number) => void;
  clearHistory: () => void;
  handlePlay: (url: string) => void;
  theme: "dark" | "light";
}

const History = ({ history, removeHistory, clearHistory, handlePlay, theme }: HistoryProps) => {
  return (
    <div
      className={`
        border p-3 pt-0 rounded-lg w-[90%] max-w-7xl xl:max-w-xl max-h-[50vh] xl:max-h-[84.5vh] overflow-auto
        ${theme === "dark" ? "border-slate-800" : "border-gray-300"}
        flex flex-col gap-3 hide-scrollbar relative
      `}
    >
      <div className={`sticky top-0 ${theme === "light" ? "bg-white/80" : "bg-black"} w-full py-2 z-10`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold ps-2">History</h2>
          <button
            className={`bg-black rounded-lg px-2 py-1 text-white flex items-center gap-2 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
            onClick={clearHistory}
          >
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
            Clear
          </button>
        </div>
      </div>

      {history.map((item, i) => {
        const id = getVideoId(item.url);
        const thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

        return (
          <div 
            key={i} 
            className={`flex items-center gap-5 relative ${theme === "light" ? "bg-gray-100 hover:bg-gray-200" : "bg-neutral-900 hover:bg-neutral-800"} rounded-lg p-0.5 group transition-all`}
            onClick={() => handlePlay(item.url)}
          >
            <img src={thumbnail} className="w-30 sm:w-50 aspect-video rounded-md" />
            <button
              className={`md:hidden group-hover:block absolute right-1.5 top-1.5 rounded-full p-1 cursor-pointer ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all`}
              onClick={(e) => {
                e.stopPropagation();
                removeHistory(i);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" role="img" aria-labelledby="xTitle">
                <title id="xTitle">Close</title>
                <line x1="4" y1="4" x2="20" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} strokeWidth="4" strokeLinecap="round" />
                <line x1="20" y1="4" x2="4" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} strokeWidth="4" strokeLinecap="round" />
              </svg>
            </button>
            <p className="text-sm lg:text-md font-medium line-clamp-3">{item.title}</p>
          </div>
        );
      })}
    </div>
  )
}

export default History