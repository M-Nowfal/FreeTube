export const isYoutubeUrl = (url: string): boolean => {
  const inputStartsWith = [
    "https://youtu.be/", "https://youtube.com/shorts",
    "<iframe", "https://www.youtube.com/watch?v="
  ];

  for (const startsWith of inputStartsWith) {
    if (url.startsWith(startsWith))
      return true;
  }

  return false;
}

export const toEmbedUrl = (url: string): string => {
  const baseUrl = "https://www.youtube.com/embed/";
  let finalUrl = "";
  if (url.startsWith("https://youtu.be/"))
    finalUrl = baseUrl + url.split(".be/")[1];
  else if (url.startsWith("https://youtube.com/shorts"))
    finalUrl = baseUrl + url.split("/shorts/")[1];
  else if (url.startsWith("https://www.youtube.com/embed/"))
    finalUrl = url;
  else if (url.startsWith("<iframe"))
    finalUrl = baseUrl + url.split("/embed/")[1]?.split('"')[0];
  else if (url.startsWith("https://www.youtube.com/watch?v="))
    finalUrl = baseUrl + url.split("v=")[1]?.split("&")[0];
  else
    if (url !== "") throw new Error();
  return finalUrl;
}

export const getVideoId = (url: string): string | null => {
  switch (true) {
    case url.startsWith("<iframe"): {
      const match = url.match(/embed\/([^"?]*)/);
      return match ? match[1] : null;
    }

    case url.includes("youtu.be/"):
      return url.split("youtu.be/")[1].split(/[?&]/)[0];

    case url.includes("watch?v="):
      return url.split("watch?v=")[1].split(/[?&]/)[0];

    case url.includes("/shorts/"):
      return url.split("/shorts/")[1].split(/[?&]/)[0];

    case url.includes("/embed/"):
      return url.split("/embed/")[1].split(/[?&]/)[0];

    default:
      return null;
  }
}

export const getYoutubeTitle = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
};
