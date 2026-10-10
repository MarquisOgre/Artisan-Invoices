import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Trash2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AdminNotification = {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  message: string;
  target_path: string;
  created_at: string;
  read_at: string | null;
};

const eventLabels: Record<string, string> = {
  order_form_created: "Order Form",
  quotation_created: "Quotation",
  invoice_created: "Invoice",
};

export default function NotificationManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("admin_list_notifications");
    if (error) {
      console.error("Unable to load admin notifications", error);
      toast({ title: "Unable to load notifications", description: error.message, variant: "destructive" });
    } else {
      setItems((data || []) as unknown as AdminNotification[]);
      setSelected([]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesType = filter === "all" || item.event_type === filter;
      const matchesSearch = !query || [item.title, item.message, item.user_id, item.event_type]
        .some(value => value.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
  }, [items, search, filter]);

  const toggleSelected = (id: string) => {
    setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };

  const toggleVisible = () => {
    const visibleIds = visibleItems.map(item => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
    setSelected(current => allSelected
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };

  const deleteNotifications = async (all = false) => {
    const count = all ? items.length : selected.length;
    if (count === 0) return;
    const confirmation = all
      ? "Delete ALL notifications for EVERY user? This cannot be undone."
      : `Delete ${count} selected notification(s) for EVERY recipient? This cannot be undone.`;
    if (!window.confirm(confirmation)) return;

    setBusy(true);
    const { data, error } = await (supabase as any).rpc("admin_delete_notifications", {
      p_ids: all ? null : selected,
      p_all: all,
    });
    if (error) {
      console.error("Unable to delete notifications", error);
      toast({ title: "Deletion failed", description: error.message, variant: "destructive" });
    } else {
      const deleted = typeof data === "number" ? data : count;
      toast({ title: "Notifications deleted", description: `${deleted} notification(s) removed for all recipients.` });
      await load();
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Notification Management</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Delete notifications globally. Changes apply to every recipient.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || busy}>
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search message or recipient user ID" />
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter notifications by type">
            <option value="all">All types</option>
            <option value="order_form_created">Order Forms</option>
            <option value="quotation_created">Quotations</option>
            <option value="invoice_created">Invoices</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleVisible} disabled={!visibleItems.length || loading || busy}>
            {visibleItems.length > 0 && visibleItems.every(item => selected.includes(item.id))
              ? <CheckSquare className="mr-2 h-4 w-4" />
              : <Square className="mr-2 h-4 w-4" />}
            Select visible ({visibleItems.length})
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void deleteNotifications(false)} disabled={!selected.length || busy}>
            <Trash2 className="mr-2 h-4 w-4" />Delete selected ({selected.length})
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void deleteNotifications(true)} disabled={!items.length || busy}>
            <Trash2 className="mr-2 h-4 w-4" />Clear all for everyone
          </Button>
        </div>

        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</p>
          : visibleItems.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No matching notifications.</p>
          : <div className="divide-y rounded-md border">
            {visibleItems.map(item => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`Select notification ${item.title}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{eventLabels[item.event_type] || item.event_type}</span>
                    <span className="text-xs text-muted-foreground">{item.read_at ? "Read" : "Unread"}</span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.message}</span>
                  <span className="mt-1 block break-all text-xs text-muted-foreground">Recipient ID: {item.user_id}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                </span>
              </label>
            ))}
          </div>}
        <p className="text-xs text-muted-foreground">Showing up to 1,000 latest notifications. Deletion is permanent and removes the notification from all users' lists.</p>
      </CardContent>
    </Card>
  );
}
