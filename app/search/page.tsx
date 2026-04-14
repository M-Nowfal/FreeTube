"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useUserStore } from "@/store/useUserStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import Image from "next/image";
import Link from "next/link";
import { PlaySquare, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IVideo } from "@/types/playlist";
import axios from "axios";

interface IFlatVideo extends IVideo {
  playlistId: string;
  channelTitle: string;
  videoId: string;
  watched?: boolean;
}

interface ISearchResult {
  videoId: string;
  title: string;
  description?: string;
  channelTitle: string;
  channelId?: string;
  thumbnail: string;
  publishedAt?: string;
  isFromPlaylist?: boolean;
  playlistId?: string;
  watched?: boolean;
}

export default function SearchPage() {
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();
  const { cache, loading, fetchPlaylists, addVideoToPlaylist, addNewPlaylist } = usePlaylistStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ISearchResult[]>([]);
  const [searchingYouTube, setSearchingYouTube] = useState(false);
  const [hasSearchedYouTube, setHasSearchedYouTube] = useState(false);
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null);
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
    if (user?.username) {
      fetchPlaylists(user.username);
    }
  }, [user?.username]);

  const allVideos = useMemo(() => {
    if (!cache?.playlists) return [];
    return cache.playlists.flatMap((playlist) =>
      playlist.videos.map((video) => ({
        ...video,
        playlistId: playlist._id,
        channelTitle: playlist.channelTitle,
        isFromPlaylist: true,
      }))
    ).reverse();
  }, [cache]);

  const filteredPlaylistVideos = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const lowerQuery = searchQuery.toLowerCase();
    return allVideos.filter(
      (video) =>
        video.title.toLowerCase().includes(lowerQuery) ||
        video.channelTitle.toLowerCase().includes(lowerQuery)
    );
  }, [allVideos, searchQuery]);

  const handleSearchYouTube = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchingYouTube(true);
    setHasSearchedYouTube(true);

    try {
      const res = await axios.get(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      const youtubeResults: ISearchResult[] = res.data;

      // Mark videos that are already in playlist
      const videoIdSet = new Set(allVideos.map(v => v.videoId));
      const combinedResults = youtubeResults.map(result => ({
        ...result,
        isFromPlaylist: videoIdSet.has(result.videoId),
      }));

      setSearchResults(combinedResults);
    } catch {
      toast.error("Failed to search YouTube");
    } finally {
      setSearchingYouTube(false);
    }
  }, [searchQuery, allVideos]);

  const handleAddToPlaylist = async (video: ISearchResult) => {
    if (!user?.username) return;

    setAddingVideoId(video.videoId);
    try {
      const res = await axios.post("/api/playlists", {
        username: user.username,
        channelTitle: video.channelTitle,
        video: {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle,
          watched: false,
        },
      });
      toast.success("Video added to playlist");

      // Update the search result to show it's now in playlist
      setSearchResults(prev =>
        prev.map(r => r.videoId === video.videoId ? { ...r, isFromPlaylist: true } : r)
      );

      // Update Zustand store directly without refetching
      const updatedPlaylist = res.data.playlist;
      if (updatedPlaylist) {
        // Check if playlist already exists in cache
        const existingPlaylist = cache?.playlists.find(p => p.channelTitle === video.channelTitle);
        if (existingPlaylist) {
          // Add video to existing playlist
          addVideoToPlaylist(existingPlaylist._id, {
            videoId: video.videoId,
            title: video.title,
            thumbnail: video.thumbnail,
            channelTitle: video.channelTitle,
            watched: false,
          });
        } else {
          // Add new playlist to cache
          addNewPlaylist(updatedPlaylist);
        }
      }
    } catch {
      toast.error("Failed to add video");
    } finally {
      setAddingVideoId(null);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Search Videos</h1>

        <form onSubmit={handleSearchYouTube} className="relative max-w-2xl w-full flex gap-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            placeholder="Search by video title or channel name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Reset YouTube search when typing new query
              if (hasSearchedYouTube) {
                setHasSearchedYouTube(false);
                setSearchResults([]);
              }
            }}
            className="pl-10 h-12 text-md flex-1"
          />
          <Button type="submit" disabled={searchingYouTube || !searchQuery.trim()} className="h-12">
            {searchingYouTube ? <Loader className="h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        </form>
      </div>

      {loading && allVideos.length === 0 ? (
        <div className="flex justify-center h-[50vh] items-center">
          <Loader size={50} />
        </div>
      ) : hasSearchedYouTube && searchResults.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">YouTube Results</h2>
            <span className="text-sm text-muted-foreground">{searchResults.length} videos found</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {searchResults.map((video, idx) => (
              <div key={idx} className="block group">
                <div className="cursor-pointer flex flex-col gap-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${video.watched ? "opacity-75" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <PlaySquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {video.watched && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium">
                        Watched
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      {video.channelTitle}
                    </p>
                    {video.isFromPlaylist ? (
                      <Link href={`/playlist/${video.playlistId}?videoId=${video.videoId}`} className="mt-2">
                        <span className="text-xs text-green-600 font-medium hover:underline">In your playlist</span>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-1.5"
                        disabled={addingVideoId === video.videoId}
                        onClick={() => handleAddToPlaylist(video)}
                      >
                        {addingVideoId === video.videoId ? (
                          <Loader className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Add to Playlist
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : hasSearchedYouTube && searchResults.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No videos found on YouTube for &quot;{searchQuery}&quot;. Try a different search!
        </div>
      ) : filteredPlaylistVideos.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Videos</h2>
            <span className="text-sm text-muted-foreground">{filteredPlaylistVideos.length} videos found</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPlaylistVideos.map((video, idx) => (
              <Link href={`/playlist/${video.playlistId}?videoId=${video.videoId}`} key={idx} className="block group">
                <div className="cursor-pointer flex flex-col gap-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${video.watched ? "opacity-75" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <PlaySquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {video.watched && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium">
                        Watched
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : allVideos.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          Your playlists are empty. Search for videos on YouTube to add them!
        </div>
      ) : (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          Start typing to search your videos or click Search to find on YouTube.
        </div>
      )}
    </div>
  );
}
