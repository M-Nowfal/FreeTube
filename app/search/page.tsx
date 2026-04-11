"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import Image from "next/image";
import Link from "next/link";
import { PlaySquare, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IVideo } from "@/types/playlist";

interface IFlatVideo extends IVideo {
  playlistId: string;
  channelTitle: string;
  videoId: string;
  watched?: boolean;
}

export default function SearchPage() {
  const { isAuth, loading: authLoading } = useAuth();
  const { cache, loading, fetchPlaylists } = usePlaylistStore();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !authLoading) {
      toast.info("Login to access channels.");
      router.replace("/auth/login");
      return;
    }
  }, [authLoading, isAuth, router]);

  useEffect(() => {
    if (!cache && !loading) {
      fetchPlaylists("");
    }
  }, []);

  const allVideos = useMemo(() => {
    if (!cache?.playlists) return [];
    return cache.playlists.flatMap((playlist) =>
      playlist.videos.map((video) => ({
        ...video,
        playlistId: playlist._id,
        channelTitle: playlist.channelTitle,
      }))
    ).reverse();
  }, [cache]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return allVideos;

    const lowerQuery = searchQuery.toLowerCase();
    return allVideos.filter(
      (video) =>
        video.title.toLowerCase().includes(lowerQuery) ||
        video.channelTitle.toLowerCase().includes(lowerQuery)
    );
  }, [allVideos, searchQuery]);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Search Videos</h1>

        <div className="relative max-w-2xl w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by video title or channel name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-md"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-[50vh] items-center">
          <Loader size={50} />
        </div>
      ) : allVideos.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          Your playlists are empty. Add some videos first!
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No videos found for &quot;{searchQuery}&quot;. Try a different search!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredVideos.map((video, idx) => (
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
      )}
    </div>
  );
}
