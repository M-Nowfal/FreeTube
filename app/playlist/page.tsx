"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { getYouTubeVideoId } from "@/utils/helper";
import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import { PlaySquare, Plus, Trash2 } from "lucide-react";
import axios, { AxiosError } from "axios";
import { IPlaylist, IVideo } from "@/types/playlist";
import { API_URL } from "@/utils/constants";
import Link from "next/link";
import { Alert } from "@/components/others/alert";

export default function PlaylistPage() {
  const { user } = useUserStore();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [fetchingPlaylists, setFetchingPlaylists] = useState(true);

  // Fetch playlists on mount
  useEffect(() => {
    if (user?.username) {
      fetchPlaylists();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/playlists?username=${user?.username}`);
      setPlaylists(data.playlists);
    } catch (error) {
      toast.error("Failed to load playlists");
    } finally {
      setFetchingPlaylists(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return toast.error("Please enter a YouTube URL");
    if (!user?.username) return toast.error("Please log in first");

    setLoading(true);
    try {
      // 1. Extract ID
      const videoId = getYouTubeVideoId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      // 2. Fetch video details from your existing YouTube API route
      // Assuming your GET route is at /api/youtube/[id]
      const { data: ytData } = await axios.get(`/api/youtube/${videoId}`);
      const details = ytData.video_details;

      // 3. Format the video data to match your IVideo interface
      const newVideo: IVideo = {
        videoId: videoId, // The ID you extracted from the URL
        title: details.title,
        thumbnail: details.thumbnails?.maxres?.url || details.thumbnails?.high?.url || "",
      };

      // 4. Save to Database
      await axios.post("/api/playlists", {
        username: user.username,
        channelTitle: details.channelTitle,
        video: newVideo,
      });

      toast.success("Video added to playlist!");
      setUrl("");
      fetchPlaylists(); // Refresh the list
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data.message : "Failed to add video");
    } finally {
      setLoading(false);
    }
  };

  // 5. Added Delete Handler
  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await axios.delete(`/api/playlists/${playlistId}`);
      setPlaylists((prev) => 
        prev.filter((p) => (p as IPlaylist & { _id: string })._id !== playlistId)
      );
      toast.success("Playlist deleted successfully");
    } catch (error) {
      toast.error("Failed to delete playlist");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Playlists</h1>
        <p className="text-muted-foreground">
          Enter a YouTube URL to automatically group it by channel.
        </p>

        {/* Input Section */}
        <form onSubmit={handleAddVideo} className="flex gap-4 max-w-2xl">
          <Input
            placeholder="Paste YouTube Video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Video
          </Button>
        </form>
      </div>

      {/* Playlists Grid */}
      {fetchingPlaylists ? (
        <div className="flex justify-center h-[50vh] items-center p-12"><Loader size={50} /></div>
      ) : playlists.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No playlists yet. Add a video to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((playlist, idx) => {
            // Get the thumbnail of the most recently added video in the playlist
            const latestVideo = playlist.videos[playlist.videos.length - 1];
            const playlistId = (playlist as any)._id;

            return (
              <div key={idx} className="group relative">
                {/* Delete Button (Visible on mobile, hover on desktop) */}
                <div className="absolute top-2 right-2 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Alert
                    title="Delete Playlist"
                    description="Are you sure you want to delete this entire playlist? This action cannot be undone."
                    onContinue={() => handleDeletePlaylist(playlistId)}
                    trigger={
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 hover:text-destructive shadow-sm"
                        title="Delete entire playlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>

                <Link href={`/playlist/${playlistId}`} className="block">
                  <div className="cursor-pointer flex flex-col gap-2">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                      {latestVideo?.thumbnail ? (
                        <Image
                          src={latestVideo.thumbnail}
                          alt={playlist.channelTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <PlaySquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* Playlist Overlay like YouTube */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <PlaySquare className="h-3 w-3" />
                        {playlist.videos.length} videos
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {playlist.channelTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        View full playlist
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}