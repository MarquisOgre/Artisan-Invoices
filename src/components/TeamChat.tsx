import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Plus, Search, Send, Users, ArrowLeft, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Member = { user_id: string; display_name: string; role?: string };
type Conversation = { id: string; title: string | null; is_group: boolean; created_by: string; updated_at: string; members?: Member[]; lastMessage?: string; unread?: number };
type ChatMessage = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; edited_at?: string | null };

const displayName = (userId: string) => `Member ${userId.slice(0, 6)}`;
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function TeamChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChannelRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChat = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: roleRows, error: roleError } = await (supabase as any).from("user_roles").select("user_id, role");
      if (roleError) throw roleError;
      // Resolve names from the app's existing username directory; keep chat usable if
      // directory access is restricted by an existing policy.
      const { data: usernameRows, error: usernameError } = await (supabase as any)
        .from("user_login_names").select("user_id, username");
      if (usernameError) console.warn("Unable to load team usernames", usernameError);
      const usernames = new Map<string, string>((usernameRows || []).map((row: any) => [row.user_id, String(row.username || "").trim()]));
      const memberRows: Member[] = (roleRows || []).map((row: any) => ({
        user_id: row.user_id,
        display_name: row.user_id === user.id
          ? String(usernames.get(row.user_id) || user.user_metadata?.username || user.email?.split("@")[0] || "You")
          : String(usernames.get(row.user_id) || displayName(row.user_id)),
        role: row.role,
      }));
      setMembers(memberRows);
      const { data: memberRowsForUser, error: membershipError } = await (supabase as any)
        .from("chat_conversation_members").select("conversation_id, last_read_at").eq("user_id", user.id);
      if (membershipError) throw membershipError;
      const readMarkers = new Map<string, string | null>((memberRowsForUser || []).map((row: any) => [row.conversation_id, row.last_read_at || null]));
      const ids = (memberRowsForUser || []).map((row: any) => row.conversation_id);
      if (!ids.length) { setConversations([]); setMessages([]); setActiveId(""); return; }
      const { data: conversationRows, error: conversationError } = await (supabase as any)
        .from("chat_conversations").select("id, title, is_group, created_by, updated_at").in("id", ids).order("updated_at", { ascending: false });
      if (conversationError) throw conversationError;
      const { data: allMembers, error: allMembersError } = await (supabase as any)
        .from("chat_conversation_members").select("conversation_id, user_id").in("conversation_id", ids);
      if (allMembersError) throw allMembersError;
      const { data: unreadMessages, error: unreadError } = await (supabase as any).from("chat_messages").select("conversation_id, sender_id, created_at").in("conversation_id", ids).neq("sender_id", user.id);
      if (unreadError) throw unreadError;
      const unreadCounts = new Map<string, number>();
      (unreadMessages || []).forEach((message: any) => {
        const lastReadAt = readMarkers.get(message.conversation_id);
        if (!lastReadAt || message.created_at > lastReadAt) unreadCounts.set(message.conversation_id, (unreadCounts.get(message.conversation_id) || 0) + 1);
      });
      const enriched = (conversationRows || []).map((conversation: any) => ({
        ...conversation,
        unread: unreadCounts.get(conversation.id) || 0,
        members: (allMembers || []).filter((m: any) => m.conversation_id === conversation.id).map((m: any) => memberRows.find(member => member.user_id === m.user_id) || { user_id: m.user_id, display_name: displayName(m.user_id) }),
      }));
      setConversations(enriched);
      setActiveId(current => current && ids.includes(current) ? current : (enriched[0]?.id || ""));
    } catch (error: any) {
      console.error("Unable to load team chat", error);
      toast({ title: "Unable to load chat", description: error?.message || "Check the chat database migration and access policies.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { void loadChat(); }, [loadChat]);

  useEffect(() => {
    if (!user || !activeId) { setMessages([]); return; }
    let cancelled = false;
    const loadMessages = async () => {
      const { data, error } = await (supabase as any).from("chat_messages").select("id, conversation_id, sender_id, body, created_at, edited_at")
        .eq("conversation_id", activeId).order("created_at", { ascending: true }).limit(500);
      if (cancelled) return;
      if (error) { toast({ title: "Unable to load messages", description: error.message, variant: "destructive" }); return; }
      setMessages(data || []);
      const readAt = new Date().toISOString();
      await (supabase as any).from("chat_conversation_members").update({ last_read_at: readAt }).eq("conversation_id", activeId).eq("user_id", user.id);
      setConversations(current => current.map(conversation => conversation.id === activeId ? { ...conversation, unread: 0 } : conversation));
    };
    void loadMessages();
    const channel = supabase.channel(`chat:${activeId}`, { config: { presence: { key: user.id } } });
    activeChannelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id?: string }>();
        setOnlineUserIds(Object.keys(state));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const typingId = String((payload as any)?.user_id || "");
        if (!typingId || typingId === user.id) return;
        setTypingUserIds(current => current.includes(typingId) ? current : [...current, typingId]);
        window.setTimeout(() => setTypingUserIds(current => current.filter(id => id !== typingId)), 2200);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${activeId}` }, (payload) => {
        const next = payload.new as ChatMessage;
        setMessages(current => current.some(message => message.id === next.id) ? current : [...current, next]);
        if (next.sender_id !== user.id) void (supabase as any).from("chat_conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", activeId).eq("user_id", user.id);
      })
      .subscribe(async status => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      });
    return () => { cancelled = true; if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); activeChannelRef.current = null; void supabase.removeChannel(channel); };
  }, [activeId, user, toast]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const activeConversation = useMemo(() => conversations.find(conversation => conversation.id === activeId), [conversations, activeId]);
  const filteredConversations = useMemo(() => conversations.filter(conversation => {
    const label = conversation.title || conversation.members?.filter(member => member.user_id !== user?.id).map(member => member.display_name).join(", ") || "Conversation";
    return label.toLowerCase().includes(search.toLowerCase());
  }), [conversations, search, user?.id]);

  const conversationLabel = (conversation: Conversation) => conversation.title || conversation.members?.filter(member => member.user_id !== user?.id).map(member => member.display_name).join(", ") || "Private chat";

  const broadcastTyping = () => {
    if (!user || !activeId) return;
    void activeChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: user.id } });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 900);
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = messageText.trim();
    if (!body || !activeId || !user || sending) return;
    setSending(true);
    setMessageText("");
    const { error } = await (supabase as any).from("chat_messages").insert({ conversation_id: activeId, sender_id: user.id, body });
    if (error) {
      setMessageText(body);
      toast({ title: "Message not sent", description: error.message, variant: "destructive" });
    } else {
      await (supabase as any).from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeId);
    }
    setSending(false);
  };

  const openDirectChat = async (memberId: string) => {
    if (!user || memberId === user.id) return;
    const existing = conversations.find(conversation => !conversation.is_group && conversation.members?.some(member => member.user_id === memberId) && conversation.members?.some(member => member.user_id === user.id));
    if (existing) { setActiveId(existing.id); setMobileConversationOpen(true); setCreateOpen(false); return; }
    const { data: created, error } = await (supabase as any).from("chat_conversations").insert({ is_group: false, created_by: user.id }).select("id, title, is_group, created_by, updated_at").single();
    if (error || !created) { toast({ title: "Could not start chat", description: error?.message || "Please try again.", variant: "destructive" }); return; }
    const { error: memberError } = await (supabase as any).from("chat_conversation_members").insert([{ conversation_id: created.id, user_id: user.id }, { conversation_id: created.id, user_id: memberId }]);
    if (memberError) { toast({ title: "Could not add chat members", description: memberError.message, variant: "destructive" }); return; }
    await loadChat(); setActiveId(created.id); setMobileConversationOpen(true); setCreateOpen(false);
  };

  const createGroup = async () => {
    if (!user || selectedMembers.length < 2) return;
    const title = groupTitle.trim() || `Group · ${selectedMembers.map(id => members.find(member => member.user_id === id)?.display_name || displayName(id)).slice(0, 2).join(", ")}`;
    const { data: created, error } = await (supabase as any).from("chat_conversations").insert({ title, is_group: true, created_by: user.id }).select("id, title, is_group, created_by, updated_at").single();
    if (error || !created) { toast({ title: "Could not create group", description: error?.message || "Please try again.", variant: "destructive" }); return; }
    const ids = [...new Set([user.id, ...selectedMembers])];
    const { error: memberError } = await (supabase as any).from("chat_conversation_members").insert(ids.map(user_id => ({ conversation_id: created.id, user_id })));
    if (memberError) { toast({ title: "Could not add group members", description: memberError.message, variant: "destructive" }); return; }
    setSelectedMembers([]); setGroupTitle(""); setCreateOpen(false);
    await loadChat(); setActiveId(created.id); setMobileConversationOpen(true);
  };

  const visibleMembers = members.filter(member => member.user_id !== user?.id && member.display_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] min-h-[420px] max-w-7xl min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:flex-row">
      <aside className={`${mobileConversationOpen ? "hidden" : "flex"} w-full min-w-0 flex-col border-b md:flex md:w-80 md:shrink-0 md:border-b-0 md:border-r`}>
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <div><h1 className="text-lg font-semibold">Team Chat</h1><p className="text-xs text-muted-foreground">Your team conversations</p></div>
          <Button size="icon" variant="outline" aria-label="New conversation" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="relative p-3"><Search className="absolute left-6 top-6 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search chats or members" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading conversations…</div>}
            {!loading && filteredConversations.map(conversation => <button key={conversation.id} onClick={() => { setActiveId(conversation.id); setMobileConversationOpen(true); }} className={`flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted ${activeId === conversation.id ? "bg-muted" : ""}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{conversation.is_group ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{conversationLabel(conversation)}</span><span className="block truncate text-xs text-muted-foreground">{conversation.is_group ? `${conversation.members?.length || 0} members` : "Direct message"}</span></span>{Boolean(conversation.unread) && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{conversation.unread! > 99 ? "99+" : conversation.unread}</span>}
            </button>)}
            {!loading && filteredConversations.length === 0 && <div className="p-5 text-center text-sm text-muted-foreground">No conversations yet. Start a chat with a teammate.</div>}
          </div>
        </ScrollArea>
      </aside>
      <section className={`${mobileConversationOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
        {activeConversation ? <>
          <header className="flex items-center gap-3 border-b p-4">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to conversations" onClick={() => setMobileConversationOpen(false)}><ArrowLeft className="h-4 w-4" /></Button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{activeConversation.is_group ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}</span>
            <div className="min-w-0"><h2 className="truncate font-semibold">{conversationLabel(activeConversation)}</h2><p className="text-xs text-muted-foreground">{activeConversation.is_group ? `${activeConversation.members?.length || 0} members` : onlineUserIds.includes(activeConversation.members?.find(member => member.user_id !== user?.id)?.user_id || "") ? "Online" : "Private conversation"}</p></div>
          </header>
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="space-y-4">
              {messages.map(message => {
                const mine = message.sender_id === user?.id;
                const sender = members.find(member => member.user_id === message.sender_id);
                return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {!mine && <p className="mb-1 text-xs font-semibold">{sender?.display_name || displayName(message.sender_id)}</p>}
                    <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                    <p className={`mt-1 text-right text-[10px] ${mine ? "opacity-75" : "text-muted-foreground"}`}>{formatTime(message.created_at)}</p>
                  </div>
                </div>;
              })}
              {typingUserIds.some(id => activeConversation.members?.some(member => member.user_id === id)) && <p className="text-xs italic text-muted-foreground">Someone is typing…</p>}
              {messages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">This conversation is ready. Send the first message.</p>}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t p-3 sm:p-4">
            <Textarea value={messageText} onChange={event => { setMessageText(event.target.value); broadcastTyping(); }} placeholder="Write a message…" rows={1} className="max-h-32 min-h-10 resize-y" maxLength={5000} />
            <Button type="submit" disabled={!messageText.trim() || sending || !activeId} aria-label="Send message" className="shrink-0"><Send className="mr-2 h-4 w-4" />Send</Button>
          </form>
        </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageCircle className="mb-4 h-12 w-12 text-muted-foreground/50" /><h2 className="text-lg font-semibold">Welcome to Team Chat</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Select a conversation or start a new one with a teammate.</p><Button className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />New conversation</Button></div>}
      </section>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Start a conversation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Start a private chat</Label><div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {visibleMembers.map(member => <button key={member.user_id} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted" onClick={() => void openDirectChat(member.user_id)}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">{member.display_name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm">{member.display_name}</span><span className="block text-xs text-muted-foreground">{member.role || "Member"}</span></span><Circle className="h-2.5 w-2.5 text-muted-foreground" /></button>)}
              {visibleMembers.length === 0 && <p className="p-3 text-sm text-muted-foreground">No other members found.</p>}
            </div></div>
            <div className="space-y-2 border-t pt-4"><Label htmlFor="chat-group-title">Or create a group</Label><Input id="chat-group-title" placeholder="Group name (optional)" value={groupTitle} onChange={event => setGroupTitle(event.target.value)} /><div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">{visibleMembers.map(member => <label key={member.user_id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={selectedMembers.includes(member.user_id)} onCheckedChange={checked => setSelectedMembers(current => checked ? [...current, member.user_id] : current.filter(id => id !== member.user_id))} />{member.display_name}</label>)}</div><p className="text-xs text-muted-foreground">Select at least two teammates to create a group.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => void createGroup()} disabled={selectedMembers.length < 2}><Users className="mr-2 h-4 w-4" />Create group</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
