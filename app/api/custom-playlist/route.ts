import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { CustomPlaylist } from "@/models/custom-playlist.model";
import { IVideo } from "@/types/playlist";
import axios from "axios";

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ message: "Username required" }, { status: 400 });
    }

    const playlists = await CustomPlaylist.find({ username }).sort({ createdAt: -1 });

    const playlistsWithUpdatedAt = playlists.map(p => ({
      ...p.toObject(),
      _id: p._id.toString(),
      updatedAt: p.updatedAt?.toISOString()
    }));

    return NextResponse.json({ playlists: playlistsWithUpdatedAt }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { username, playlistName, videoUrls } = body;

    if (!username || !playlistName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json({ message: "No video URLs provided" }, { status: 400 });
    }

    const videoIds: string[] = [];
    for (const url of videoUrls) {
      if (typeof url === 'string' && url.trim()) {
        const videoId = getYouTubeVideoId(url.trim());
        if (videoId) {
          videoIds.push(videoId);
        }
      }
    }

    if (videoIds.length === 0) {
      return NextResponse.json({ message: "No valid YouTube URLs found" }, { status: 400 });
    }

    const videos: IVideo[] = [];
    const batchSize = 50;

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);
      const idsParam = batch.join(",");

      try {
        const ytRes = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos`,
          {
            params: {
              part: "snippet",
              id: idsParam,
              key: process.env.YOUTUBE_API_KEY,
            },
          }
        );

        for (const item of ytRes.data.items) {
          videos.push({
            videoId: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt || new Date().toISOString(),
            watched: false
          });
        }
      } catch (ytError) {
        console.error("YouTube API error for batch:", ytError);
      }
    }

    let playlist = await CustomPlaylist.findOne({ username, playlistName });

    if (playlist) {
      let addedCount = 0;
      for (const video of videos) {
        const exists = playlist.videos.some((v: { videoId: string }) => v.videoId === video.videoId);
        if (!exists) {
          playlist.videos.push(video);
          addedCount++;
        }
      }
      await playlist.save();
      return NextResponse.json({
        message: `Added ${addedCount} new videos to playlist`,
        playlist: {
          ...playlist.toObject(),
          _id: playlist._id.toString(),
          updatedAt: playlist.updatedAt?.toISOString()
        }
      }, { status: 200 });
    } else {
      playlist = await CustomPlaylist.create({
        username,
        playlistName,
        videos,
      });
      return NextResponse.json({
        message: `Created playlist with ${videos.length} videos`,
        playlist: {
          ...playlist.toObject(),
          _id: playlist._id.toString(),
          updatedAt: playlist.updatedAt?.toISOString()
        }
      }, { status: 201 });
    }
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Playlist ID required" }, { status: 400 });
    }

    const playlist = await CustomPlaylist.findByIdAndDelete(id);

    if (!playlist) {
      return NextResponse.json({ message: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Playlist deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
