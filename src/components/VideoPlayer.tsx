import { useEffect, useState, type JSX } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  theme: "light" | "dark";
  setVideoUrl: (url: string) => void;
}

const VideoPlayer = ({ videoUrl, theme, setVideoUrl }: VideoPlayerProps): JSX.Element => {
  const [message, setMessage] = useState<string>("No video URL provided.");
  const [finalUrl, setFinalUrl] = useState<string>("");
  const baseUrl = "https://www.youtube.com/embed/";

  useEffect(() => {
    try {
      if (videoUrl.startsWith("https://youtu.be/")) {
        setFinalUrl(baseUrl + videoUrl.split(".be/")[1]);
      } else if (videoUrl.startsWith("https://youtube.com/shorts")) {
        setFinalUrl(baseUrl + videoUrl.split("/shorts/")[1]);
      } else if (videoUrl.startsWith("<iframe")) {
        setFinalUrl(baseUrl + videoUrl.split("/embed/")[1]?.split('"')[0]);
      } else if (videoUrl.startsWith("https://www.youtube.com/watch?v=")) {
        setFinalUrl(baseUrl + videoUrl.split("v=")[1]?.split("&")[0]);
      } else {
        if (videoUrl !== "") throw new Error();
        setMessage("No video URL provided.");
        setFinalUrl("");
      }
    } catch {
      setMessage("Invalid or unsupported video URL.");
      setFinalUrl("");
    }
  }, [videoUrl]);

  return (
    <div className="w-full">
      {finalUrl ? (
        <div className="relative">
          <button
            className={`absolute right-0 -top-2 rounded-full p-1 cursor-pointer ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all`}
            onClick={() => setVideoUrl("")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" role="img" aria-labelledby="xTitle">
              <title id="xTitle">Close</title>
              <line x1="4" y1="4" x2="20" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} strokeWidth="4" strokeLinecap="round" />
              <line x1="20" y1="4" x2="4" y2="20" stroke={theme === "dark" ? "#000" : "#fff"} strokeWidth="4" strokeLinecap="round" />
            </svg>
          </button>
          <iframe
            key={videoUrl}
            src={finalUrl}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-inherit flex justify-center items-center text-gray-500">
          {message}
        </div>
      )}
    </div>
  )
}

export default VideoPlayer