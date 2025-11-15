import { useEffect, useState, type JSX } from "react";
import { toEmbedUrl } from "../lib";

interface VideoPlayerProps {
  videoUrl: string;
  theme: "light" | "dark";
  setVideoUrl: (url: string) => void;
}

const VideoPlayer = ({ videoUrl, theme, setVideoUrl }: VideoPlayerProps): JSX.Element => {
  const [message, setMessage] = useState<string>("No video URL provided.");
  const [finalUrl, setFinalUrl] = useState<string>("");

  useEffect(() => {
    try {
      const embedUrl = toEmbedUrl(videoUrl);
      if (!embedUrl) {
        setMessage("No video URL provided.");
        setFinalUrl("");
      }
      setFinalUrl(embedUrl);
    } catch {
      setMessage("Invalid or unsupported video URL.");
      setFinalUrl("");
    }
  }, [videoUrl]);

  return (
    <div className="w-full">
      {finalUrl ? (
        <div className="relative group">
          <button
            className={`md:hidden group-hover:block absolute -right-1.5 -top-2 rounded-full p-1 cursor-pointer ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all`}
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