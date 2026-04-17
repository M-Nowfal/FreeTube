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
import useEmblaCarousel from "embla-carousel-react";

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

  const [emblaRef, embla] = useEmblaCarousel({
    axis: "y",
    loop: false,
    align: "start",
    skipSnaps: false,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (embla) embla.scrollPrev();
  }, [embla]);

  const scrollNext = useCallback(() => {
    if (embla) embla.scrollNext();
  }, [embla]);

  const scrollTo = useCallback((index: number) => {
    if (embla) embla.scrollTo(index);
  }, [embla]);

  const handleGoBack = useCallback(() => {
    setShowDeleteOverlay(false);
    scrollTo(shorts.length - 1);
  }, [shorts.length, scrollTo]);

  const handleGoToPreviousPage = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoToTop = useCallback(() => {
    setShowDeleteOverlay(false);
    setHasReachedEnd(false);
    setCurrentIndex(0);
    scrollTo(0);
  }, [setCurrentIndex, scrollTo]);

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
    if (!embla) return;

    const onSelect = () => {
      const selectedIndex = embla.selectedScrollSnap();
      if (selectedIndex !== currentIndex) {
        setCurrentIndex(selectedIndex);
        history.replaceState(null, "", "/shorts");

        if (shorts[selectedIndex] && !shorts[selectedIndex].watched) {
          markWatched(shorts[selectedIndex]._id!);
        }

        if (selectedIndex >= shorts.length - 1 && !hasMore) {
          if (!showDeleteOverlay) {
            setHasReachedEnd(true);
            setShowDeleteOverlay(true);
          }
        } else if (showDeleteOverlay) {
          setShowDeleteOverlay(false);
        }
      }
    };

    embla.on("select", onSelect);

    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, currentIndex, shorts, hasMore, showDeleteOverlay, setCurrentIndex, markWatched]);

  useEffect(() => {
    if (shorts.length === 0 || currentIndex !== 0) return;

    const unwatchedIndex = shorts.findIndex((s: IShort) => !s.watched);

    if (unwatchedIndex !== -1 && unwatchedIndex > 0) {
      scrollTo(unwatchedIndex);
    } else if (unwatchedIndex === -1 && shorts.length > 0) {
      toast.info("All shorts are watched");
    }
  }, [shorts.length]);

  useEffect(() => {
    if (hasMore && loadingSentinel.current && embla && !loading) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading && user?.username) {
            fetchShorts(user.username);
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(loadingSentinel.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [hasMore, loading, embla, user?.username, fetchShorts]);

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
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        scrollPrev();
      } else if (e.key === "ArrowDown" && currentIndex < shorts.length - 1) {
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
              onClick={handleGoToPreviousPage}
              className="gap-2 w-full"
              size="lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={emblaRef}
            className="h-full w-full overflow-hidden"
          >
            <div
              ref={containerRef}
              className="h-full w-full"
              style={{ display: "flex", flexDirection: "column" }}
            >
              {shorts.map((short, index) => (
                <div
                  key={short._id}
                  className="h-screen w-full shrink-0"
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
                <div ref={loadingSentinel} className="h-20 flex items-center justify-center shrink-0">
                  {loading && <Loader size={32} />}
                </div>
              )}
            </div>
          </div>

          <div className="fixed right-4 lg:right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-50 hidden lg:flex pointer-events-none">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full opacity-60 hover:opacity-100 pointer-events-auto disabled:opacity-30"
              onClick={scrollPrev}
              disabled={currentIndex === 0}
            >
              <ChevronUp className="h-6 w-6" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="rounded-full opacity-60 hover:opacity-100 pointer-events-auto disabled:opacity-30"
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
