import { toYouTubeEmbedUrl } from "@/utils/helper";
import { create } from "zustand";

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

interface VideoUrlState {
  videourl: string | null;
  playbackSpeed: PlaybackSpeed;
  setVideoUrl: (url: string | null) => void;
  clearVideoUrl: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
}

export const useVideoUrlStore = create<VideoUrlState>((set) => ({
  videourl: null,
  playbackSpeed: 1,

  setVideoUrl: (videourl) => {
    const embedUrl = toYouTubeEmbedUrl(videourl || "");
    set({ videourl: embedUrl });
  },

  clearVideoUrl: () => set({ videourl: null }),

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
