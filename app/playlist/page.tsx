"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getYouTubeVideoId } from "@/utils/helper";
import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import { PlaySquare, Plus, Trash2, RefreshCw, Share2 } from "lucide-react";
import axios, { AxiosError } from "axios";
import { IPlaylist, IVideo } from "@/types/playlist";
import { API_URL } from "@/utils/constants";
import Link from "next/link";
import { Alert } from "@/components/others/alert";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { sharePlaylist } from "@/lib/share-playlist";

export default function PlaylistPage() {
  const { isAuth, loading: authLoading } = useAuth();
  const { user } = useUserStore();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [fetchingPlaylists, setFetchingPlaylists] = useState(true);

  const [timeframe, setTimeframe] = useState("1d");
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !authLoading) {
      toast.info("Login to access channels.");
      router.replace("/auth/login");
      return;
    }
  }, [authLoading, isAuth, router]);

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
      const videoId = getYouTubeVideoId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      const { data: ytData } = await axios.get(`/api/youtube/${videoId}`);
      const details = ytData.video_details;

      const newVideo: IVideo = {
        videoId: videoId,
        title: details.title,
        thumbnail: details.thumbnails?.maxres?.url || details.thumbnails?.high?.url || "",
        channelTitle: details.channelTitle,
        publishedAt: details.publishedAt || new Date().toISOString()
      };

      await axios.post("/api/playlists", {
        username: user.username,
        channelTitle: details.channelTitle,
        video: newVideo,
      });

      toast.success("Video added to playlist!");
      setUrl("");
      fetchPlaylists();
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data.message : "Failed to add video");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSync = async () => {
    if (!user?.username) return toast.error("Please log in first");

    setSyncing(true);
    try {
      const { data } = await axios.post("/api/sync", {
        username: user.username,
        timeframe: timeframe
      });
      toast.success(data.message);
      fetchPlaylists();
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data?.message || "Sync failed" : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Playlists</h1>
          <p className="text-muted-foreground mt-1">
            Manage your collections or sync latest videos from your subscriptions.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 bg-card border rounded-xl p-5 shadow-sm">
          <form onSubmit={handleAddVideo} className="flex gap-3 flex-1">
            <Input
              placeholder="Paste YouTube Video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={loading || syncing}
            />
            <Button type="submit" disabled={loading || syncing}>
              {loading ? <Loader className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              Add URL
            </Button>
          </form>

          <div className="hidden md:block w-px bg-border my-2"></div>

          <div className="flex gap-3 items-center">
            <Select value={timeframe} onValueChange={setTimeframe} disabled={syncing || loading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1 Hour</SelectItem>
                <SelectItem value="1d">Last 1 Day</SelectItem>
                <SelectItem value="1w">Last 1 Week</SelectItem>
                <SelectItem value="1m">Last 1 Month</SelectItem>
                <SelectItem value="1y">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={handleSync} disabled={syncing || loading}>
              {syncing ? <Loader className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sync Subs
            </Button>
          </div>
        </div>
      </div>

      {fetchingPlaylists ? (
        <div className="flex justify-center h-[50vh] items-center p-12"><Loader size={50} /></div>
      ) : playlists.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No playlists yet. Add a video or sync your subscriptions to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((playlist, idx) => {
            const latestVideo = playlist.videos[playlist.videos.length - 1];
            const playlistId = (playlist as any)._id;

            return (
              <div key={idx} className="group relative">
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

                <div className="absolute top-2 right-12 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 hover:text-sky-600 shadow-sm"
                    title="Share entire playlist"
                    onClick={() => sharePlaylist(playlist.channelTitle, playlistId)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
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