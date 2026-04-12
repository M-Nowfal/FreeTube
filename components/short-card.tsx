"use client";

import { useRef } from "react";
import Image from "next/image";
import { Heart, Share2, Bookmark, Play } from "lucide-react";
import { IShort } from "@/types/short";
import { useSubscriptionsStore } from "@/store/useSubscriptionsStore";
import { toast } from "sonner";

interface ShortCardProps {
  short: IShort;
  isActive: boolean;
  onLike: (shortId: string) => void;
  onWatchLater: (short: IShort) => void;
}

export function ShortCard({ short, isActive, onLike, onWatchLater }: ShortCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const subscriptions = useSubscriptionsStore((state) => state.channels);
  const subscription = subscriptions.find((sub) => sub.channelId === short.channelId);
  const channelLogo = subscription?.thumbnail || short.channelThumbnail;

  const preloadSrc = `https://www.youtube.com/embed/${short.videoId}?autoplay=1&loop=1&playlist=${short.videoId}&playsinline=1&controls=1`;

  const handleShare = async () => {
    const shareUrl = `https://youtube.com/shorts/${short.videoId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: short.title,
          text: `Watch "${short.title}" by ${short.channelTitle}`,
          url: shareUrl,
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="relative w-full h-[89vh] sm:h-[92vh] md:h-[95vh]">
      {isActive ? (
        <iframe
          ref={iframeRef}
          key={short.videoId}
          src={preloadSrc}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full cursor-pointer relative">
          <Image
            src={short.thumbnail}
            alt={short.title}
            fill
            className="object-contain"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-16 w-16 text-white opacity-80" />
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 pt-20">
          <div className="flex items-start gap-3">
            {channelLogo && (
              <Image
                src={channelLogo}
                alt={short.channelTitle}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">@{short.channelTitle}</p>
              <p className="text-white/80 text-xs mt-1 line-clamp-1">{short.title}</p>
              <p className="text-white/60 text-xs mt-1">
                {formatCount(short.views || 0)} views • {formatTimeAgo(short.publishedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 pointer-events-auto">
          <button
            onClick={() => onLike(short._id!)}
            className="flex flex-col items-center gap-1"
          >
            <div className={`p-2 rounded-full bg-black/30 ${short.liked ? "text-red-500" : "text-white"}`}>
              <Heart className={`h-6 w-6 ${short.liked ? "fill-current" : ""}`} />
            </div>
            <span className="text-white text-xs">{formatCount(short.likes || 0)}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-2 rounded-full bg-black/30 text-white">
              <Share2 className="h-6 w-6" />
            </div>
            <span className="text-white text-xs">Share</span>
          </button>

          <button
            onClick={() => onWatchLater(short)}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-2 rounded-full bg-black/30 text-white">
              <Bookmark className="h-6 w-6" />
            </div>
            <span className="text-white text-xs">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
