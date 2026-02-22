"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { IPlaylist, IVideo } from "@/types/playlist";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { Play, ThumbsUp, MessageSquare, Trash2, CheckCircle } from "lucide-react";
import { Alert } from "@/components/others/alert";

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
  const router = useRouter();
  
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<IVideoExtended | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  
  const [videoStats, setVideoStats] = useState<Record<string, IVideoStats>>({});

  const extractVideoId = (thumbnailUrl: string) => {
    try {
      return thumbnailUrl.split("/vi/")[1].split("/")[0];
    } catch { return null; }
  };

  useEffect(() => {
    const fetchPlaylistAndStats = async () => {
      try {
        const { data } = await axios.get(`/api/playlists/${params.id}`);
        setPlaylist(data.playlist);
        
        if (data.playlist.videos.length > 0) {
          handleVideoSelect(data.playlist.videos[0]);

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
  }, [params.id]);

  const handleVideoSelect = async (video: IVideoExtended) => {
    setCurrentVideo(video);
    setShowFullDesc(false);

    if (!video.watched) {
      try {
        await axios.patch(`/api/playlists/${params.id}`, {
          action: "MARK_WATCHED",
          videoTitle: video.title
        });
        
        setPlaylist(prev => {
          if (!prev) return prev;
          const updatedVideos = prev.videos.map(v => 
            v.title === video.title ? { ...v, watched: true } : v
          );
          return { ...prev, videos: updatedVideos };
        });
      } catch (error) {
        console.error("Failed to mark as watched");
      }
    }
  };

  const handleRemoveVideo = async (videoTitle: string) => {
    try {
      await axios.patch(`/api/playlists/${params.id}`, {
        action: "REMOVE_VIDEO",
        videoTitle
      });
      
      setPlaylist(prev => {
        if (!prev) return prev;
        const newVideos = prev.videos.filter(v => v.title !== videoTitle);
        return { ...prev, videos: newVideos };
      });
      toast.success("Video removed");
    } catch (error) {
      toast.error("Failed to remove video");
    }
  };

  const handleDeletePlaylist = async () => {
    try {
      await axios.delete(`/api/playlists/${params.id}`);
      toast.success("Playlist deleted");
      router.replace("/playlist");
    } catch (error) {
      toast.error("Failed to delete playlist");
    }
  };

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
            // FIX 1: Added break-all so long links wrap instead of pushing screen out
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
          
          <div className="sticky top-0 z-10 sm:relative w-full aspect-video bg-black sm:rounded-lg overflow-hidden border border-border">
            {currentVideoId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
                {/* FIX 2: Added break-words to guarantee text stays inside its box */}
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

        {/* FIX 3: Changed min-w-75 to lg:min-w-75 so mobile doesn't inherit a forced fixed width */}
        <div className="lg:w-[30%] flex flex-col max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-5rem)] lg:min-w-75 p-2">
          <div className="border border-border rounded-xl flex flex-col h-full bg-card overflow-hidden">
            
            <div className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between shrink-0">
              <div className="overflow-hidden">
                <h2 className="text-lg font-bold line-clamp-1">{playlist.channelTitle} Playlist</h2>
                <p className="text-xs text-muted-foreground">
                  {playlist.videos.length} videos
                </p>
              </div>
              <Alert 
                title="Delete Playlist"
                description="Are you sure you want to delete this entire playlist? This action cannot be undone."
                onContinue={handleDeletePlaylist}
                trigger={
                  <Button variant="outline" size="icon" title="Delete entire playlist" className="shrink-0 ml-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-hidden p-2 space-y-2">
              {playlist.videos.map((video: IVideoExtended, idx) => {
                const isPlaying = currentVideo?.title === video.title;
                
                return (
                  <div
                    key={idx}
                    onClick={() => handleVideoSelect(video)}
                    className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all group relative ${
                      isPlaying ? "bg-secondary" : "hover:bg-muted"
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
                      {video.watched && !isPlaying && (
                        <div className="absolute bottom-1 right-1">
                          <CheckCircle className="h-4 w-4 text-green-500 bg-black/50 rounded-full" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-start overflow-hidden w-full pr-10">
                      <h3 className={`font-medium text-sm line-clamp-2 wrap-break-word ${isPlaying ? "text-primary" : ""}`}>
                        {video.title}
                      </h3>
                    </div>

                    <Alert 
                      title="Remove Video"
                      description="Are you sure you want to remove this video from the playlist?"
                      onContinue={() => handleRemoveVideo(video.title)}
                      trigger={
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-secondary border border-border text-foreground rounded-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                          title="Remove video"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      }
                    />
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