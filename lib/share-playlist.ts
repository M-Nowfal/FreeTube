import { API_URL } from "@/utils/constants";
import { toast } from "sonner";

export const sharePlaylist = async (channelName: string, shareUrl: string) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${channelName} FreeTube Playlist`,
        text: "Check out this Playlist",
        url: `${API_URL?.replace("api", "")}playlist/share/${shareUrl}`,
      });
    } catch (err: unknown) {
      console.log("Share failed or cancelled", err);
    }
  } else {
    toast.warning("Native share is not supported on this device/browser. Please copy the link instead.");
  }
};