import { toYouTubeEmbedUrl } from "@/utils/helper";
import { create } from "zustand";

interface VideoUrlState {
  videourl: string | null;
  setVideoUrl: (url: string | null) => void;
  clearVideoUrl: () => void;
}

export const useVideoUrlStore = create<VideoUrlState>((set) => ({
  videourl: null,

  setVideoUrl: (videourl) => {
    const embedUrl = toYouTubeEmbedUrl(videourl || "");
    set({ videourl: embedUrl });
  },

  clearVideoUrl: () => set({ videourl: null }),
}));
