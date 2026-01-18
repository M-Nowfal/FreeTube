import { JSX } from "react";
import { VideoPlayer } from "../video-player";

export function Home(): JSX.Element {
  return (
    <div className="w-[98%] m-auto mt-12 flex justify-center items-center h-[80vh]">
      <VideoPlayer />
    </div>
  );
}