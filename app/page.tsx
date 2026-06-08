"use client";

import { useVideoUrlStore, type PlaybackSpeed } from "@/store/useVideoUrlStore";
import { useUserStore } from "@/store/useUserStore";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Play, X, PlaySquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IVideo } from "@/types/playlist";
import { getYouTubeVideoId } from "@/utils/helper";
import Image from "next/image";

export default function Page() {
  const { videourl, setVideoUrl } = useVideoUrlStore();
  const { isAuth, authInitialized, user, initAuth: initUserAuth } = useUserStore();
  const [input, setInput] = useState<string>("");

  const [unwatchedVideos, setUnwatchedVideos] = useState<IVideo[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<IVideo | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(true);

  const { playbackSpeed, setPlaybackSpeed } = useVideoUrlStore();
  const speedOptions: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    initUserAuth();
  }, []);

  useEffect(() => {
    if (isAuth && user?.username) {
      fetchUnwatched();
    }
  }, [isAuth, user?.username]);

  const fetchUnwatched = async () => {
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/videos/unwatched?username=${user?.username}`);
      const data = await res.json();
      setUnwatchedVideos(data.videos || []);
    } catch {
      setUnwatchedVideos([]);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (iframeRef.current && playingVideo) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "setPlaybackRate",
            args: [playbackSpeed],
          }),
          "*"
        );
      }, 500);
    }
  }, [playbackSpeed, playingVideo]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info?.playerState === 0) {
          if (playingVideo && user?.username) {
            fetch("/api/videos/watch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: user.username,
                videoId: playingVideo.videoId,
              }),
            }).catch(() => { });
          }
        }
      } catch { }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [playingVideo?.videoId, user?.username]);

  const handleUrlPlay = async () => {
    if (!input.trim()) return;
    const videoId = getYouTubeVideoId(input);
    if (!videoId) {
      setVideoUrl(input);
      return;
    }
    let title = input;
    let channelTitle = "";
    try {
      const res = await fetch(`/api/youtube/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.video_details) {
          title = data.video_details.title;
          channelTitle = data.video_details.channelTitle;
        }
      }
    } catch {}
    const pseudoVideo: IVideo = {
      videoId,
      title,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      channelTitle,
    };
    setPlayingVideo(pseudoVideo);
    setShowUrlInput(false);
    setInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayVideo = (video: IVideo) => {
    setPlayingVideo(video);
    setShowUrlInput(false);

    setUnwatchedVideos((prev) => prev.filter((v) => v.videoId !== video.videoId));

    if (user?.username) {
      fetch("/api/videos/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          videoId: video.videoId,
        }),
      }).catch(() => { });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
    setShowUrlInput(true);
  };

  if (!authInitialized) return null;

  const hasFeedContent = !feedLoading && unwatchedVideos.length > 0;

  const renderPlayerContent = () => (
    <>
      <div className="relative aspect-video w-full">
        <button
          onClick={handleClosePlayer}
          className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
          title="Close player"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute top-2 left-2 z-10">
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(value) => setPlaybackSpeed(parseFloat(value) as PlaybackSpeed)}
          >
            <SelectTrigger className="w-20 h-8 bg-black/50 text-white border-white/20 hover:bg-black/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {speedOptions.map((speed) => (
                <SelectItem key={speed} value={speed.toString()}>
                  {speed}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <iframe
          ref={iframeRef}
          key={playingVideo?.videoId}
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${playingVideo?.videoId}?autoplay=1&enablejsapi=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setTimeout(() => {
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: "listening" }),
                "*"
              );
            }, 500);
            setTimeout(() => {
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({
                  event: "command",
                  func: "setPlaybackRate",
                  args: [playbackSpeed],
                }),
                "*"
              );
            }, 1000);
          }}
        />
      </div>
      {playingVideo?.title && (
        <div className="px-4 py-2 bg-card text-card-foreground sm:rounded-b-lg">
          <h2 className="text-base font-bold line-clamp-1">{playingVideo.title}</h2>
          {playingVideo.channelTitle && (
            <p className="text-xs text-muted-foreground">{playingVideo.channelTitle}</p>
          )}
        </div>
      )}
    </>
  );

  if (!isAuth) {
    return (
      <div className="w-[98%] m-auto mt-12 flex justify-center items-center h-[80vh]">
        <div className="w-full max-w-6xl grid gap-3 p-1 border rounded-lg">
          <div className="w-full max-w-6xl m-auto border border-input rounded-lg flex items-center transition focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <div className="flex-1 relative">
              <Input
                placeholder="Place the URL here"
                type="text"
                className="border-none shadow-none rounded-l-lg py-5 pe-10 focus-visible:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) setVideoUrl(input);
                }}
              />
              {input.trim() && <X className="me-2 absolute right-0 top-2 cursor-pointer" onClick={() => setInput("")} />}
            </div>
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

  return (
    <div className={`mx-auto ${!hasFeedContent ? "mt-40 md:mt-5" : ""} space-y-4 pb-10`}>
      {showUrlInput ? (
        <div className="w-[98%] mt-6 max-w-6xl mx-auto border border-input rounded-lg flex items-center transition focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <div className="flex-1 relative">
            <Button 
              size="icon-sm" 
              className="z-10 rounded-full size-5 absolute -top-3"
              onClick={() => setShowUrlInput(false)}
            >
              <X strokeWidth={3} className="size-3" />
            </Button>
            <Input
              placeholder="Place the URL here"
              type="text"
              className="border-none shadow-none rounded-l-lg py-4 pe-10 focus-visible:ring-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) handleUrlPlay();
              }}
            />
            {input.trim() && <X className="me-2 absolute right-0 top-2 cursor-pointer" onClick={() => setInput("")} />}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" className="rounded-l-none py-4" onClick={handleUrlPlay}>
                <Play /> Play
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Play Video</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="fixed z-50 bottom-12 max-w-6xl mx-auto px-2 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowUrlInput(true)} className="text-xs">
            + URL
          </Button>
        </div>
      )}

      {playingVideo && hasFeedContent && (
        <div className="sticky top-0 z-50 sm:relative w-full max-w-6xl mx-auto bg-black sm:rounded-lg overflow-hidden shadow-lg">
          {renderPlayerContent()}
        </div>
      )}

      {playingVideo && !hasFeedContent && !feedLoading && (
        <div className="flex justify-center items-start sm:items-center min-h-[calc(100vh-8rem)] w-full px-4 mt-4 sm:mt-0">
          <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
            {renderPlayerContent()}
          </div>
        </div>
      )}

      {feedLoading && (
        <div className="flex justify-center py-20">
          <Loader size={40} />
        </div>
      )}

      {!feedLoading && !hasFeedContent && !playingVideo && (
        <div className="max-w-6xl mt-6 mx-auto text-center p-15 md:p-25 text-muted-foreground border border-dashed rounded-xl">
          <PlaySquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm mt-1">No unwatched videos from your subscriptions.</p>
        </div>
      )}

      {hasFeedContent && (
        <div className="max-w-6xl mx-auto space-y-4">
          {!playingVideo && (
            <h2 className="text-xl font-bold tracking-tight px-1">Unwatched Videos</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {unwatchedVideos.map((video, idx) => (
              <div
                key={`${video.videoId}-${idx}`}
                className="group cursor-pointer w-[98%] m-auto"
                onClick={() => handlePlayVideo(video)}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-2.5">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <PlaySquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all z-10">
                    <Play className="text-white h-10 w-10 drop-shadow-md" fill="currentColor" />
                  </div>
                </div>
                <h3 className="ms-2 font-semibold text-sm line-clamp-2 leading-tight mb-1" title={video.title}>
                  {video.title}
                </h3>
                <p className="ms-2 text-xs text-muted-foreground font-medium truncate">{video.channelTitle}</p>
                {video.publishedAt && (
                  <p className="ms-2 text-[11px] text-muted-foreground mt-0.5">
                    {new Date(video.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
