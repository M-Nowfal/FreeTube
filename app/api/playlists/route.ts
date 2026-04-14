import { NextRequest, NextResponse } from "next/server";
import { Playlist } from "@/models/playlist.model";
import { connectDataBase } from "@/utils/connect-db";
import { IVideo } from "@/types/playlist";

function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { username, channelTitle, videoUrls, video, isCustom } = body;

    // Handle custom playlist creation
    if (isCustom && videoUrls && videoUrls.length > 0) {
      if (!username || !channelTitle) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
      }

      // Fetch videos from YouTube
      const fetchedVideos: IVideo[] = [];
      for (const url of videoUrls) {
        try {
          const videoId = getYouTubeVideoId(url);
          if (!videoId || !process.env.YOUTUBE_API_KEY) continue;
          
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
          const data = await res.json();
          
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            fetchedVideos.push({
              videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
              duration: parseDuration(item.contentDetails.duration),
            });
          }
        } catch (e) {
          console.error("Failed to fetch video:", url, e);
        }
      }

      const playlist = await Playlist.create({
        username,
        channelTitle,
        videos: fetchedVideos,
        isCustom: true,
      });

      return NextResponse.json({ message: "Playlist created", playlist }, { status: 201 });
    }

    if (!username || !channelTitle || !video) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    let playlist = await Playlist.findOne({ username, channelTitle });

    if (playlist) {
      const isExistingVideo = playlist.videos?.some((v: IVideo) => v.videoId === video.videoId);
      if (isExistingVideo) {
        return NextResponse.json({ message: "Video already added to the playlist." }, { status: 400 });
      }
      playlist.videos.push(video);
      await playlist.save();
    } else {
      playlist = await Playlist.create({
        username,
        channelTitle,
        videos: [video],
        isCustom: isCustom || false,
      });
    }

    return NextResponse.json({ message: "Added to playlist", playlist }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ message: "Username required" }, { status: 400 });
    }

    const playlists = await Playlist.find({ username }).sort({ createdAt: -1 });

    const playlistsWithUpdatedAt = playlists.map(p => ({
      ...p.toObject(),
      updatedAt: p.updatedAt?.toISOString()
    }));

    const lastSynced = playlists.length > 0 
      ? playlists.reduce((latest, p) => {
          const pUpdated = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
          return pUpdated > latest ? pUpdated : latest;
        }, 0)
      : null;

    return NextResponse.json({ 
      playlists: playlistsWithUpdatedAt, 
      lastSynced: lastSynced ? new Date(lastSynced).toISOString() : null 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ message: "Username required" }, { status: 400 });
    }

    const result = await Playlist.deleteMany({ username });
    return NextResponse.json({ message: `${result.deletedCount} playlists deleted` }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}