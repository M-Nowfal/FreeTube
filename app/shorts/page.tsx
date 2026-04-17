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
import { Trash2, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const { isAuth, authLoading, authInitialized, user, initAuth } = useUserStore();

  const [deleting, setDeleting] = useState(false);
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [allWatched, setAllWatched] = useState(false);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const itemHeight = window.innerHeight;
    container.scrollTo({
      top: index * itemHeight,
      behavior: "smooth",
    });
  }, []);

  const scrollPrev = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  const scrollNext = useCallback(() => {
    if (currentIndex < shorts.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, shorts.length, scrollToIndex]);

  const handleGoBack = useCallback(() => {
    setShowDeleteOverlay(false);
    setAllWatched(false);
    scrollToIndex(shorts.length - 1);
  }, [shorts.length, scrollToIndex]);

  const handleGoToPreviousPage = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoToTop = useCallback(() => {
    setShowDeleteOverlay(false);
    setAllWatched(false);
    setCurrentIndex(0);
    scrollToIndex(0);
  }, [setCurrentIndex, scrollToIndex]);

  useEffect(() => {
    if (shorts.length === 0) {
      setShowDeleteOverlay(false);
      setAllWatched(false);
    }
  }, [shorts.length]);

  useEffect(() => {
    if (shorts.length > 0) {
      const allWatchedShorts = shorts.every((s: IShort) => s.watched);
      setAllWatched(allWatchedShorts);
      if (allWatchedShorts && !hasMore) {
        setShowDeleteOverlay(true);
      }
    }
  }, [shorts, hasMore]);

  const handleDeleteAllShorts = useCallback(async () => {
    if (!user?.username) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/shorts?username=${user.username}`);
      toast.success("All shorts deleted");
      invalidate();
      fetchShorts(user.username, true);
      setShowDeleteOverlay(false);
      setAllWatched(false);
    } catch {
      toast.error("Failed to delete shorts");
    } finally {
      setDeleting(false);
    }
  }, [user, invalidate, fetchShorts]);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < shorts.length) {
        setCurrentIndex(newIndex);
        history.replaceState(null, "", "/shorts");

        if (shorts[newIndex] && !shorts[newIndex].watched) {
          markWatched(shorts[newIndex]._id!);
        }

        if (newIndex >= shorts.length - 1 && !hasMore) {
          setShowDeleteOverlay(true);
        } else if (showDeleteOverlay) {
          setShowDeleteOverlay(false);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, shorts, hasMore, showDeleteOverlay, setCurrentIndex, markWatched]);

  useEffect(() => {
    if (shorts.length === 0) return;

    const unwatchedIndex = shorts.findIndex((s: IShort) => !s.watched);

    if (unwatchedIndex !== -1 && unwatchedIndex !== currentIndex) {
      scrollToIndex(unwatchedIndex);
    } else if (unwatchedIndex === -1 && shorts.length > 0) {
      toast.info("All shorts are watched");
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
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollNext();
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
  }, [currentIndex, shorts.length, scrollPrev, scrollNext]);

  if (!authInitialized) return null;

  if (!isAuth && !authLoading) {
    return null;
  }

  return (
    <div className="h-screen w-full overflow-hidden relative">
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
      ) : allWatched && !hasMore && !showDeleteOverlay ? (
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <ShortsIcon size={80} className="opacity-30" />
            <p className="text-lg text-muted-foreground">All shorts have been watched</p>
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
            <Button
              variant="outline"
              onClick={handleGoToPreviousPage}
              className="gap-2 w-full"
              size="lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
          </div>
        </div>
      ) : showDeleteOverlay && shorts.length > 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center">
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
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteOverlay(false);
                if (currentIndex < shorts.length - 1) {
                  scrollNext();
                }
              }}
              className="gap-2"
              size="lg"
            >
              Continue Watching
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden select-none"
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          >
            <div
              className="w-full"
              style={{ display: "flex", flexDirection: "column" }}
            >
              {shorts.map((short, index) => (
                <div
                  key={short._id}
                  className="h-[95vh] md:h-[98vh] w-full shrink-0"
                >
                  <ShortCard
                    short={short}
                    isActive={index === currentIndex}
                    onLike={handleLike}
                    onWatchLater={handleWatchLater}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full opacity-60 hover:opacity-100 disabled:opacity-30"
              onClick={scrollPrev}
              disabled={currentIndex === 0}
            >
              <ChevronUp className="h-6 w-6" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="rounded-full opacity-60 hover:opacity-100 disabled:opacity-30"
              onClick={scrollNext}
              disabled={currentIndex === shorts.length - 1}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
