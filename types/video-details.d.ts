type IThumbnail = {
  url: string;
  width: number;
  height: number;
};

interface IVideoDetails {
  id: string;
  video_details: {
    title: string;
    description: string;
    thumbnails: {
      default: IThumbnail;
      medium: IThumbnail;
      standard: IThumbnail;
      maxres: IThumbnail;
    },
    channelTitle: string;
    publishedAt: Date;
    
    views: number,
    likes: number,
    commentsCount: number
  }
}