"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, ExternalLink, UserPlus, UserMinus, RefreshCw, Scissors, Trash2 } from "lucide-react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useSubscriptionsStore } from "@/store/useSubscriptionsStore";
import { useChannelStore } from "@/store/useChannelStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { AxiosError } from "axios";
import Link from "next/link";
import { Alert } from "@/components/others/alert";

interface IChannel {
  channelId: string;
  title: string;
  description?: string;
  thumbnail: string;
  totalVideos?: number;
  watchedVideos?: number;
}

export default function SearchChannelsPage() {
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();
  const { channels: subscribedChannels, loading: fetchingSubs, fetchSubscriptions, addChannel, removeChannel, lastSynced } = useSubscriptionsStore();
  const { removeShortsFromAllChannels, removeVideosFromAllChannels, invalidateAll: invalidateChannelCache } = useChannelStore();
  const { invalidate: invalidatePlaylist } = usePlaylistStore();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IChannel[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());
  const [unsubscribingIds, setUnsubscribingIds] = useState<Set<string>>(new Set());

  const [timeframe, setTimeframe] = useState("1d");
  const [syncing, setSyncing] = useState(false);
  const [deletingShorts, setDeletingShorts] = useState(false);
  const [deletingVideos, setDeletingVideos] = useState(false);

  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    if (!isAuth && !authLoading) {
      toast.info("Login to access channels.");
      router.replace("/auth/login");
      return;
    }
  }, [authInitialized, authLoading, isAuth, router]);

  useEffect(() => {
    if (user?.username && subscribedChannels.length === 0 && !fetchingSubs) {
      fetchSubscriptions(user.username);
    }
  }, [user]);

  const handleSync = async () => {
    if (!user?.username) return toast.error("Please log in first");

    setSyncing(true);
    try {
      await axios.post("/api/sync", {
        username: user.username,
        timeframe: timeframe
      });
      invalidateChannelCache();
      fetchSubscriptions(user.username);
    } catch (error: unknown) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAllShorts = async () => {
    if (!user?.username) return;

    setDeletingShorts(true);
    try {
      const res = await axios.delete(`/api/shorts?username=${user.username}`);
      toast.success(res.data.message || "All shorts deleted");
      removeShortsFromAllChannels();
      fetchSubscriptions(user.username, true);
    } catch {
      toast.error("Failed to delete shorts");
    } finally {
      setDeletingShorts(false);
    }
  };

  const handleDeleteAllVideos = async () => {
    if (!user?.username) return;

    setDeletingVideos(true);
    try {
      const res = await axios.delete(`/api/playlists?username=${user.username}`);
      toast.success(res.data.message || "All videos deleted");
      removeVideosFromAllChannels();
      invalidatePlaylist();
      fetchSubscriptions(user.username, true);
    } catch {
      toast.error("Failed to delete videos");
    } finally {
      setDeletingVideos(false);
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/youtube/channels?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch channels");

      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      toast.error("Error fetching channels");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubscribe = async (channel: IChannel) => {
    if (!user?.username) return toast.error("User not found. Please log in again.");

    setSubscribingIds((prev) => new Set(prev).add(channel.channelId));

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.channelId,
          title: channel.title,
          thumbnail: channel.thumbnail,
          username: user.username
        }),
      });

      if (!res.ok) throw new Error("Failed to subscribe");

      toast.success(`Subscribed to ${channel.title}`);
      addChannel(channel);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Error subscribing to channel");
      }
    } finally {
      setSubscribingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(channel.channelId);
        return newSet;
      });
    }
  };

  const handleUnsubscribe = async (channelId: string, channelTitle: string) => {
    if (!user?.username) return;

    setUnsubscribingIds((prev) => new Set(prev).add(channelId));

    try {
      const res = await fetch(`/api/subscriptions?username=${user.username}&channelId=${channelId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to unsubscribe");

      toast.success(`Unsubscribed from ${channelTitle}`);
      removeChannel(channelId);
    } catch (error) {
      toast.error("Error unsubscribing");
    } finally {
      setUnsubscribingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-12">

      <div className="max-w-2xl mx-auto text-start mt-4">
        <h1 className="text-3xl font-bold mb-4">Discover Channels</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg py-6"
          />
          <Button type="submit" size="lg" disabled={searchLoading || !query.trim()} className="h-auto">
            {searchLoading ? <Loader /> : <Search className="h-5 w-5 mr-2" />}
            {searchLoading ? "Searching" : "Search"}
          </Button>
        </form>
      </div>

      {searchLoading ? (
        <div className="flex justify-center py-20">
          <Loader size={50} />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((channel) => (
              <Card
                key={channel.channelId}
                className="flex flex-col group overflow-hidden hover:shadow-md hover:border-primary/40 transition-all duration-300 bg-card/50 hover:bg-card"
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border shadow-sm bg-muted group-hover:scale-105 transition-transform duration-300 relative">
                    <Image src={channel.thumbnail} alt={channel.title} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    <CardTitle className="text-base font-bold leading-tight line-clamp-1" title={channel.title}>
                      {channel.title}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2 leading-snug">
                      {channel.description || "No description available."}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-end p-5 pt-0 mt-2">
                  <div className="flex flex-col gap-2.5 w-full">
                    <Button
                      onClick={() => handleSubscribe(channel)}
                      disabled={subscribingIds.has(channel.channelId) || subscribedChannels.some(sub => sub.channelId === channel.channelId)}
                      className="w-full font-semibold shadow-sm transition-transform active:scale-[0.98]"
                    >
                      {subscribingIds.has(channel.channelId) ? (
                        <Loader />
                      ) : subscribedChannels.some(sub => sub.channelId === channel.channelId) ? (
                        "Subscribed"
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" /> Subscribe
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="w-full transition-transform active:scale-[0.98]" asChild>
                      <a href={`https://www.youtube.com/channel/${channel.channelId}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2 opacity-70" /> Visit Channel
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {hasSearched && !searchLoading && searchResults.length === 0 && (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
          No channels found for "{query}"
        </div>
      )}

      <div className="w-full h-px bg-border my-8"></div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Your Subscriptions</h2>
            {lastSynced && (
              <span className="text-xs text-muted-foreground mt-1">
                (Last synced: {formatDate(lastSynced)})
              </span>
            )}
          </div>
          <div className="flex flex-col lg:flex-row gap-2 justify-end">
            <div className="flex items-center gap-3">
              <Select value={timeframe} onValueChange={setTimeframe} disabled={syncing}>
                <SelectTrigger className="not-sm:w-2/4 w-32">
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
              <Button variant="secondary" onClick={handleSync} disabled={syncing} className="not-sm:w-2/4">
                {syncing ? <Loader className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync Subs
              </Button>
            </div>
            <div className="flex items-center gap-3 w-full not-sm:pe-3">
              <Alert
                title="Delete All Shorts?"
                description="This will permanently delete all shorts from your library. This action cannot be undone."
                onContinue={handleDeleteAllShorts}
                loading={deletingShorts}
                trigger={
                  <Button variant="outline" disabled={deletingShorts} className="text-orange-500 border-orange-500 hover:bg-orange-50 not-sm:w-2/4">
                    <Scissors className="h-4 w-4 mr-2" />
                    {deletingShorts ? "Deleting..." : "Delete All Shorts"}
                  </Button>
                }
              />
              <Alert
                title="Delete All Videos?"
                description="This will permanently delete all videos from your library. This action cannot be undone."
                onContinue={handleDeleteAllVideos}
                loading={deletingVideos}
                trigger={
                  <Button variant="outline" disabled={deletingVideos} className="text-red-500 border-red-500 hover:bg-red-50 not-sm:w-2/4">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deletingVideos ? "Deleting..." : "Delete All Videos"}
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {fetchingSubs ? (
          <div className="flex justify-center py-10"><Loader size={40} /></div>
        ) : subscribedChannels.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
            You haven&apos;t subscribed to any channels yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subscribedChannels.map((channel) => (
              <Card
                key={channel.channelId}
                onClick={() => router.push(`/channels/${channel.channelId}?title=${encodeURIComponent(channel.title)}`)}
                className="gap-0 flex flex-col group overflow-hidden bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border bg-muted relative">
                    <Image src={channel.thumbnail} alt={channel.title} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <CardTitle className="text-base font-bold leading-tight line-clamp-1" title={channel.title}>
                      {channel.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {channel.totalVideos || 0} videos
                      </span>
                      <span className="text-muted-foreground/50">|</span>
                      <span className="text-xs text-muted-foreground">
                        {channel.watchedVideos || 0} watched
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent
                  className="flex justify-end gap-2.5 pt-3 mt-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" asChild>
                    <Link href={`https://www.youtube.com/channel/${channel.channelId}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      YouTube
                    </Link>
                  </Button>
                  <Alert
                    trigger={
                      <Button
                        variant="destructive"
                        disabled={unsubscribingIds.has(channel.channelId)}
                      >
                        {unsubscribingIds.has(channel.channelId) ? (
                          <Loader />
                        ) : (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" /> Unsubscribe
                          </>
                        )}
                      </Button>
                    }
                    title="Confirm Unsubscribe"
                    description={`Are you sure you want to unsubscribe from "${channel.title}"? This will also delete all synced videos.`}
                    onContinue={() => handleUnsubscribe(channel.channelId, channel.title)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
