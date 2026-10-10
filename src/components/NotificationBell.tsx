import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type NotificationRow = {
  id: string;
  event_type: string;
  title: string;
  message: string;
  target_path: string;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const unreadCount = items.filter(item => !item.read_at).length;

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    let cancelled = false;
    let channelReady = false;

    const load = async (showSpinner = false) => {
      if (showSpinner && !cancelled) setLoading(true);
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("id, event_type, title, message, target_path, entity_id, created_at, read_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        console.error("Unable to load notifications", error);
      } else {
        // Merge server state with the current list to avoid dropping a Realtime
        // event that arrived while this request was in flight.
        setItems(current => {
          const merged = new Map<string, NotificationRow>();
          for (const row of data || []) merged.set(row.id, row);
          for (const row of current) if (!merged.has(row.id)) merged.set(row.id, row);
          return [...merged.values()]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 50);
        });
      }
      if (showSpinner && !cancelled) setLoading(false);
    };

    void load(true);

    const channel = supabase.channel(`notifications:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const incoming = payload.new as NotificationRow;
        setItems(current => [incoming, ...current.filter(item => item.id !== incoming.id)].slice(0, 50));
      })
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          channelReady = true;
          void load();
        } else {
          channelReady = false;
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("Notification realtime subscription unavailable; polling will keep the list updated.", error);
          }
        }
      });

    // Poll while visible as a safety net: a channel can report SUBSCRIBED yet
    // miss events because of a transient connection interruption.
    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Always refresh when opening the panel, even if Realtime missed an event.
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("id, event_type, title, message, target_path, entity_id, created_at, read_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) console.error("Unable to refresh notifications when panel opens", error);
      else setItems(data || []);
    };
    void refresh();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  const markRead = async (item: NotificationRow) => {
    if (!item.read_at) {
      const readAt = new Date().toISOString();
      setItems(current => current.map(row => row.id === item.id ? { ...row, read_at: readAt } : row));
      const { error } = await (supabase as any).from("notifications")
        .update({ read_at: readAt }).eq("id", item.id).eq("user_id", user?.id);
      if (error) console.error("Unable to mark notification read", error);
    }
    setOpen(false);
    navigate(item.target_path);
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const readAt = new Date().toISOString();
    setItems(current => current.map(item => item.read_at ? item : { ...item, read_at: readAt }));
    const { error } = await (supabase as any).from("notifications")
      .update({ read_at: readAt }).eq("user_id", user.id).is("read_at", null);
    if (error) {
      console.error("Unable to mark all notifications read", error);
      // Re-sync if the update fails so unread state remains accurate.
      const { data } = await (supabase as any).from("notifications")
        .select("id, event_type, title, message, target_path, entity_id, created_at, read_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (data) setItems(data);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        title="Notifications"
        onClick={() => setOpen(value => !value)}
        className="relative shrink-0"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </Button>
      {open && (
        <>
          <button aria-label="Close notifications" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[70] mt-2 w-[min(24rem,calc(100vw-1rem))] rounded-lg border bg-card text-card-foreground shadow-xl">
            <div className="flex items-center justify-between border-b p-3">
              <div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p></div>
              <Button variant="ghost" size="sm" disabled={!unreadCount} onClick={() => void markAllRead()}><CheckCheck className="mr-1 h-4 w-4" />Mark all read</Button>
            </div>
            <ScrollArea className="max-h-[min(65vh,28rem)]">
              {loading && <p className="p-5 text-center text-sm text-muted-foreground">Loading notifications…</p>}
              {!loading && items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>}
              <div className="divide-y">
                {items.map(item => (
                  <button key={item.id} onClick={() => void markRead(item)} className={`block w-full p-3 text-left transition-colors hover:bg-muted/70 ${item.read_at ? "" : "bg-primary/5"}`}>
                    <span className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-transparent" : "bg-primary"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{item.title}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{item.message}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
