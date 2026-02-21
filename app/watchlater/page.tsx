"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { getYouTubeVideoId } from "@/utils/helper";
import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import { PlaySquare, Plus, Trash2, CheckCircle, X, Play } from "lucide-react";
import axios, { AxiosError } from "axios";
import { Alert } from "@/components/others/alert";

interface IWatchLaterVideo {
  _id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  watched: boolean;
}

export default function WatchLaterPage() {
  const { user } = useUserStore();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<IWatchLaterVideo[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState(true);
  
  // State to handle inline video playing
  const [playingVideo, setPlayingVideo] = useState<IWatchLaterVideo | null>(null);

  useEffect(() => {
    if (user?.username) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data } = await axios.get(`/api/watch-later?username=${user?.username}`);
      setVideos(data.videos);
    } catch (error) {
      toast.error("Failed to load Watch Later videos");
    } finally {
      setFetchingVideos(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return toast.error("Please enter a YouTube URL");
    if (!user?.username) return toast.error("Please log in first");

    setLoading(true);
    try {
      const videoId = getYouTubeVideoId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      // Fetch details from your existing YouTube route
      const { data: ytData } = await axios.get(`/api/youtube/${videoId}`);
      const details = ytData.video_details;

      const payload = {
        username: user.username,
        videoId,
        title: details.title,
        thumbnail: details.thumbnails?.maxres?.url || details.thumbnails?.high?.url || "",
        channelTitle: details.channelTitle,
      };

      const { data } = await axios.post("/api/watch-later", payload);
      
      setVideos([data.video, ...videos]); // Add to top of list
      toast.success("Added to Watch Later!");
      setUrl("");
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data?.message : "Failed to add video");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = async (video: IWatchLaterVideo) => {
    setPlayingVideo(video);
    
    // Mark as watched in DB if it isn't already
    if (!video.watched) {
      try {
        await axios.patch(`/api/watch-later/${video._id}`);
        setVideos(prev => prev.map(v => v._id === video._id ? { ...v, watched: true } : v));
      } catch (error) {
        console.error("Failed to mark as watched");
      }
    }
  };

  const handleRemoveVideo = async (id: string) => {
    try {
      await axios.delete(`/api/watch-later/${id}`);
      setVideos(prev => prev.filter(v => v._id !== id));
      if (playingVideo?._id === id) setPlayingVideo(null); // Close player if deleting currently playing video
      toast.success("Removed from Watch Later");
    } catch (error) {
      toast.error("Failed to remove video");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-8">
      
      {/* Header & Input */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Important</h1>
        <p className="text-muted-foreground">Save important videos here to watch them when you have time.</p>
        
        <form onSubmit={handleAddVideo} className="flex gap-4 max-w-2xl">
          <Input
            placeholder="Paste YouTube Video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </form>
      </div>

      {/* Inline Video Player (Shows when a video is clicked) */}
      {playingVideo && (
        <div className="relative w-full max-w-5xl mx-auto bg-black rounded-xl shadow-lg border border-border mt-8">
          <div className="absolute -top-2 -right-2 z-10 bg-primary/80 rounded-full">
            <button onClick={() => setPlayingVideo(null)} className="cursor-pointer p-1 flex text-primary-foreground">
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full rounded-t-lg"
              src={`https://www.youtube.com/embed/${playingVideo.videoId}?autoplay=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="p-4 bg-card text-card-foreground rounded-b-lg">
            <h2 className="text-xl font-bold">{playingVideo.title}</h2>
            <p className="text-muted-foreground text-sm">{playingVideo.channelTitle}</p>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {fetchingVideos ? (
        <div className="flex justify-center h-[60vh] items-center"><Loader size={50} /></div>
      ) : videos.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          Your Important list is empty. Add a video to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
          {videos.map((video) => (
            <div key={video._id} className="group relative flex flex-col gap-3">
              
              {/* Delete Button */}
              <div className="absolute top-2 right-2 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <Alert 
                  title="Remove Video"
                  description="Remove this video from your Watch Later list?"
                  onContinue={() => handleRemoveVideo(video._id)}
                  trigger={
                    <Button size="icon" variant="secondary" className="h-8 w-8 hover:text-destructive shadow-sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>

              {/* Thumbnail Container (Clickable) */}
              <div 
                className="relative aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer"
                onClick={() => handlePlayVideo(video)}
              >
                {video.thumbnail ? (
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className={`object-cover transition-transform duration-300 group-hover:scale-105 ${video.watched ? "opacity-60" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <PlaySquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Watched Badge */}
                {video.watched && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-green-400 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1.5 backdrop-blur-sm border border-green-500/20">
                    <CheckCircle className="h-3 w-3" />
                    Watched
                  </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Play className="h-10 w-10 drop-shadow-md text-white" fill="currentColor" />
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col pr-2">
                <h3 
                  className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors wrap-break-word"
                  onClick={() => handlePlayVideo(video)}
                >
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {video.channelTitle}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}