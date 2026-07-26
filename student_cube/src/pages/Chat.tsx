import { useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  EASE_SNAP,
  STAGGER_GAP,
  prefersReducedMotion
} from "../lib/motion";
import {
  ArrowDown,
  ArrowLeft,
  Lock,
  MessageSquare,
  Send,
  User,
  Check,
  CheckCheck,
  CornerUpLeft,
  X,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import { BrutalLoader } from "../components/ui/brutal-loader";

// Helper to fix malformed WS URLs from env vars
const getWsUrl = () => {
  let url = import.meta.env.VITE_WS_URL;
  if (!url) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      const apiUrl = new URL(apiBaseUrl);
      apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      apiUrl.pathname = "/ws/chat";
      apiUrl.search = "";
      return apiUrl.toString();
    }

    return "ws://localhost:5000/ws/chat";
  }

  // Fix common copy-paste mistakes in env vars
  url = url.replace("wss://https://", "wss://");
  url = url.replace("ws://http://", "ws://");
  url = url.replace(".onrender.com.onrender.com", ".onrender.com");

  return url;
};

const WS_URL = getWsUrl();

interface ChatUser {
  id?: string;
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
}

interface ChatMessage {
  _id?: string;
  sender: string | ChatUser;
  receiver?: string | ChatUser;
  text: string;
  // NOTE: "SYSTEM" renders as centered plain text (e.g. "Offer declined")
  // and "BANNER" renders as the green pill (e.g. "Deal completed — listing sold").
  // Align these two literal strings with whatever your backend actually sends.
  kind?: string;
  metadata?: {
    offerId?: string;
    amount?: number;
    status?:
    | "pending"
    | "accepted"
    | "rejected"
    | "revoked"
    | "countered"
    | "on_hold"
    | "failed";
    currentStatus?:
    | "pending"
    | "accepted"
    | "rejected"
    | "revoked"
    | "countered"
    | "on_hold"
    | "failed";
    buyer?: string | ChatUser;
    seller?: string | ChatUser;
    replyTo?: {
      messageId: string;
      text: string;
      senderName: string;
    };
  };
  createdAt?: string;
  deliveryStatus?: "sent" | "read" | "failed";
}

interface ChatListItem {
  chatId: string;
  offerId: string;
  alias?: string;
  product?: {
    _id?: string;
    title?: string;
    price?: number;
    images?: ProductImageValue[];
  };
  otherUser?: ChatUser;
  lastMessage?: string;
  lastMessageAt?: string;
  hasUnread?: boolean;
  offerStatus?: string;
  paymentStatus?: string;
  canSendCustom?: boolean;
  lifecycle?: ChatLifecycle;
}

interface ChatLifecycle {
  status?: string;
  message?: string;
  deleteAfter?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getUserId = (value: string | ChatUser | null | undefined) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const getUserName = (value: string | ChatUser | null | undefined) => {
  if (!value || typeof value === "string") return "User";
  return value.name || value.username || value.email || "User";
};

const getMessageDateKey = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return date.toDateString();
};

const getDateLabel = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

interface MessageItemProps {
  msg: ChatMessage;
  idx: number;
  currentUserId: string;
  canSendCustom: boolean;
  showDateSeparator: boolean;
  onReply?: (msg: ChatMessage) => void;
  offerCardNode: React.ReactNode | null;
}

const MessageItem = memo(({
  msg,
  idx,
  currentUserId,
  canSendCustom,
  showDateSeparator,
  onReply,
  offerCardNode,
}: MessageItemProps) => {
  const senderId = getUserId(msg.sender);
  const isMe = senderId === currentUserId;

  const label = isMe
    ? "Me"
    : canSendCustom
      ? getUserName(msg.sender)
      : "Hidden Student";

  // Centered plain-text status line, e.g. "❌ Offer of ₹18,000 declined."
  if (msg.kind === "SYSTEM") {
    return (
      <div key={msg._id || idx}>
        {showDateSeparator && (
          <div className="flex justify-center my-6">
            <span className="px-3 py-1 bg-paper border-[length:var(--border-w-sm)] border-ink font-mono text-[10px] font-bold text-ink uppercase">
              {getDateLabel(msg.createdAt)}
            </span>
          </div>
        )}
        <div className="flex justify-center py-2">
          <span className="font-mono text-xs font-bold text-ink/60 text-center uppercase">
            {msg.text}
          </span>
        </div>
      </div>
    );
  }

  // Green pill banner, e.g. "Deal completed — listing sold"
  if (msg.kind === "BANNER") {
    return (
      <div key={msg._id || idx} className="flex justify-center py-2">
        <span className="inline-flex items-center gap-1.5 brutal-block-sm bg-campus-green text-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div key={msg._id || idx}>
      {showDateSeparator && (
        <div className="flex justify-center my-6">
          <span className="px-3 py-1 bg-paper border-[var(--border-w-sm)] border-ink font-mono text-[10px] font-bold text-ink uppercase">
            {getDateLabel(msg.createdAt)}
          </span>
        </div>
      )}

      <div className={`flex items-center gap-2 group ${isMe ? "justify-end" : "justify-start"}`}>
        {isMe && onReply && msg.kind !== "OFFER" && msg.kind !== "COUNTER_OFFER" && (
          <button
            onClick={() => onReply(msg)}
            className="p-1 sm:p-2 bg-transparent sm:bg-paper sm:border-[var(--border-w-sm)] sm:border-ink hover:bg-highlighter sm:brutal-block-sm transition-all opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 flex shrink-0 active:scale-95"
            title="Reply"
          >
            <CornerUpLeft className="w-4 h-4 text-ink" />
          </button>
        )}
        {msg.kind === "OFFER" || msg.kind === "COUNTER_OFFER" ? (
          offerCardNode
        ) : (
          <div
            onDoubleClick={() => onReply && msg.kind !== "OFFER" && msg.kind !== "COUNTER_OFFER" ? onReply(msg) : null}
            className={`relative max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 brutal-block-sm font-body font-medium text-sm md:text-base cursor-default select-text ${isMe
              ? "bg-signal-orange text-paper"
              : "bg-paper text-ink"
              }`}
          >
            <div
              className={`font-mono text-[10px] uppercase font-bold mb-1.5 ${isMe ? "text-paper" : "text-ledger-blue"}`}
            >
              {label}
            </div>

            {msg.metadata?.replyTo && (
              <div className={`mb-2 px-3 py-1.5 flex flex-col gap-0.5 rounded-r border-l-4 ${isMe ? "bg-black/20 border-paper" : "bg-black/5 border-ledger-blue"}`}>
                <span className={`font-display text-[10px] uppercase font-bold ${isMe ? "text-paper" : "text-ledger-blue"}`}>
                  {msg.metadata.replyTo.senderName}
                </span>
                <span className={`font-body text-xs line-clamp-2 ${isMe ? "text-paper/90" : "text-ink/90"}`}>
                  {msg.metadata.replyTo.text}
                </span>
              </div>
            )}

            <div className="leading-relaxed whitespace-pre-wrap break-words">
              {msg.text}
            </div>
            <div
              className={`flex justify-end items-center gap-1 mt-2 font-mono text-[9px] font-bold ${isMe ? "text-paper/80" : "text-ink/50"}`}
            >
              <span>
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "Just now"}
              </span>
              {isMe && (
                <span className="flex items-center ml-1">
                  {msg.deliveryStatus === "failed" ? (
                    <XCircle className="w-3.5 h-3.5 text-paper" strokeWidth={3} />
                  ) : msg.deliveryStatus === "read" ? (
                    <CheckCheck className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  )}
                </span>
              )}
            </div>
          </div>
        )}
        {!isMe && onReply && msg.kind !== "OFFER" && msg.kind !== "COUNTER_OFFER" && (
          <button
            onClick={() => onReply(msg)}
            className="p-1 sm:p-2 bg-transparent sm:bg-paper sm:border-[var(--border-w-sm)] sm:border-ink hover:bg-highlighter sm:brutal-block-sm transition-all opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 flex shrink-0 active:scale-95"
            title="Reply"
          >
            <CornerUpLeft className="w-4 h-4 text-ink" />
          </button>
        )}
      </div>
    </div>
  );
});

interface MessagesPaneProps {
  isLoading: boolean;
  messages: ChatMessage[];
  currentUserId: string;
  canSendCustom: boolean;
  chatProduct: ChatListItem["product"] | null;
  chatSellerId: string;
  offerActionLoading: string | null;
  onOfferAction: (
    offerId: string,
    action: "accept" | "reject" | "revoke",
  ) => void;
  offerIdFallback: string;
  onReply?: (msg: ChatMessage) => void;
}

// Mounted with key={offerId} by the parent. Owns its own scroll refs/state,
// so switching chats remounts a fresh instance and everything resets
// naturally — no manual reset effects, no mutating refs during render.
const MessagesPane = ({
  isLoading,
  messages,
  currentUserId,
  canSendCustom,
  chatProduct,
  offerActionLoading,
  onOfferAction,
  offerIdFallback,
  onReply,
}: MessagesPaneProps) => {
  const [showLatestButton, setShowLatestButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  const updateLatestButtonVisibility = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 140;
    setShowLatestButton(distanceFromBottom > 140);
  };

  // Pure DOM/ref side effect, no React state — safe to call from effects.
  // The resulting native scroll event fires onScroll above, which is what
  // actually updates showLatestButton, so effects never call setState directly.
  const jumpToBottom = (behavior: ScrollBehavior) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
    isNearBottomRef.current = true;
  };

  // Used by the "Latest" button's click handler — a real user action, so
  // updating state directly here (not inside an effect) is the normal case.
  const scrollToLatestMessage = () => {
    jumpToBottom("smooth");
    setShowLatestButton(false);
  };

  const isInitialLoadRef = useRef(true);
  const messageCount = messages.length;

  // Auto-scroll logic:
  // 1. On initial history load: instant scroll BEFORE paint to completely prevent jitter/glimpse of top.
  // 2. On new messages: snap instantly ("auto") to avoid animation conflicts
  useLayoutEffect(() => {
    if (messageCount === 0) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      jumpToBottom("auto");
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const lastIsMine = getUserId(lastMessage.sender) === currentUserId;

    if (isNearBottomRef.current || lastIsMine) {
      jumpToBottom("auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  const isLatestOfferActivity = (messageIndex: number) => {
    const currentOfferId = messages[messageIndex]?.metadata?.offerId;
    if (!currentOfferId) return false;

    for (let index = messages.length - 1; index > messageIndex; index -= 1) {
      const message = messages[index];
      if (
        (message?.kind === "OFFER" || message?.kind === "COUNTER_OFFER") &&
        message.metadata?.offerId === currentOfferId
      ) {
        return false;
      }
    }

    return true;
  };

  const renderOfferCard = (msg: ChatMessage, isLatestActivity: boolean) => {
    const offerCardId = msg.metadata?.offerId || offerIdFallback;
    const amount = Number(msg.metadata?.amount || 0);
    const currentStatus =
      msg.metadata?.currentStatus || msg.metadata?.status || "pending";
    const status = isLatestActivity
      ? currentStatus
      : msg.metadata?.status || "pending";
    const buyerId = getUserId(msg.metadata?.buyer);
    const sellerId = getUserId(msg.metadata?.seller);
    const isSeller = sellerId === currentUserId;
    const isBuyer = buyerId === currentUserId;
    const canAct = isLatestActivity && currentStatus === "pending";

    let bgColor = "bg-paper";
    let borderColor = "border-ink";
    let tagColor = "bg-paper text-ink";
    let icon = "";

    if (status === "accepted") {
      bgColor = "bg-campus-green";
      borderColor = "border-ink";
      tagColor = "bg-ink text-campus-green";
      icon = "";
    } else if (status === "rejected" || status === "revoked") {
      bgColor = "bg-stamp-red";
      borderColor = "border-ink";
      tagColor = "bg-ink text-stamp-red";
      icon = "❌";
    }

    return (
      <div
        className={`w-full max-w-sm brutal-block border-[length:var(--border-w)] ${borderColor} ${bgColor} p-4 md:p-6 text-ink shadow-none`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${status === "accepted" || status === "rejected" || status === "revoked" ? "text-ink" : "text-ink/70"}`}>
            {icon} {status === "pending" ? "Offer Received" : `Offer ${status}`}
          </span>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-1 uppercase border-[var(--border-w-sm)] border-ink ${tagColor}`}
          >
            {status}
          </span>
        </div>

        <div className="mt-1">
          <p className="font-mono text-3xl font-black text-ink">
            ₹{amount.toLocaleString("en-IN")}
          </p>
          <p className={`font-mono text-xs font-bold mt-2 ${status === "accepted" || status === "rejected" || status === "revoked" ? "text-ink" : "text-ink/70"}`}>
            For: {chatProduct?.title || "Product"}
          </p>
        </div>

        {canAct && (
          <div className="mt-6 flex gap-3">
            {isSeller && (
              <>
                <button
                  type="button"
                  disabled={Boolean(offerActionLoading)}
                  onClick={() => onOfferAction(offerCardId, "accept")}
                  className="flex-1 brutal-block-sm bg-campus-green px-3 py-3 font-display uppercase text-sm font-bold text-ink hover:bg-paper disabled:opacity-50 transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={Boolean(offerActionLoading)}
                  onClick={() => onOfferAction(offerCardId, "reject")}
                  className="flex-1 brutal-block-sm bg-paper px-3 py-3 font-display uppercase text-sm font-bold text-stamp-red hover:bg-stamp-red hover:text-paper disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
              </>
            )}
            {isBuyer && (
              <button
                type="button"
                disabled={Boolean(offerActionLoading)}
                onClick={() => onOfferAction(offerCardId, "revoke")}
                className="w-full brutal-block-sm bg-paper px-3 py-3 font-display uppercase text-sm font-bold text-stamp-red hover:bg-stamp-red hover:text-paper disabled:opacity-50 transition-colors"
              >
                Cancel Offer
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={messagesContainerRef}
        onScroll={updateLatestButtonVisibility}
        className="h-full overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-paper-blue"
      >
        {isLoading ? (
          <div className="flex justify-center py-20">
            <BrutalLoader size="sm" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink/50">
            <div className="w-16 h-16 bg-paper border-[length:var(--border-w)] border-ink flex items-center justify-center mb-6 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <Send className="w-6 h-6 text-ink/30" />
            </div>
            <p className="font-display text-xl font-bold uppercase text-ink">No messages yet.</p>
            <p className="font-body text-sm font-medium mt-2">Offers and chat messages will appear here.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const showDateSeparator =
              idx === 0 ||
              getMessageDateKey(msg.createdAt) !==
              getMessageDateKey(messages[idx - 1]?.createdAt);

            const isOfferCard = msg.kind === "OFFER" || msg.kind === "COUNTER_OFFER";
            const offerCardNode = isOfferCard ? renderOfferCard(msg, isLatestOfferActivity(idx)) : null;

            return (
              <MessageItem
                key={msg._id || idx}
                msg={msg}
                idx={idx}
                currentUserId={currentUserId}
                canSendCustom={canSendCustom}
                showDateSeparator={showDateSeparator}
                onReply={onReply}
                offerCardNode={offerCardNode}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showLatestButton && (
        <button
          type="button"
          onClick={scrollToLatestMessage}
          className="absolute bottom-6 right-6 z-10 flex items-center gap-2 brutal-block-sm bg-highlighter px-4 py-3 font-display uppercase font-bold text-sm text-ink hover:bg-signal-orange hover:text-paper transition-colors"
        >
          Latest
          <ArrowDown className="w-4 h-4" strokeWidth={3} />
        </button>
      )}
    </div>
  );
};

const Chat = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const currentUserId = user?._id || (user as { id?: string } | null)?.id || "";

  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: chats = [], isLoading: isChatsLoading } = useQuery<ChatListItem[]>({
    queryKey: ['chatInbox'],
    queryFn: async () => {
      const res = await api.get("/chat");
      return res.data.data || [];
    },
    staleTime: 1000 * 30, // 30 seconds — inbox needs freshness for unread badges
    gcTime: 1000 * 60 * 2, // 2 min garbage collection (default is 5 min)
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prePaymentMessages, setPrePaymentMessages] = useState<string[]>([]);
  const [canSendCustom, setCanSendCustom] = useState(false);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<ChatLifecycle | null>(null);
  const [chatTitle, setChatTitle] = useState("Chat");
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [chatProduct, setChatProduct] = useState<
    ChatListItem["product"] | null
  >(null);
  const [chatSellerId, setChatSellerId] = useState("");
  const [isOfferBoxOpen, setIsOfferBoxOpen] = useState(false);
  const [chatOfferPrice, setChatOfferPrice] = useState("");
  const [isSubmittingChatOffer, setIsSubmittingChatOffer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [offerActionLoading, setOfferActionLoading] = useState<string | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const lastSentAtRef = useRef<number>(0);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    if (sidebarRef.current && chats.length > 0) {
      gsap.fromTo(".chat-sidebar-item",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: STAGGER_GAP / 2,
          ease: EASE_SNAP,
        }
      );
    }
    if (chatRef.current) {
      gsap.fromTo(chatRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        }
      );
    }
  }, { dependencies: [sidebarRef.current, chatRef.current, chats.length] });

  const confirmClearChat = async () => {
    if (!offerId) return;

    try {
      await api.delete(`/chat/${offerId}/clear`);
      setMessages([]);
      toast.success("Chat cleared");
      setShowClearAlert(false);
    } catch (error) {
      console.error("Failed to clear chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const quickMessagesRef = useRef<HTMLDivElement | null>(null);

  const handleQuickMessagesScroll = () => {
    if (!quickMessagesRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = quickMessagesRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    handleQuickMessagesScroll();
    window.addEventListener('resize', handleQuickMessagesScroll);
    return () => window.removeEventListener('resize', handleQuickMessagesScroll);
  }, [prePaymentMessages]);

  const scrollQuickMessages = (direction: 'left' | 'right') => {
    if (quickMessagesRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      quickMessagesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const markCurrentChatRead = async (nextOfferId = offerId) => {
    if (!nextOfferId) return;

    try {
      await api.put(`/chat/${nextOfferId}/read`);
      queryClient.setQueryData<ChatListItem[]>(['chatInbox'], (current = []) =>
        current.map((chat) =>
          chat.offerId === nextOfferId ? { ...chat, hasUnread: false } : chat,
        ),
      );
      window.dispatchEvent(new Event("student-cube-chat-read-change"));
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  // Removed fetchChats since React Query handles it automatically.
  // Invalidations will trigger a refetch in the background.

  const { data: chatData, isLoading: isQueryLoading, isError } = useQuery({
    queryKey: ['chatHistory', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const res = await api.get(`/chat/${offerId}`);
      return res.data;
    },
    enabled: !!offerId,
    staleTime: 1000 * 60 * 5, // 5 min — avoid background refetches that overwrite WebSocket-updated messages
    gcTime: 1000 * 60 * 2, // 2 min garbage collection
    refetchOnWindowFocus: false, // WebSocket handles live updates; don't overwrite with stale API data
    refetchOnReconnect: false,
  });

  // Conversation state belongs to one offer only. Clear it before loading the
  // next offer so cached messages from the previously selected chat cannot be
  // rendered in the new chat window.
  useEffect(() => {
    setMessages([]);
    setIsLoading(true);
    setCanSendCustom(false);
    setPrePaymentMessages([]);
    setLockedMessage(null);
    setLifecycle(null);
    setChatTitle("Chat");
    setOtherUser(null);
    setChatProduct(null);
    setChatSellerId("");
    setReplyingTo(null);
  }, [offerId]);

  useEffect(() => {
    if (isError) {
      toast.error("Unable to open this chat.");
      navigate("/chat", { replace: true });
    }
  }, [isError, navigate]);

  useEffect(() => {
    if (offerId && chatData?.success) {
      // Merge API messages with local state using dedup by _id.
      // Handles all scenarios correctly:
      // 1. Initial load (prev empty) → all API messages populate
      // 2. Background refetch (WebSocket active) → only truly new API msgs added, overwrite prevented
      // 3. Return visit (was away, new msgs arrived) → API fresh data merged into existing messages
      setMessages(prev => {
        if (prev.length === 0) return chatData.data || [];
        const existingIds = new Set(prev.map(m => m._id).filter(Boolean));
        const apiMessages: ChatMessage[] = chatData.data || [];
        const newFromApi = apiMessages.filter(m => m._id && !existingIds.has(m._id));
        if (newFromApi.length === 0) return prev;
        return [...prev, ...newFromApi];
      });
      setCanSendCustom(Boolean(chatData.canSendCustom));
      setLockedMessage(chatData.lockedMessage);
      setLifecycle(chatData.lifecycle || null);
      setPrePaymentMessages(chatData.prePaymentMessages || []);
      setChatTitle(
        chatData.alias || chatData.product?.title || "Product Chat",
      );
      setChatProduct(chatData.product || null);

      const buyerId = getUserId(chatData.buyer);
      const sellerId = getUserId(chatData.seller);
      setChatSellerId(sellerId);
      setOtherUser(
        buyerId === currentUserId ? chatData.seller : chatData.buyer,
      );
      markCurrentChatRead(offerId);
      setIsLoading(false);
    }
  }, [chatData, offerId, currentUserId]);

  useEffect(() => {
    if (isQueryLoading) {
      // Clear chat only when actually fetching new uncached data
      setIsLoading(true);
      // Only clear messages on INITIAL load (when messages array is empty from mount),
      // not on background refetches that would wipe WebSocket-updated messages.
      setMessages((prev) => prev.length > 0 ? prev : []);
    }
  }, [isQueryLoading]);

  useEffect(() => {
    let timeoutId: number;

    const handleRealtime = (event: Event) => {
      const payload = (event as CustomEvent).detail || {};
      const eventOfferId = payload.offerId;

      if (
        payload.type === "message" &&
        eventOfferId === offerId &&
        payload.message
      ) {
        setMessages((current) => {
          const clientMessageId = payload.message.clientMessageId;
          const optimisticIndex = clientMessageId
            ? current.findIndex((message) => message._id === clientMessageId)
            : -1;

          if (optimisticIndex !== -1) {
            const nextMessages = [...current];
            nextMessages[optimisticIndex] = payload.message;
            return nextMessages;
          }

          if (
            payload.message._id &&
            current.some((message) => message._id === payload.message._id)
          ) {
            return current;
          }

          return [...current, payload.message];
        });
      }

      if (payload.type === "offer_updated" && eventOfferId && payload.status) {
        setMessages((current) =>
          current.map((message) =>
            (message.kind === "OFFER" || message.kind === "COUNTER_OFFER") &&
            message.metadata?.offerId === eventOfferId
              ? {
                  ...message,
                  metadata: {
                    ...message.metadata,
                    status: payload.status,
                    currentStatus: payload.status,
                  },
                }
              : message,
          ),
        );
      }

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['chatInbox'] });

        if (eventOfferId) {
          if (eventOfferId !== offerId) {
            queryClient.invalidateQueries({ queryKey: ['chatHistory', eventOfferId] });
          } else {
            // A room broadcast can be missed while this socket is joining or
            // reconnecting. The user-level update is the reliable fallback.
            if (payload.type === "chat_updated") {
              queryClient.invalidateQueries({ queryKey: ['chatHistory', eventOfferId] });
            }

            if (payload.type === "offer_updated" || payload.type === "payment_updated") {
            if (chatProduct?._id) {
              queryClient.invalidateQueries({ queryKey: ["product", chatProduct._id] });
            } else {
              queryClient.invalidateQueries({ queryKey: ["product"] });
            }
            queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ['chatHistory', eventOfferId] });
            }
          }
        }
      }, 500);
    };

    window.addEventListener("student-cube-realtime", handleRealtime);
    return () => {
      window.removeEventListener("student-cube-realtime", handleRealtime);
      window.clearTimeout(timeoutId);
    };
  }, [offerId, queryClient]);

  useEffect(() => {
    if (!offerId || !token) return;

    let ws: WebSocket | null = null;
    let isIntentionalClose = false;
    let reconnectTimeout: number;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsSocketReady(true);
        ws?.send(JSON.stringify({ type: "join", offerId }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "joined" && payload.offerId === offerId) {
            // The server has now registered this connection in the offer room.
            // Refresh once to recover any messages sent while the room joined.
            queryClient.invalidateQueries({ queryKey: ['chatHistory', offerId] });
            return;
          }

          if (payload.type === "message") {
            if (payload.offerId && payload.offerId !== offerId) return;

            setMessages((prev) => {
              // Deduplicate or replace optimistic messages using clientMessageId
              if (payload.message?.clientMessageId) {
                const existingIndex = prev.findIndex(
                  (msg) => msg._id === payload.message.clientMessageId
                );
                if (existingIndex !== -1) {
                  const newMessages = [...prev];
                  const isIncoming = getUserId(payload.message?.sender) !== currentUserId;
                  newMessages[existingIndex] = {
                    ...payload.message,
                    deliveryStatus: isIncoming ? "read" : payload.message?.deliveryStatus || "sent",
                  };
                  return newMessages;
                }
              }

              if (
                payload.message?._id &&
                prev.some((msg) => msg._id === payload.message._id)
              ) {
                return prev;
              }
              const isIncoming =
                getUserId(payload.message?.sender) !== currentUserId;
              return [
                ...prev,
                {
                  ...payload.message,
                  deliveryStatus: isIncoming
                    ? "read"
                    : payload.message?.deliveryStatus || "sent",
                },
              ];
            });

            if (getUserId(payload.message?.sender) !== currentUserId) {
              markCurrentChatRead(offerId);
            }
          }

          if (payload.type === "error") {
            toast.error(payload.message || "Chat error.");
          }

          if (payload.type === "chat_read") {
            if (payload.offerId === offerId) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.deliveryStatus !== "read" && getUserId(msg.sender) === currentUserId
                    ? { ...msg, deliveryStatus: "read" }
                    : msg
                )
              );
            }
          }
        } catch (error) {
          console.error("Invalid chat socket message:", error);
        }
      };

      ws.onclose = () => {
        if (!isIntentionalClose) {
          setIsSocketReady(false);
          // BUG-009: Automatic reconnect with 3s backoff
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        if (isIntentionalClose) return;
        setIsSocketReady(false);
        // Error will trigger onclose which handles the reconnect
      };
    };

    connect();

    return () => {
      isIntentionalClose = true;
      window.clearTimeout(reconnectTimeout);
      
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;

        if (wsRef.current === ws) {
          wsRef.current = null;
          setIsSocketReady(false);
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws?.close();
        }
      }
    };
  }, [offerId, token, queryClient, currentUserId]);

  // function for payment - implement your logic here
  const handleUnlockPayment = async () => {
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        return;
      }

      const toastId = toast.loading("Initiating payment...");
      const orderResponse = await api.post("/payment/create-order", {
        offerId,
      });

      if (!orderResponse.data.success) {
        toast.error("Could not create order.", { id: toastId });
        return;
      }

      toast.dismiss(toastId);
      const { orderId, amount, currency } = orderResponse.data;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Student Cube",
        description: "Unlock Secure Chat",
        order_id: orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyToastId = toast.loading("Verifying payment...");
            const verifyRes = await api.post("/payment/verify-signature", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              offerId: offerId,
            });

            if (verifyRes.data.success) {
              toast.success("Payment Successful! Chat Unlocked.", {
                id: verifyToastId,
              });
              queryClient.invalidateQueries({ queryKey: ['chatHistory', offerId] });
              setCanSendCustom(true);
            } else {
              toast.error("Payment verification failed.", {
                id: verifyToastId,
              });
            }
          } catch {
            toast.error("Server error during verification.");
          }
        },
        prefill: {
          name: user?.name || "Student",
          email: user?.email || "",
        },
        theme: {
          color: "#336E7A",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on(
        "payment.failed",
        function (response: { error: { description: string } }) {
          toast.error(response.error.description || "Payment failed");
        },
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Something went wrong!";
      toast.error(`Payment Error: ${errorMsg}`);
      console.error("Payment Error details:", error);
    }
  };

  const sendMessage = (text: string, kind: "CUSTOM" | "PREDEFINED") => {
    const trimmedText = text.trim();
    if (!offerId || !trimmedText) return;

    lastSentAtRef.current = Date.now();

    if (!canSendCustom && kind === "CUSTOM") {
      toast.error(
        "Payment is not done yet. You can't talk fully until payment is verified.",
      );
      return;
    }

    if (!isSocketReady || wsRef.current?.readyState !== WebSocket.OPEN) {
      toast.error("Chat is reconnecting. Please try again.");
      return;
    }

    const clientMessageId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Optimistically update the UI so it feels instantaneous (no 1-2 second delay)
    const optimisticMessage: ChatMessage = {
      _id: clientMessageId,
      text: trimmedText,
      kind,
      sender: user || currentUserId, // pass populated user to avoid "User" display
      createdAt: new Date().toISOString(),
      deliveryStatus: "sent",
      metadata: replyingTo ? {
        replyTo: {
          messageId: replyingTo._id || "",
          text: replyingTo.text,
          senderName: getUserId(replyingTo.sender) === currentUserId
            ? "You"
            : getUserName(replyingTo.sender) || "Student"
        }
      } : {},
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        offerId,
        text: trimmedText,
        kind,
        clientMessageId,
        metadata: replyingTo ? {
          replyTo: {
            messageId: replyingTo._id || "",
            text: replyingTo.text,
            senderName: getUserId(replyingTo.sender) === currentUserId
              ? "You"
              : getUserName(replyingTo.sender) || "Student"
          }
        } : {},
      }),
    );
    setReplyingTo(null);

    // BUG-008: Unconfirmed message timeout loop
    setTimeout(() => {
      setMessages((currentMessages) => {
        const msgIndex = currentMessages.findIndex((m) => m._id === clientMessageId);
        // If the message is still in the state with the temporary clientMessageId,
        // it means the server never sent a broadcast back to replace it with a real DB ID.
        if (msgIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[msgIndex] = {
            ...updatedMessages[msgIndex],
            deliveryStatus: "failed",
          };
          return updatedMessages;
        }
        return currentMessages;
      });
    }, 5000);
  };

  const getLatestOfferId = () => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.kind === "OFFER" && message.metadata?.offerId) {
        return message.metadata.offerId || "";
      }
    }

    return offerId || "";
  };

  const handleQuickMessage = (text: string) => {
    if (text.toLowerCase() === "present an offer") {
      setIsOfferBoxOpen(true);
      return;
    }

    sendMessage(text, "PREDEFINED");
  };

  const handleChatOfferSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();

    const amount = Number(chatOfferPrice);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid offer amount.");
      return;
    }

    if (chatProduct?.price && amount > Number(chatProduct.price)) {
      toast.error("Offer cannot be more than the listing price.");
      return;
    }

    setIsSubmittingChatOffer(true);
    try {
      if (chatSellerId === currentUserId) {
        const latestOfferId = getLatestOfferId();
        const response = await api.put(`/offers/counter/${latestOfferId}`, {
          counterPrice: amount,
        });
        updateOfferMessages(
          latestOfferId,
          response.data.offer?.status || "countered",
        );
        toast.success(response.data.message || "Counter offer sent.");
      } else {
        if (!chatProduct?._id) {
          toast.error("Product details are not ready yet.");
          return;
        }

        const response = await api.post("/offers/make", {
          productId: chatProduct._id,
          offerPrice: amount,
        });
        toast.success(response.data.message || "Offer sent.");
      }

      setChatOfferPrice("");
      setIsOfferBoxOpen(false);
      queryClient.invalidateQueries({ queryKey: ['chatHistory', offerId] });
      queryClient.invalidateQueries({ queryKey: ['chatInbox'] });
    } catch (error: unknown) {
      let message = "Unable to send offer.";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
      ) {
        message = (error as { response: { data: { message: string } } })
          .response.data.message;
      }
      toast.error(message);
    } finally {
      setIsSubmittingChatOffer(false);
    }
  };

  const updateOfferMessages = (
    nextOfferId: string,
    status: NonNullable<ChatMessage["metadata"]>["status"],
  ) => {
    setMessages((current) =>
      current.map((message) =>
        (message.kind === "OFFER" || message.kind === "COUNTER_OFFER") &&
        message.metadata?.offerId === nextOfferId
          ? {
              ...message,
              metadata: {
                ...message.metadata,
                status,
                // The action controls use currentStatus so update it alongside
                // the display status as soon as the offer receives a response.
                currentStatus: status,
              },
            }
          : message,
      ),
    );
  };

  const handleOfferCardAction = async (
    nextOfferId: string,
    action: "accept" | "reject" | "revoke",
  ) => {
    setOfferActionLoading(`${nextOfferId}:${action}`);

    try {
      const endpoint =
        action === "accept"
          ? `/offers/accept/${nextOfferId}`
          : action === "reject"
            ? `/offers/reject/${nextOfferId}`
            : `/offers/buyer/revoke/${nextOfferId}`;

      const res = await api.put(endpoint);
      const nextStatus =
        res.data.offer?.status ||
        (action === "accept"
          ? "accepted"
          : action === "reject"
            ? "rejected"
            : "revoked");

      updateOfferMessages(nextOfferId, nextStatus);
      toast.success(res.data.message || "Offer updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update offer.";
      toast.error(message);
    } finally {
      setOfferActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="p-10 text-center font-bold text-slate-600">
        Please login to view chats.
      </div>
    );
  }

  const sidebar = (
    <div
      ref={sidebarRef}
      className={`${offerId ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 shrink-0 flex-col border-r-[length:var(--border-w)] border-ink bg-paper z-20 relative`}
    >
      <div className="px-6 py-5 border-b-[length:var(--border-w)] border-ink shrink-0 bg-highlighter">
        <h1 className="text-2xl font-display font-black uppercase tracking-tight text-[#0A0A0A]">Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto bg-paper">
        {isChatsLoading && chats.length === 0 ? (
          <div className="flex justify-center py-20">
            <BrutalLoader size="sm" />
          </div>
        ) : chats.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-semibold text-sm">
            No chats yet. Make an offer to start a deal conversation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {chats.map((chat) => {
              const isActive = chat.offerId === offerId;
              return (
                <Link
                  key={chat.chatId}
                  to={`/chat/${chat.offerId}`}
                  className={`chat-sidebar-item relative flex items-center gap-4 p-4 md:p-5 transition-colors border-b-[var(--border-w-sm)] border-ink/10 ${isActive ? "bg-paper-blue" : "bg-paper hover:bg-highlighter/20"
                    }`}
                >
                  {chat.hasUnread && (
                    <span className="absolute right-4 top-4 w-3 h-3 bg-stamp-red border-[2px] border-ink" style={{ borderRadius: 'var(--radius)' }} />
                  )}
                  <div className="w-14 h-14 bg-paper-blue border-[length:var(--border-w)] border-ink overflow-hidden shrink-0" style={{ borderRadius: 'var(--radius)' }}>
                    {chat.product?.images?.[0] ? (
                      <img
                        src={getProductImageUrl(chat.product.images[0])}
                        alt={chat.product?.title || "Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink/30">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display font-bold uppercase tracking-tight text-ink truncate text-base">
                        {chat.alias || chat.product?.title || "Product Chat"}
                      </h2>
                      <span
                        className={`font-mono text-[9px] uppercase font-bold px-2 py-0.5 border-[var(--border-w-sm)] border-ink shrink-0 ${chat.canSendCustom ? "bg-campus-green text-paper" : "bg-signal-orange text-paper"}`}
                      >
                        {chat.canSendCustom ? "Unlocked" : "Limited"}
                      </span>
                    </div>
                    <p className="font-body text-sm text-ink/70 truncate mt-1">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                    {chat.lifecycle?.message && (
                      <p className="font-mono text-[10px] uppercase font-bold text-stamp-red truncate mt-1">
                        {chat.lifecycle.message}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (!offerId) {
    return (
      <div className="h-[calc(100dvh-80px)] overflow-hidden bg-paper flex w-full relative">
        {sidebar}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-ink/40 bg-paper">
          <div className="w-20 h-20 bg-paper-blue border-[length:var(--border-w)] border-ink flex items-center justify-center mb-6" style={{ borderRadius: 'var(--radius)' }}>
            <MessageSquare className="w-8 h-8 text-ink/30" />
          </div>
          <p className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Select a conversation</p>
          <p className="font-body text-sm font-medium mt-2">Choose a chat from the left to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-80px)] overflow-hidden bg-paper flex w-full relative">
      {sidebar}
      <div ref={chatRef} className="flex-1 flex flex-col min-w-0 bg-paper">
        <div className="bg-paper px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 border-b-[length:var(--border-w)] border-ink shadow-none z-10 shrink-0">
          <button
            onClick={() => navigate("/chat")}
            className="p-2 sm:p-3 bg-paper border-[var(--border-w-sm)] border-ink hover:bg-highlighter brutal-block-sm transition-colors md:hidden shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-ink" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ledger-blue border-[length:var(--border-w)] border-ink flex items-center justify-center text-paper shrink-0" style={{ borderRadius: 'var(--radius)' }}>
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg sm:text-xl uppercase font-bold tracking-tight text-ink truncate">
                {chatTitle}
              </h2>
              <p className="font-mono text-[10px] sm:text-xs font-bold text-ink truncate uppercase mt-0.5">
                {canSendCustom ? getUserName(otherUser) : "Hidden Student"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {chatProduct?._id && (
              <Link
                to={`/product/${chatProduct._id}`}
                className="brutal-block-sm bg-paper px-2 sm:px-4 py-1.5 sm:py-2 font-display text-[10px] sm:text-sm font-bold uppercase tracking-tight text-ink hover:bg-paper-blue transition-colors flex items-center justify-center"
              >
                <span className="sm:hidden">Info</span>
                <span className="hidden sm:inline">Product Info</span>
              </Link>
            )}
            <button
              onClick={() => setShowClearAlert(true)}
              className="brutal-block-sm bg-paper p-1.5 sm:p-2 text-stamp-red hover:bg-stamp-red hover:text-paper transition-colors flex items-center justify-center"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {!canSendCustom && lockedMessage && (
          <div className="bg-stamp-red border-b-[length:var(--border-w)] border-ink px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-paper font-bold font-body flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 text-paper w-full">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 sm:mt-0" strokeWidth={2.5} />
              <span className="leading-snug flex-1">{lockedMessage}</span>
            </div>

            {currentUserId !== chatSellerId && (
              <button
                onClick={handleUnlockPayment}
                className="bg-paper text-stamp-red hover:bg-paper-blue px-3 sm:px-4 py-1.5 sm:py-2 brutal-block-sm font-display uppercase font-bold text-xs sm:text-sm transition-colors shrink-0 whitespace-nowrap self-end sm:self-auto"
              >
                Pay ₹9
              </button>
            )}
          </div>
        )}

        {lifecycle?.message && (
          <div className="bg-paper-blue border-b border-ink px-4 py-3 text-sm text-ink font-semibold shrink-0">
            <div>{lifecycle.message}</div>
            {lifecycle.deleteAfter && (
              <div className="text-xs text-ink/70 mt-1">
                Scheduled deletion:{" "}
                {new Date(lifecycle.deleteAfter).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <MessagesPane
          key={offerId}
          isLoading={isLoading}
          messages={messages}
          currentUserId={currentUserId}
          canSendCustom={canSendCustom}
          chatProduct={chatProduct}
          chatSellerId={chatSellerId}
          offerActionLoading={offerActionLoading}
          onOfferAction={handleOfferCardAction}
          offerIdFallback={offerId || ""}
          onReply={handleReply}
        />

        <div className="bg-paper p-3 sm:p-4 md:p-6 border-t-[length:var(--border-w)] border-ink shrink-0 z-10">
          {!canSendCustom && prePaymentMessages.length > 0 && (
            <div className="flex items-start gap-2 relative group pb-1">
              {showLeftArrow && (
                <button
                  type="button"
                  onClick={() => scrollQuickMessages('left')}
                  className="p-1 sm:p-1.5 bg-ink text-paper hover:bg-ledger-blue shrink-0 transition-all absolute left-0 z-10 -ml-2 sm:-ml-4 flex mt-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div
                ref={quickMessagesRef}
                onScroll={handleQuickMessagesScroll}
                className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth flex-1 px-1 pb-3"
              >
                {prePaymentMessages.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => handleQuickMessage(text)}
                    className="shrink-0 border-[length:var(--border-w)] border-ink bg-paper-blue px-3 sm:px-4 py-1.5 sm:py-2 font-body font-bold text-[11px] sm:text-sm text-ink hover:bg-highlighter transition-colors whitespace-nowrap"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {showRightArrow && (
                <button
                  type="button"
                  onClick={() => scrollQuickMessages('right')}
                  className="p-1 sm:p-1.5 bg-ink text-paper hover:bg-ledger-blue shrink-0 transition-all absolute right-0 z-10 -mr-2 sm:-mr-4 flex mt-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {isOfferBoxOpen && (
            <form
              onSubmit={handleChatOfferSubmit}
              className="mb-4 flex flex-wrap sm:flex-nowrap gap-3 bg-paper p-4 brutal-block border-[length:var(--border-w)] border-ink"
            >
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-ink">
                  ₹
                </span>
                <input
                  type="number"
                  value={chatOfferPrice}
                  max={chatProduct?.price}
                  onChange={(event) => setChatOfferPrice(event.target.value)}
                  placeholder={
                    chatSellerId === currentUserId
                      ? "Counter amount"
                      : "Offer amount"
                  }
                  className="w-full bg-paper brutal-block-sm py-3 pl-8 pr-4 font-mono font-bold text-ink outline-none focus:ring-2 focus:ring-ledger-blue focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsOfferBoxOpen(false);
                    setChatOfferPrice("");
                  }}
                  className="flex-1 sm:flex-none brutal-block-sm bg-paper px-6 py-3 font-display uppercase font-bold text-sm text-ink hover:bg-paper-blue transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingChatOffer}
                  className="flex-1 sm:flex-none brutal-block-sm bg-ledger-blue px-6 py-3 font-display uppercase font-bold text-sm text-paper hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingChatOffer ? "Sending" : "Send"}
                </button>
              </div>
            </form>
          )}

          <MessageInputForm
            canSendCustom={canSendCustom}
            onSendMessage={(text) => sendMessage(text, "CUSTOM")}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      </div>

      {showClearAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-paper brutal-block border-[length:var(--border-w)] border-ink max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-stamp-red">
              <Trash2 className="w-6 h-6" strokeWidth={2.5} />
              <h3 className="font-display text-xl uppercase font-bold tracking-tight text-ink">Clear Chat</h3>
            </div>
            <p className="font-body text-sm font-medium text-ink/80 leading-relaxed">
              Are you sure you want to clear this chat? This will remove all messages for you, but they will still be visible to the other person.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowClearAlert(false)}
                className="brutal-block-sm px-4 py-2 bg-paper font-display text-sm uppercase font-bold hover:bg-highlighter transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                className="brutal-block-sm px-4 py-2 bg-stamp-red text-paper font-display text-sm uppercase font-bold hover:bg-ink transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MessageInputForm = ({
  canSendCustom,
  onSendMessage,
  replyingTo,
  onCancelReply,
}: {
  canSendCustom: boolean;
  onSendMessage: (text: string) => void;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!text.trim() || !canSendCustom) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {replyingTo && (
        <div className="flex items-center justify-between bg-paper-blue border-[var(--border-w-sm)] border-ink brutal-block-sm p-3 gap-3">
          <div className="flex flex-col min-w-0">
            <span className="font-display text-[10px] uppercase font-bold text-ledger-blue">
              Replying to {replyingTo.sender === (window as any).currentUserId ? "You" : getUserName(replyingTo.sender)}
            </span>
            <span className="font-body text-xs text-ink/70 truncate">
              {replyingTo.text}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 hover:bg-ink/10 rounded transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-ink" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            canSendCustom
              ? "Type a message..."
              : "Unlock chat to type..."
          }
          disabled={!canSendCustom}
          className="flex-1 min-w-0 bg-paper brutal-block-sm px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 font-body font-medium text-sm sm:text-base text-ink outline-none focus:ring-2 focus:ring-ledger-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!text.trim() || !canSendCustom}
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 brutal-block-sm bg-signal-orange hover:bg-highlighter disabled:opacity-50 disabled:hover:bg-signal-orange text-ink rounded-none flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ml-0.5 sm:ml-1" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
