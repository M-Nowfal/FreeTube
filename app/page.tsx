"use client";

import { useVideoUrlStore } from "@/store/useVideoUrlStore";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Page() {
  const { videourl, setVideoUrl } = useVideoUrlStore();
  const [input, setInput] = useState<string>("");
  return (
    <div className="w-[98%] m-auto mt-12 flex justify-center items-center h-[80vh]">
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
            type="text"
            className="border-none shadow-none rounded-l-lg py-5 focus-visible:ring-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) setVideoUrl(input);
            }}
          />
          {input.trim() && <X className="me-2" onClick={() => setInput("")} />}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" className="rounded-l-none py-5" onClick={() => input.trim() && setVideoUrl(input)}>
                <Play /> Play
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Play Video</p>
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
                className="absolute -top-1 -right-1 rounded-full size-5"
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
    </div>
  );
}
