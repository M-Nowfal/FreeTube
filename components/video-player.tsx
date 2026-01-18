"use client";

import { useVideoUrlStore } from "@/store/useVideoUrlStore";
import { JSX, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Play, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function VideoPlayer(): JSX.Element {
  const { videourl, setVideoUrl } = useVideoUrlStore();
  const [input, setInput] = useState<string>("");

  return (
    <div className="w-full max-w-6xl grid gap-3 p-1 border rounded-lg">
      <div className="
              w-full
              max-w-6xl 
              m-auto
              border border-input
              rounded-lg
              flex items-center
              transition
              focus-within:ring-2
              focus-within:ring-ring
              focus-within:ring-offset-2
              focus-within:ring-offset-background
            ">
        <Input
          placeholder="Place the URL here"
          type="search"
          className="border-none shadow-none rounded-l-lg py-5 focus-visible:ring-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) setVideoUrl(input);
          }}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" className="rounded-l-none py-5" onClick={() => input.trim() && setVideoUrl(input)}>
              <Play /> Play
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="relative">
        {videourl ? (
          <>
            <iframe
              src={videourl || undefined}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              className="rounded-lg aspect-video"
              allowFullScreen
            />
            <Button
              size="icon"
              className="absolute top-0.5 right-0.5 rounded-full size-5"
              onClick={() => setVideoUrl(null)}
            >
              <X className="text-accent" strokeWidth={3} />
            </Button>
          </>
        ) : (
          <div className="aspect-video flex items-center justify-center">
            <p className="text-muted-foreground">Enter the valid youtube video URL.</p>
          </div>
        )}
      </div>
    </div>
  );
}
