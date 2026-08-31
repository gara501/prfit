const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;

const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

export function getYouTubeVideoId(value: string): string | null {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  let videoId: string | null = null;
  if (url.hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (youtubeHosts.has(url.hostname)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const [route, id] = url.pathname.split("/").filter(Boolean);
      if (["embed", "live", "shorts"].includes(route)) videoId = id ?? null;
    }
  }

  return videoId && youtubeVideoIdPattern.test(videoId) ? videoId : null;
}

export function normalizeYouTubeUrl(value: string): string | null {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

export function getYouTubeEmbedUrl(value: string): string | null {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
}
