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