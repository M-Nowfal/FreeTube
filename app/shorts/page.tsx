"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { ShortCard } from "@/components/short-card";
import { useShortsStore } from "@/store/useShortsStore";
import { useUserStore } from "@/store/useUserStore";
import { ShortsIcon } from "@/components/icons/shorts-icon";
import { IShort } from "@/types/short";
import axios from "axios";

export default function ShortsPage() {
  const router = useRouter();
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();
  const {
    shorts,
    currentIndex,
    loading,
    hasMore,
    fetchShorts,
    likeShort,
    markWatched,
    setCurrentIndex,
  } = useShortsStore();

  const loadingSentinel = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuth && !authLoading) {
      toast.info("Login to access Shorts.");
      router.replace("/auth/login");
      return;
    }

    if (user?.username && shorts.length === 0) {
      fetchShorts(user.username, true);
    }
  }, [authInitialized, isAuth, authLoading, user?.username]);

  const handleLike = useCallback(async (shortId: string) => {
    await likeShort(shortId);
  }, [likeShort]);

  const handleWatchLater = useCallback(async (short: IShort) => {
    try {
      await axios.post("/api/watch-later", {
        username: user?.username,
        video: {
          videoId: short.videoId,
          title: short.title,
          thumbnail: short.thumbnail,
          channelTitle: short.channelTitle,
          watched: false,
        },
      });
      toast.success("Added to Watch Later");
    } catch {
      toast.error("Failed to add to Watch Later");
    }
  }, [user]);

  const handleShortChange = useCallback((index: number) => {
    setCurrentIndex(index);
    
    if (shorts[index] && !shorts[index].watched) {
      markWatched(shorts[index]._id!);
    }
  }, [setCurrentIndex, shorts, markWatched]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.scrollHeight / shorts.length;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < shorts.length) {
        handleShortChange(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [shorts.length, currentIndex, handleShortChange]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && user?.username) {
          fetchShorts(user.username);
        }
      },
      { rootMargin: "500px" }
    );

    if (loadingSentinel.current) {
      observer.observe(loadingSentinel.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, user?.username, fetchShorts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        const container = containerRef.current;
        if (container) {
          const itemHeight = container.scrollHeight / shorts.length;
          container.scrollTo({
            top: (currentIndex - 1) * itemHeight,
            behavior: "smooth",
          });
        }
      } else if (e.key === "ArrowDown" && currentIndex < shorts.length - 1) {
        const container = containerRef.current;
        if (container) {
          const itemHeight = container.scrollHeight / shorts.length;
          container.scrollTo({
            top: (currentIndex + 1) * itemHeight,
            behavior: "smooth",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shorts.length]);

  if (!authInitialized) return null;

  if (!isAuth && !authLoading) {
    return null;
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      {loading && shorts.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <Loader size={50} />
        </div>
      ) : shorts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <ShortsIcon size={64} className="mb-4 opacity-50" />
          <p className="text-lg">No Shorts yet</p>
          <p className="text-sm mt-2">Sync your subscriptions to see Shorts here</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-hidden"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {shorts.map((short, index) => (
            <div
              key={short._id}
              className="h-screen w-full snap-start"
            >
              <ShortCard
                short={short}
                isActive={index === currentIndex}
                isPreload={index === currentIndex + 1 || index === currentIndex - 1}
                onLike={handleLike}
                onWatchLater={handleWatchLater}
              />
            </div>
          ))}

          {hasMore && (
            <div ref={loadingSentinel} className="h-20 flex items-center justify-center">
              {loading && <Loader size={32} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
