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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getYouTubeVideoId } from "@/utils/helper";
import { useUserStore } from "@/store/useUserStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import Image from "next/image";
import { PlaySquare, Plus, Trash2, RefreshCw, Share2, ListMusic, X, FolderPlus } from "lucide-react";
import axios, { AxiosError } from "axios";
import { IVideo } from "@/types/playlist";
import Link from "next/link";
import { Alert } from "@/components/others/alert";
import { useRouter } from "next/navigation";
import { sharePlaylist } from "@/lib/share-playlist";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PlaylistPage() {
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();
  const {
    cache,
    loading,
    fetchPlaylists,
    addNewPlaylist,
    deletePlaylist,
    invalidate,
    customCache,
    customLoading,
    fetchCustomPlaylists,
    createCustomPlaylist,
    deleteCustomPlaylist,
  } = usePlaylistStore();

  const [url, setUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [timeframe, setTimeframe] = useState("1d");
  const [syncing, setSyncing] = useState(false);

  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customPlaylistName, setCustomPlaylistName] = useState("");
  const [customVideoUrls, setCustomVideoUrls] = useState("");
  const [creatingCustom, setCreatingCustom] = useState(false);

  const router = useRouter();

  const playlists = cache?.playlists || [];
  const customPlaylists = customCache?.playlists || [];
  const lastSynced = cache?.lastSynced || null;

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user?.username) {
      if (!cache && !loading) {
        fetchPlaylists(user.username);
      }
      if (!customCache && !customLoading) {
        fetchCustomPlaylists(user.username);
      }
    }
  }, [user?.username]);

  if (!authInitialized) return null;

  if (!isAuth && !authLoading) {
    toast.info("Login to access channels.");
    router.replace("/auth/login");
    return null;
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return toast.error("Please enter a YouTube URL");
    if (!user?.username) return toast.error("Please log in first");

    setAddLoading(true);
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

      const { data } = await axios.post("/api/playlists", {
        username: user.username,
        channelTitle: details.channelTitle,
        video: newVideo,
      });

      addNewPlaylist(data.playlist);
      toast.success("Video added to playlist!");
      setUrl("");
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data.message : "Failed to add video");
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

  const handleDeleteCustomPlaylist = async (playlistId: string) => {
    try {
      await deleteCustomPlaylist(playlistId);
      toast.success("Custom playlist deleted successfully");
    } catch (error) {
      toast.error("Failed to delete custom playlist");
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
      fetchPlaylists(user.username);
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data?.message || "Sync failed" : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCustomPlaylist = async () => {
    if (!customPlaylistName.trim()) return toast.error("Please enter a playlist name");
    if (!customVideoUrls.trim()) return toast.error("Please enter at least one YouTube URL");
    if (!user?.username) return toast.error("Please log in first");

    const urls = customVideoUrls
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) return toast.error("No valid URLs found");

    setCreatingCustom(true);
    try {
      await createCustomPlaylist({
        username: user.username,
        playlistName: customPlaylistName.trim(),
        videoUrls: urls,
      });
      toast.success("Custom playlist created successfully!");
      setShowCustomDialog(false);
      setCustomPlaylistName("");
      setCustomVideoUrls("");
    } catch (error: unknown) {
      toast.error(error instanceof AxiosError ? error.response?.data.message : "Failed to create playlist");
    } finally {
      setCreatingCustom(false);
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

  const allPlaylists = [...customPlaylists, ...playlists];
  const isLoading = loading || customLoading;

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
          <Button variant="outline" onClick={() => setShowCustomDialog(true)} className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Create Custom Playlist
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Manage your collections or sync latest videos from your subscriptions.
        </p>

        <div className="flex flex-col md:flex-row gap-6 bg-card border rounded-xl p-5 shadow-sm">
          <form onSubmit={handleAddVideo} className="flex gap-3 flex-1">
            <Input
              placeholder="Paste YouTube Video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={addLoading || syncing}
            />
            <Button type="submit" disabled={addLoading || syncing}>
              {addLoading ? <Loader className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              Add URL
            </Button>
          </form>

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

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              Create Custom Playlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Playlist Name</label>
              <Input
                placeholder="e.g., Tech Videos Mix, Watch Later Collection..."
                value={customPlaylistName}
                onChange={(e) => setCustomPlaylistName(e.target.value)}
                disabled={creatingCustom}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">YouTube URLs</label>
              <Textarea
                placeholder="Paste YouTube video URLs here (one per line or comma-separated)&#10;&#10;Examples:&#10;https://www.youtube.com/watch?v=abc123&#10;https://youtu.be/xyz789&#10;https://youtube.com/shorts.com/def456"
                value={customVideoUrls}
                onChange={(e) => setCustomVideoUrls(e.target.value)}
                className="min-h-[150px] resize-y"
                disabled={creatingCustom}
              />
              <p className="text-xs text-muted-foreground">
                Paste multiple video URLs from any YouTube channel. Videos will be fetched and added to your custom playlist.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)} disabled={creatingCustom}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomPlaylist} disabled={creatingCustom || !customPlaylistName.trim() || !customVideoUrls.trim()}>
              {creatingCustom ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                <>
                  <ListMusic className="mr-2 h-4 w-4" />
                  Create Playlist
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center h-[50vh] items-center p-12"><Loader size={50} /></div>
      ) : allPlaylists.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No playlists yet. Add a video or sync your subscriptions to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allPlaylists.map((playlist, idx) => {
            const isCustom = 'playlistName' in playlist;
            const latestVideo = playlist.videos[playlist.videos.length - 1];
            const playlistId = playlist._id || '';
            const displayName = isCustom ? (playlist as any).playlistName : (playlist as any).channelTitle;

            return (
              <div key={idx} className="group relative">
                <div className="absolute top-2 right-2 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Alert
                    title="Delete Playlist"
                    description="Are you sure you want to delete this entire playlist? This action cannot be undone."
                    onContinue={() => isCustom ? handleDeleteCustomPlaylist(playlistId) : handleDeletePlaylist(playlistId)}
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

                {!isCustom && (
                  <div className="absolute top-2 right-12 z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 hover:text-sky-600 shadow-sm"
                      title="Share entire playlist"
                      onClick={() => sharePlaylist((playlist as any).channelTitle, playlistId)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isCustom && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <ListMusic className="h-3 w-3" />
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
                          alt={displayName}
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

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          View full playlist
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {playlist.videos.filter((v: IVideo) => v.watched).length} watched
                      </div>
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
