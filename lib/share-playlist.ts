import { toast } from "sonner";

export const sharePlaylist = async (name: string, shareId: string) => {
  const shareLink = `${window.location.origin}/playlist/share/${shareId}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${name} FreeTube Playlist`,
        text: "Check out this Playlist",
        url: shareLink,
      });
    } catch (err: unknown) {
      console.log("Share failed or cancelled", err);
      await navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  } else {
    await navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  }
};