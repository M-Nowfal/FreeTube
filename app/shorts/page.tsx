"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { ShortCard } from "@/components/short-card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/others/alert";
import { useShortsStore } from "@/store/useShortsStore";
import { useUserStore } from "@/store/useUserStore";
import { ShortsIcon } from "@/components/icons/shorts-icon";
import { IShort } from "@/types/short";
import { Trash2, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function ShortsPage() {
  const router = useRouter();
  const {
    shorts,
    currentIndex,
    loading,
    hasMore,
    fetchShorts,
    likeShort,
    markWatched,
    setCurrentIndex,
    invalidate,
  } = useShortsStore();

  const loadingSentinel = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();

  const [deleting, setDeleting] = useState(false);
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const handleGoBack = useCallback(() => {
    setShowDeleteOverlay(false);
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: (shorts.length - 1) * (container.scrollHeight / shorts.length),
        behavior: "smooth",
      });
    }
  }, [shorts.length]);

  // Reset state when shorts are refreshed/deleted
  useEffect(() => {
    if (shorts.length === 0) {
      setShowDeleteOverlay(false);
      setHasReachedEnd(false);
    }
  }, [shorts.length]);

  const handleDeleteAllShorts = useCallback(async () => {
    if (!user?.username) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/shorts?username=${user.username}`);
      toast.success("All shorts deleted");
      invalidate();
      fetchShorts(user.username, true);
      setShowDeleteOverlay(false);
    } catch {
      toast.error("Failed to delete shorts");
    } finally {
      setDeleting(false);
    }
  }, [user, invalidate, fetchShorts]);

  useEffect(() => {
    initAuth();
    history.scrollRestoration = "manual";
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

  // Effect to navigate to first unwatched short after shorts are loaded
  useEffect(() => {
    if (shorts.length === 0 || currentIndex !== 0) return;
    
    const unwatchedIndex = shorts.findIndex((s: IShort) => !s.watched);
    const container = containerRef.current;
    if (!container || shorts.length === 0) return;
    
    const itemHeight = container.scrollHeight / shorts.length;
    
    if (unwatchedIndex !== -1 && unwatchedIndex > 0) {
      container.scrollTo({
        top: unwatchedIndex * itemHeight,
        behavior: "smooth",
      });
    } else if (unwatchedIndex === -1 && shorts.length > 0) {
      // All watched, go to first
      toast.info("All shorts are watched");
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [shorts.length]);

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
    history.replaceState(null, "", "/shorts");
    
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

      // Check if user has reached the end (last short)
      const atLastShort = newIndex >= shorts.length - 1 && !hasMore;
      if (atLastShort && !showDeleteOverlay) {
        setHasReachedEnd(true);
        setShowDeleteOverlay(true);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [shorts.length, currentIndex, handleShortChange, hasMore, showDeleteOverlay]);

  useEffect(() => {
    const channelsUrl = "/channels";
    let ignorePopState = false;

    const navigateToChannels = () => {
      if (ignorePopState) return;
      ignorePopState = true;
      window.location.href = channelsUrl;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigateToChannels();
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
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

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (!ignorePopState) {
        ignorePopState = true;
        window.location.href = channelsUrl;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState, { capture: true });
    };
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
      ) : showDeleteOverlay && shorts.length > 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="absolute top-4 left-4 gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Button>
          <div className="flex flex-col items-center gap-6">
            <ShortsIcon size={80} className="opacity-30" />
            <Alert
              title="Delete All Shorts?"
              description={`This will permanently delete all ${shorts.length} shorts from your library. This action cannot be undone.`}
              onContinue={handleDeleteAllShorts}
              loading={deleting}
              trigger={
                <Button
                  variant="destructive"
                  size="lg"
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  {deleting ? "Deleting..." : "Delete All Shorts"}
                </Button>
              }
            />
          </div>
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
