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
import { useUserStore } from "@/store/useUserStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { useSubscriptionsStore } from "@/store/useSubscriptionsStore";
import Image from "next/image";
import { PlaySquare, Plus, Trash2, RefreshCw, Share2 } from "lucide-react";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { Alert } from "@/components/others/alert";
import { useRouter } from "next/navigation";
import { sharePlaylist } from "@/lib/share-playlist";

export default function PlaylistPage() {
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();
  const {
    cache,
    loading,
    fetchPlaylists,
    addNewPlaylist,
    deletePlaylist,
  } = usePlaylistStore();
  const { fetchSubscriptions } = useSubscriptionsStore();

  const [url, setUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [timeframe, setTimeframe] = useState("1d");
  const [syncing, setSyncing] = useState(false);

  const router = useRouter();

  const playlists = cache?.playlists || [];
  const lastSynced = cache?.lastSynced || null;
  const customPlaylists = playlists.filter((p: any) => p.isCustom);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuth && !authLoading && authInitialized && user?.username) {
      fetchPlaylists(user.username);
    }
  }, [isAuth, authLoading, authInitialized, user?.username]);

  const isLoading = loading;

  const extractVideoId = (urlStr: string) => {
    if (urlStr.includes("youtu.be/")) {
      return urlStr.split("youtu.be/")[1]?.split("?")[0];
    }
    if (urlStr.includes("v=")) {
      return urlStr.split("v=")[1]?.split("&")[0];
    }
    return null;
  };

  const handleAddVideo = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!url.trim()) return toast.error("Please enter a YouTube URL");
    if (!user?.username) return toast.error("Please log in first");

    const videoId = extractVideoId(url);
    if (!videoId) return toast.error("Invalid YouTube URL");

    setAddLoading(true);
    try {
      let videoData: any = {};

      try {
        // Fetch video metadata from YouTube
        const metaRes = await axios.get(`/api/youtube/${videoId}`);
        const details = metaRes.data.video_details;

        if (details) {
          const thumbnails = details.thumbnails;
          videoData = {
            title: details.title,
            thumbnail: thumbnails?.medium?.url || thumbnails?.default?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            channelTitle: details.channelTitle,
            publishedAt: details.publishedAt,
          };
        }
      } catch (ytError) {
        console.error("YouTube API error, using fallback:", ytError);
      }

      // Use fallback if no data from API
      if (!videoData.title) {
        videoData = {
          title: `Video ${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          channelTitle: "Unknown",
          publishedAt: new Date().toISOString(),
        };
      }

      const video = {
        videoId,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        channelTitle: videoData.channelTitle,
        publishedAt: videoData.publishedAt,
      };

      // Determine channelTitle and isCustom:
      // - If selected existing custom playlist -> use that, isCustom = true
      // - If entered new name -> use new name, isCustom = true
      // - If ONLY URL entered -> use video's channelTitle, isCustom = false
      let channelToUse: string;
      let isCustom = false;

      if (selectedPlaylist) {
        channelToUse = selectedPlaylist;
        const existing = playlists.find((p: any) => p.channelTitle === selectedPlaylist);
        isCustom = (existing as any)?.isCustom ?? true;
      } else if (newPlaylistName.trim()) {
        channelToUse = newPlaylistName.trim();
        isCustom = true;
      } else {
        // Use video's channel title (creates playlist by channel)
        channelToUse = videoData.channelTitle;
        isCustom = false;
      }

      // Add to playlist via correct endpoint
      const { data } = await axios.post("/api/playlists", {
        username: user.username,
        channelTitle: channelToUse,
        isCustom,
        video
      });

      if (data.playlist) {
        addNewPlaylist(data.playlist);
        toast.success(`Video added to ${channelToUse}`);
      }
      setUrl("");
      setSelectedPlaylist("");
      setNewPlaylistName("");
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        toast.error("Video already exists in this playlist");
      } else if (error instanceof AxiosError && error.response?.status === 404) {
        toast.error("Video not found on YouTube");
      } else {
        toast.error("Failed to add video");
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await axios.delete(`/api/playlists/${playlistId}`);
      deletePlaylist(playlistId);
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

      // Force refresh all data after successful sync
      fetchPlaylists(user.username, true);
      fetchSubscriptions(user.username, true);
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data?.message || "Sync failed" : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (!authInitialized) return null;

  if (!isAuth && !authLoading) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Your Playlists</h1>
            {lastSynced && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Last synced: {formatDate(lastSynced)}
              </span>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Manage your collections or sync latest videos from your subscriptions.
        </p>

        <div className="flex flex-col md:flex-row gap-6 bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex gap-2">
              <Input
                placeholder="Paste YouTube Video URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={addLoading || syncing}
              />
            </div>
            {/* --- Modified Section Start --- */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Select value={selectedPlaylist} onValueChange={(val) => {
                setSelectedPlaylist(val);
                setNewPlaylistName("");
              }} disabled={addLoading || syncing}>
                <SelectTrigger className="w-full sm:w-62.5">
                  <SelectValue placeholder="Select existing custom playlist..." />
                </SelectTrigger>
                <SelectContent>
                  {customPlaylists.map((p: any) => (
                    <SelectItem key={p._id} value={p.channelTitle}>
                      {p.channelTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 flex-1">
                <Input
                  placeholder="Or enter new playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => {
                    setNewPlaylistName(e.target.value);
                    setSelectedPlaylist("");
                  }}
                  disabled={addLoading || syncing}
                  className="flex-1"
                />
                <Button onClick={handleAddVideo} disabled={addLoading || syncing || !url.trim()}>
                  {addLoading ? <Loader className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add
                </Button>
              </div>
            </div>
            {/* --- Modified Section End --- */}
          </div>

          <div className="hidden md:block w-px bg-border my-2"></div>

          <div className="flex gap-3 items-center">
            <Select value={timeframe} onValueChange={setTimeframe} disabled={syncing || addLoading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last">From Last Video</SelectItem>
                <SelectItem value="1h">Past Hour</SelectItem>
                <SelectItem value="1d">Past Day</SelectItem>
                <SelectItem value="1w">Past Week</SelectItem>
                <SelectItem value="1m">Past Month</SelectItem>
                <SelectItem value="1y">Past Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={handleSync} disabled={syncing || addLoading}>
              {syncing ? <Loader className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sync Subs
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-[50vh] items-center p-12"><Loader size={50} /></div>
      ) : playlists.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No playlists yet. Add a video or sync your subscriptions to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((playlist, idx) => {
            const latestVideo = playlist.videos[playlist.videos.length - 1];
            const playlistId = playlist._id || '';
            const isCustom = (playlist as any).isCustom;

            if (playlist.videos.length === 0) {
              return null;
            }

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

                {isCustom && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Custom
                    </span>
                  </div>
                )}

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
                    </div>
                    <div>
                      <h3 className="font-medium line-clamp-2">{playlist.channelTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.videos.length} videos
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
