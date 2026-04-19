"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import { IPlaylist, IVideo } from "@/types/playlist";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { Play, ThumbsUp, MessageSquare, Share2 } from "lucide-react";
import { sharePlaylist } from "@/lib/share-playlist";

interface IVideoExtended extends IVideo {
  watched?: boolean;
  videoId: string;
}

interface IVideoStats {
  views: number;
  likes: number;
  commentsCount: number;
  description: string;
}

export default function SinglePlaylistPage() {
  const params = useParams();
  const videoId = useSearchParams().get("videoId");

  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<IVideoExtended | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const [videoStats, setVideoStats] = useState<Record<string, IVideoStats>>({});

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const extractVideoId = (thumbnailUrl: string) => {
    try {
      return thumbnailUrl.split("/vi/")[1].split("/")[0];
    } catch { return null; }
  };

  useEffect(() => {
    const fetchPlaylistAndStats = async () => {
      try {
        const { data } = await axios.get(`/api/playlists/${params.id}?t=${new Date().getTime()}`);
        setPlaylist(data.playlist);

        if (data.playlist.videos.length > 0) {
          const targetVideo = videoId
            ? data.playlist.videos.find((v: IVideoExtended) =>
              v.videoId === videoId || extractVideoId(v.thumbnail) === videoId
            )
            : null;

          handleVideoSelect(targetVideo || data.playlist.videos[0]);

          const idsToFetch = data.playlist.videos
            .map((v: IVideoExtended) => v.videoId || extractVideoId(v.thumbnail))
            .filter(Boolean);

          const commaSeparatedIds = idsToFetch.slice(0, 50).join(",");

          if (commaSeparatedIds) {
            const statsRes = await axios.get(`/api/youtube/bulk?ids=${commaSeparatedIds}`);
            setVideoStats(statsRes.data.stats);
          }
        }
      } catch {
        toast.error("Failed to load playlist");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchPlaylistAndStats();
  }, [params.id, videoId]);

  const handleVideoSelect = async (video: IVideoExtended) => {
    setCurrentVideo(video);
    setShowFullDesc(false);

    // Auto-scroll to top so user sees the new video playing
    window.scrollTo({ top: 0, behavior: "smooth" });

    const actualVideoId = video.videoId || extractVideoId(video.thumbnail);

    if (!video.watched && actualVideoId) {
      setPlaylist(prev => {
        if (!prev) return prev;
        const updatedVideos = prev.videos.map(v => {
          const vId = v.videoId || extractVideoId(v.thumbnail);
          return vId === actualVideoId ? { ...v, watched: true } : v;
        });
        return { ...prev, videos: updatedVideos };
      });

      try {
        await axios.patch(`/api/playlists/${params.id}`, {
          action: "MARK_WATCHED",
          videoId: actualVideoId
        });
      } catch (error) {
        console.error("Failed to mark as watched");
      }
    }
  };

  const playNextVideo = () => {
    if (!playlist || !currentVideo) return;

    const currentVidId = currentVideo.videoId || extractVideoId(currentVideo.thumbnail);

    const currentIndex = playlist.videos.findIndex((v) => {
      const vId = v.videoId || extractVideoId(v.thumbnail);
      return vId === currentVidId;
    });

    if (currentIndex !== -1 && currentIndex + 1 < playlist.videos.length) {
      handleVideoSelect(playlist.videos[currentIndex + 1] as IVideoExtended);
    }
  };

  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info?.playerState === 0) {
          playNextVideo();
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    };

    window.addEventListener("message", handleYouTubeMessage);
    return () => window.removeEventListener("message", handleYouTubeMessage);
  }, [playlist, currentVideo]);

  const renderDescription = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader size={50} /></div>;
  if (!playlist) return <div className="p-6 text-center text-muted-foreground">Playlist not found.</div>;

  const currentVideoId = currentVideo?.videoId || (currentVideo ? extractVideoId(currentVideo.thumbnail) : null);

  const currentStats = currentVideoId ? videoStats[currentVideoId] : null;
  const displayViews = currentStats?.views ?? 0;
  const displayLikes = currentStats?.likes ?? 0;
  const displayComments = currentStats?.commentsCount ?? 0;
  const displayDescription = currentStats?.description ?? "";

  return (
    <div className="w-full sm:p-1 sm:px-6 lg:px-8">

      <div className="flex flex-col lg:flex-row gap-6 w-full">

        <div className="lg:w-[70%] lg:sticky lg:top-6 h-fit space-y-4">

          <div className="sticky top-0 z-10 sm:relative w-full aspect-video bg-black sm:rounded-lg overflow-hidden">
            {currentVideoId ? (
              <iframe
                ref={iframeRef}
                key={currentVideoId}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1`}
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
                }}
              ></iframe>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Video unavailable</div>
            )}
          </div>

          {currentVideo && (
            <div className="space-y-4 px-3 overflow-hidden">
              <h1 className="text-xl md:text-2xl font-bold wrap-break-word">{currentVideo.title}</h1>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold text-foreground/80">
                  {playlist.channelTitle}
                </p>

                <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full text-sm font-medium">
                  <span className="flex items-center gap-1.5 border-r border-border pr-3">
                    <ThumbsUp className="h-4 w-4" /> {displayLikes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" /> {displayComments.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-secondary/40 p-4 rounded-xl text-sm overflow-hidden">
                <p className="font-semibold mb-2">
                  {displayViews.toLocaleString()} views
                </p>
                <div className={`whitespace-pre-wrap wrap-break-word leading-relaxed ${showFullDesc ? "" : "line-clamp-3"}`}>
                  {displayDescription ? renderDescription(displayDescription) : "No description available."}
                </div>
                {displayDescription && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="font-bold mt-2 hover:underline"
                  >
                    {showFullDesc ? "Show less" : "...more"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-[30%] flex flex-col max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-5rem)] lg:min-w-75 p-2">
          <div className="border border-border rounded-xl flex flex-col h-full bg-card overflow-hidden">

            <div className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between shrink-0">
              <div className="overflow-hidden">
                <h2 className="text-lg font-bold line-clamp-1">{playlist.channelTitle} Playlist</h2>
                <p className="text-xs text-muted-foreground">
                  {playlist.videos.length} videos
                </p>
              </div>
              <Button variant="outline" size="icon" title="Share entire playlist" className="shrink-0 ml-2" onClick={() => sharePlaylist(playlist.channelTitle, params.id as string)}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hidden p-2 space-y-2">
              {playlist.videos.map((video: IVideoExtended, idx) => {
                const vidId = video.videoId || extractVideoId(video.thumbnail);
                const isPlaying = currentVideoId === vidId;

                return (
                  <div
                    key={idx}
                    onClick={() => handleVideoSelect(video)}
                    className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all group relative ${isPlaying ? "bg-secondary" : "hover:bg-muted"
                      }`}
                  >
                    <div className="relative w-32 aspect-video rounded-md overflow-hidden shrink-0 bg-black">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className={`object-cover ${isPlaying ? "opacity-60" : ""}`}
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white drop-shadow-md" fill="currentColor" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-start overflow-hidden w-full pr-10">
                      <h3 className={`font-medium text-sm line-clamp-2 wrap-break-word ${isPlaying ? "text-primary" : ""}`}>
                        {video.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}