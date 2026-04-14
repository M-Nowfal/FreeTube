"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useChannelStore } from "@/store/useChannelStore";
import { useSubscriptionsStore } from "@/store/useSubscriptionsStore";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { PlaySquare, ExternalLink, Filter, PlayCircle, ThumbsUp, Eye, MessageSquare, ChevronDown, ChevronUp, RefreshCw, X, Trash2, Scissors, UserMinus } from "lucide-react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IVideo } from "@/types/playlist";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Alert } from "@/components/others/alert";

interface IChannelInfo {
  channelId: string;
  title: string;
  thumbnail?: string;
}

interface IVideoDetails {
  title: string;
  description: string;
  views: number;
  likes: number;
  commentsCount: number;
  publishedAt: string;
}

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ChannelProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const titleParam = searchParams.get("title") || "";

  const { user } = useUserStore();
  const { cache, loading, fetchChannel, getChannelData, updateChannelVideos, invalidate } = useChannelStore();
  const { removeChannel } = useSubscriptionsStore();

  const [playlistUpdatedAt, setPlaylistUpdatedAt] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<IChannelInfo | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [sortBy, setSortBy] = useState("latest");

  const [activeVideo, setActiveVideo] = useState<IVideo | null>(null);
  const [activeVideoDetails, setActiveVideoDetails] = useState<IVideoDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [timeframe, setTimeframe] = useState("1d");
  const [syncing, setSyncing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  const [shortsCount, setShortsCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.username && id) {
      const cached = getChannelData(id);
      if (cached) {
        setChannelInfo(cached.channelInfo);
        setVideos(cached.videos);
        setPlaylistUpdatedAt(cached.playlistUpdatedAt);
      } else {
        fetchChannel(id, user.username, titleParam);
      }
    }
  }, [user?.username, id, titleParam]);

  useEffect(() => {
    if (cache[id]) {
      const cached = cache[id];
      setChannelInfo(cached.channelInfo);
      setVideos(cached.videos);
      setPlaylistUpdatedAt(cached.playlistUpdatedAt);
    }
  }, [cache[id]]);

  // Calculate shorts vs long videos count
  useEffect(() => {
    if (videos.length > 0 && channelInfo) {
      const shorts = videos.filter((v: IVideo) => {
        const duration = (v as any).duration || 0;
        return duration > 0 && duration < 60;
      });
      setShortsCount(shorts.length);
      setVideosCount(videos.length - shorts.length);
    }
  }, [videos, channelInfo]);

  const handleDeleteAllShorts = async () => {
    if (!user?.username || !channelInfo) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/shorts?username=${user.username}&channelId=${channelInfo.channelId}`);
      toast.success(`${shortsCount} shorts deleted`);
      invalidate(id);
      fetchChannel(id, user.username, titleParam);
      setShortsCount(0);
    } catch (error) {
      toast.error("Failed to delete shorts");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllVideos = async () => {
    if (!user?.username || !channelInfo) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/shorts?username=${user.username}&channelTitle=${encodeURIComponent(channelInfo.title)}`);
      toast.success(`${videosCount} videos deleted`);
      // Refresh data
      invalidate(id);
      fetchChannel(id, user.username, titleParam);
      setVideosCount(0);
    } catch (error) {
      toast.error("Failed to delete videos");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteShort = async (shortId: string) => {
    if (!user?.username) return;

    try {
      await axios.delete(`/api/shorts?username=${user.username}&shortId=${shortId}`);
      setVideos((prev) => prev.filter((v: any) => (v as any)._id !== shortId));
      toast.success("Short deleted");
      setShortsCount((prev) => prev - 1);
    } catch (error) {
      toast.error("Failed to delete short");
    }
  };

  const handleDeleteVideo = async (videoId: string, channelTitle: string) => {
    if (!user?.username) return;

    try {
      await axios.delete(`/api/shorts?username=${user.username}&videoId=${videoId}&channelTitle=${encodeURIComponent(channelTitle)}`);
      setVideos((prev) => prev.filter((v: any) => v.videoId !== videoId));
      toast.success("Video deleted");
      setVideosCount((prev) => prev - 1);
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  const handleSync = async () => {
    if (!user?.username || !channelInfo) return toast.error("Please log in first");

    setSyncing(true);
    try {
      const res = await fetch("/api/sync/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          channelId: channelInfo.channelId,
          channelTitle: channelInfo.title,
          timeframe: timeframe
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Sync failed");

      toast.success(data.message);
      invalidate(id);
      fetchChannel(id, user.username, titleParam);
    } catch (error: any) {
      toast.error(error.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.username || !channelInfo) return toast.error("Please log in first");

    setUnsubscribing(true);
    try {
      await axios.delete(`/api/subscriptions?username=${user.username}&channelId=${channelInfo.channelId}`);
      removeChannel(channelInfo.channelId);
      toast.success(`Unsubscribed from ${channelInfo.title}`);

      // Navigate back to channels page
      window.location.href = "/channels";
    } catch (error) {
      toast.error("Failed to unsubscribe");
    } finally {
      setUnsubscribing(false);
    }
  };

  const handlePlayVideo = async (video: IVideo) => {
    setActiveVideo(video);
    setActiveVideoDetails(null);
    setIsDescriptionExpanded(false);
    setLoadingDetails(true);

    window.scrollTo({ top: 0, behavior: "smooth" });

    setVideos((prev) =>
      prev.map((v) => v.videoId === video.videoId ? { ...v, watched: true } : v)
    );

    if (channelInfo) {
      try {
        await fetch("/api/videos/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user?.username,
            channelTitle: channelInfo.title,
            videoId: video.videoId
          })
        });
      } catch (error) {
        console.error("Failed to sync watched status");
      }
    }

    try {
      const res = await fetch(`/api/youtube/${video.videoId}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setActiveVideoDetails(data.video_details);
    } catch (error) {
      toast.error("Failed to load video statistics");
    } finally {
      setLoadingDetails(false);
    }
  };

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();

      if (sortBy === "latest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "popular") {
        return ((b as any).views || 0) - ((a as any).views || 0) || dateB - dateA;
      }
      return 0;
    });
  }, [videos, sortBy]);

  if (loading && !channelInfo) {
    return <div className="flex h-screen items-center justify-center"><Loader size={50} /></div>;
  }

  if (!channelInfo) {
    return <div className="text-center py-20 text-muted-foreground">Channel not found.</div>;
  }

  return (
    <div className="container mx-auto pb-10">
      {!activeVideo && (
        <div className="flex items-center gap-6 px-4 md:px-12 mt-8 mb-12">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-muted overflow-hidden shrink-0 shadow-md">
            {channelInfo.thumbnail ? (
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border shadow-sm bg-muted group-hover:scale-105 transition-transform duration-300 relative">
                <Image src={channelInfo.thumbnail} alt={channelInfo.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary text-2xl font-bold">
                {channelInfo.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight wrap-break-word">
              {channelInfo.title}
            </h1>
            <div className="flex items-center justify-between gap-3 mt-1">
              <div className="flex items-center gap-3">
                <p className="text-muted-foreground text-sm">{videos.length} videos</p>
                <span className="text-muted-foreground/50">|</span>
                <p className="text-muted-foreground text-sm">{videos.filter((v: IVideo) => v.watched).length} watched</p>
              </div>
              <Alert
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={unsubscribing}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    {unsubscribing ? "Unsubscribing..." : "Unsubscribe"}
                  </Button>
                }
                title={`Unsubscribe from ${channelInfo.title}?`}
                description={`Are you sure you want to unsubscribe from ${channelInfo.title}? This will remove the channel and all its videos from your library. You can always subscribe again later.`}
                onContinue={handleUnsubscribe}
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              {shortsCount > 0 && (
                <Alert
                  title={`Delete ${shortsCount} Shorts?`}
                  description={`This will permanently delete all ${shortsCount} shorts from ${channelInfo?.title}. This action cannot be undone.`}
                  onContinue={handleDeleteAllShorts}
                  loading={deleting}
                  trigger={
                    <Button variant="outline" size="sm" disabled={deleting} className="text-orange-500 border-orange-500 hover:bg-orange-50">
                      <Scissors className="h-4 w-4 mr-2" />
                      {deleting ? "Deleting..." : `Delete ${shortsCount} Shorts`}
                    </Button>
                  }
                />
              )}
              {videosCount > 0 && (
                <Alert
                  title={`Delete ${videosCount} Videos?`}
                  description={`This will permanently delete all ${videosCount} videos from ${channelInfo?.title}. This action cannot be undone.`}
                  onContinue={handleDeleteAllVideos}
                  loading={deleting}
                  trigger={
                    <Button variant="outline" size="sm" disabled={deleting} className="text-red-500 border-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? "Deleting..." : `Delete ${videosCount} Videos`}
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="md:px-12 lg:mt-8">

        {activeVideo && (
          <>
            <div className="sticky top-0 z-50 md:relative md:z-auto w-full max-w-5xl mx-auto md:mx-auto md:px-0 bg-background md:bg-transparent shadow-2xl md:shadow-none">
              <div className="relative aspect-video w-full bg-black md:rounded-t-2xl overflow-hidden group">
                <button
                  onClick={() => setActiveVideo(null)}
                  className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  title="Close player"
                >
                  <X className="h-5 w-5" />
                </button>

                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="border-0"
                ></iframe>
              </div>
            </div>

            <div className="mb-12 w-full max-w-5xl mx-auto p-4 md:p-6 bg-card border-x-0 md:border-x border-b md:rounded-b-2xl shadow-sm overflow-hidden">
              <h2 className="text-xl md:text-2xl font-bold mb-4 wrap-break-word">{activeVideo.title}</h2>

              {loadingDetails ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader size={20} /> Loading video details...
                </div>
              ) : activeVideoDetails ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium border-b pb-4">
                    <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                      <Eye className="w-4 h-4" /> {activeVideoDetails.views?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                      <ThumbsUp className="w-4 h-4" /> {activeVideoDetails.likes?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                      <MessageSquare className="w-4 h-4" /> {activeVideoDetails.commentsCount?.toLocaleString()}
                    </div>
                    <span className="text-muted-foreground ml-2">
                      {new Date(activeVideoDetails.publishedAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl relative overflow-hidden">
                    <div className={`text-sm whitespace-pre-wrap wrap-break-word ${!isDescriptionExpanded ? "line-clamp-3" : ""}`}>
                      {activeVideoDetails.description
                        ? renderTextWithLinks(activeVideoDetails.description)
                        : "No description available."}
                    </div>
                    {activeVideoDetails.description && activeVideoDetails.description.length > 150 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 text-xs font-semibold"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      >
                        {isDescriptionExpanded ? (
                          <><ChevronUp className="w-4 h-4 mr-1" /> Show less</>
                        ) : (
                          <><ChevronDown className="w-4 h-4 mr-1" /> Show more</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-4">Details unavailable.</div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 px-4 pb-4 border-b gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-semibold">Videos</h2>
            {playlistUpdatedAt && (
              <span className="text-xs text-muted-foreground">
                Last synced: {new Date(playlistUpdatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe} disabled={syncing || loading}>
                <SelectTrigger className="w-32.5 h-9">
                  <SelectValue placeholder="Sync Time" />
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
              <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing || loading} className="h-9">
                {syncing ? <Loader size={16} className="mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync
              </Button>
            </div>

            <div className="w-px h-6 bg-border hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32.5 h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {sortedVideos.length === 0 ? (
          <div className="text-center py-20 px-10 border-2 border-dashed rounded-xl text-muted-foreground mx-4">
            No videos synced for this channel yet. Use the sync button above to fetch recent videos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 md:px-0">
            {sortedVideos.map((video, idx) => {
              const duration = (video as any).duration || 0;
              const isShort = duration > 0 && duration < 60;
              return (
                <Card key={idx} className="group overflow-hidden bg-transparent border-none shadow-none relative">
                  <Alert
                    title={isShort ? "Delete Short?" : "Delete Video?"}
                    description={isShort ? "This short will be permanently deleted." : "This video will be permanently deleted from the playlist."}
                    onContinue={() => {
                      if (isShort && (video as any)._id) {
                        handleDeleteShort((video as any)._id);
                      } else {
                        handleDeleteVideo(video.videoId, channelInfo?.title || '');
                      }
                    }}
                    trigger={
                      <Button
                        variant="outline"
                        className="absolute top-8 right-2 z-20 p-1.5 bg-black/70 hover:bg-red-600/30 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        title={isShort ? "Delete Short" : "Delete Video"}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </Button>
                    }
                  />

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3 cursor-pointer" onClick={() => handlePlayVideo(video)}>
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${video.watched ? 'opacity-60' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <PlaySquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {video.watched && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium z-10">
                        Watched
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all z-10">
                      <PlayCircle className="text-white h-12 w-12 drop-shadow-md" />
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <h3 className={`font-semibold text-sm line-clamp-2 leading-tight mb-1 ${video.watched ? 'text-muted-foreground' : 'wrap-break-word'}`} title={video.title}>
                      {video.title}
                    </h3>
                    {video.publishedAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(video.publishedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
