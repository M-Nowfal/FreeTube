interface VideoPlayerProps {
  videoUrl: string;
  theme: "light" | "dark";
  setVideoUrl: (url: string) => void;
}

const VideoPlayer = ({ videoUrl, theme, setVideoUrl }: VideoPlayerProps) => {
  const isValidUrl = /^https?:\/\/.+/i.test(videoUrl);
  const baseUrl = "https://www.youtube.com/embed/";

  return (
    <div className="w-full">
      {isValidUrl ? (
        <div className="relative">
          <button
            className={`absolute right-0 -top-2 rounded-full p-1 cursor-pointer ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all`}
            onClick={() => setVideoUrl("")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" role="img" aria-labelledby="xTitle">
              <title id="xTitle">Close</title>
              <line x1="4" y1="4" x2="20" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} stroke-width="4" stroke-linecap="round" />
              <line x1="20" y1="4" x2="4" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} stroke-width="4" stroke-linecap="round" />
            </svg>
          </button>
          <iframe
            key={videoUrl}
            src={baseUrl + videoUrl.split(".be/")[1]}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-inherit flex justify-center items-center text-gray-500">
          No video URL provided.
        </div>
      )}
    </div>
  )
}

export default VideoPlayer