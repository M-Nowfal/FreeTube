"use client";

import { useEffect, useState } from "react";
import { Search, ExternalLink, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore"; // Import the store

interface IChannel {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
}

export default function SearchChannelsPage() {
  const { isAuth, loading: authLoading } = useAuth();
  const { user } = useUserStore(); // Get the current user from the store
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !authLoading) {
      toast.info("Login to access channels.");
      router.replace("/auth/login");
      return;
    }
  }, [authLoading, isAuth, router]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/youtube/channels?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch channels");

      const data = await res.json();
      setChannels(data);
    } catch (error) {
      toast.error("Error fetching channels");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (channel: IChannel) => {
    if (!user?.username) {
      toast.error("User not found. Please log in again.");
      return;
    }

    setSubscribingIds((prev) => new Set(prev).add(channel.channelId));

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.channelId,
          title: channel.title,
          thumbnail: channel.thumbnail,
          username: user.username // Use the actual logged-in user's username here
        }),
      });

      if (!res.ok) throw new Error("Failed to subscribe");

      toast.success(`Subscribed to ${channel.title}`);
    } catch (error) {
      toast.error("Error subscribing to channel");
    } finally {
      setSubscribingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(channel.channelId);
        return newSet;
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Discover Channels</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg py-6"
          />
          <Button type="submit" size="lg" disabled={loading || !query.trim()} className="h-auto">
            {loading ? <Loader /> : <Search className="h-5 w-5 mr-2" />}
            {loading ? "Searching" : "Search"}
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size={50} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {channels.map((channel) => (
            <Card
              key={channel.channelId}
              className="flex flex-col group overflow-hidden hover:shadow-md hover:border-primary/40 transition-all duration-300 bg-card/50 hover:bg-card"
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border shadow-sm bg-muted group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <CardTitle className="text-base font-bold leading-tight line-clamp-1" title={channel.title}>
                    {channel.title}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2 leading-snug">
                    {channel.description || "No description available."}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-end p-5 pt-0 mt-2">
                <div className="flex flex-col gap-2.5 w-full">
                  <Button
                    onClick={() => handleSubscribe(channel)}
                    disabled={subscribingIds.has(channel.channelId)}
                    className="w-full font-semibold shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {subscribingIds.has(channel.channelId) ? (
                      <Loader />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Subscribe
                  </Button>

                  <Button variant="outline" className="w-full transition-transform active:scale-[0.98]" asChild>
                    <a
                      href={`https://www.youtube.com/channel/${channel.channelId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2 opacity-70" />
                      Visit Channel
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasSearched && !loading && channels.length === 0 && (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
          No channels found
        </div>
      )}
    </div>
  );
}