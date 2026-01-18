export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1)
    }

    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v")
    }

    if (parsed.pathname.includes("/embed/")) {
      return parsed.pathname.split("/embed/")[1]
    }

    if (parsed.pathname.includes("/shorts/")) {
      return parsed.pathname.split("/shorts/")[1]
    }

    return null
  } catch {
    return null
  }
}

export function toYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}
