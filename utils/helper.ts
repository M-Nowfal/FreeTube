export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // 1. Handle short links: https://youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      // slice(1) removes the leading slash. split("/")[0] ensures we drop any trailing slashes
      return parsed.pathname.slice(1).split("/")[0];
    }

    // 2. Handle standard links: https://www.youtube.com/watch?v=VIDEO_ID
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }

    // 3. Handle special paths: /embed/, /shorts/, /live/, /v/
    // This splits "/live/X8e3Yx58AU0" into ["live", "X8e3Yx58AU0"]
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    
    if (
      pathSegments.length >= 2 &&
      ["embed", "shorts", "live", "v"].includes(pathSegments[0])
    ) {
      return pathSegments[1];
    }

    return null;
  } catch {
    // Fails securely if the user pastes incomplete text instead of a valid URL
    return null;
  }
}

export function toYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function parseDuration(isoDuration: string): number {
  if (!isoDuration) return 0;
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export function isYouTubeShort(videoUrl: string, durationSeconds: number): boolean {
  const hasShortsPattern = 
    videoUrl.includes("/shorts/") || 
    videoUrl.includes("shorts.youtube.com");
  
  const isShortDuration = durationSeconds > 0 && durationSeconds <= 60;
  
  return hasShortsPattern || isShortDuration;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}