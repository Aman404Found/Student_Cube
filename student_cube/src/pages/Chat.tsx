import { useState, useEffect, useCallback, useRef } from "react";
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
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { getProductImageUrl } from "../utils/productImages";
import type { ProductImageValue } from "../utils/productImages";
import { BrutalLoader } from "../components/ui/brutal-loader";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/chat";

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
  };
  createdAt?: string;
  deliveryStatus?: "sent" | "read";
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
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    isNearBottomRef.current = true;
  };

  // Used by the "Latest" button's click handler — a real user action, so
  // updating state directly here (not inside an effect) is the normal case.
  const scrollToLatestMessage = () => {
    jumpToBottom("smooth");
    setShowLatestButton(false);
  };

  // Jump to the bottom once, right after this chat's messages first render.
  useEffect(() => {
    jumpToBottom("auto");
  }, []);

  // Auto-scroll on new messages: smoothly, but only if the user is already
  // near the bottom (e.g. they just sent a message, or a message arrived
  // while they were reading recent history). If they've scrolled up into
  // older history, leave them there — showLatestButton is already true
  // from their own scroll interaction, so there's nothing to update.
  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastIsMine = getUserId(lastMessage.sender) === currentUserId;

    if (isNearBottomRef.current || lastIsMine) {
      jumpToBottom("smooth");
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
    let icon = "🏷️";

    if (status === "accepted") {
      bgColor = "bg-campus-green";
      borderColor = "border-ink";
      tagColor = "bg-ink text-campus-green";
      icon = "✅";
    } else if (status === "rejected" || status === "revoked") {
      bgColor = "bg-stamp-red";
      borderColor = "border-ink";
      tagColor = "bg-ink text-stamp-red";
      icon = "❌";
    }

    return (
      <div
        className={`w-full max-w-sm brutal-block border-[var(--border-w)] ${borderColor} ${bgColor} p-4 md:p-6 text-ink shadow-none`}
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
                className="w-full brutal-block-sm bg-ink px-3 py-3 font-display uppercase text-sm font-bold text-paper hover:bg-stamp-red hover:text-paper disabled:opacity-50 transition-colors"
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
            <div className="w-16 h-16 bg-paper border-[var(--border-w)] border-ink flex items-center justify-center mb-6 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <Send className="w-6 h-6 text-ink/30" />
            </div>
            <p className="font-display text-xl font-bold uppercase text-ink">No messages yet.</p>
            <p className="font-body text-sm font-medium mt-2">Offers and chat messages will appear here.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = getUserId(msg.sender);
            const isMe = senderId === currentUserId;

            const label = isMe
              ? "Me"
              : canSendCustom
                ? getUserName(msg.sender)
                : "Hidden Student";

            const showDateSeparator =
              idx === 0 ||
              getMessageDateKey(msg.createdAt) !==
                getMessageDateKey(messages[idx - 1]?.createdAt);

            // Centered plain-text status line, e.g. "❌ Offer of ₹18,000 declined."
            if (msg.kind === "SYSTEM") {
              return (
                <div key={msg._id || idx}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-6">
                      <span className="px-3 py-1 bg-paper border-[var(--border-w-sm)] border-ink font-mono text-[10px] font-bold text-ink uppercase">
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

                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {msg.kind === "OFFER" || msg.kind === "COUNTER_OFFER" ? (
                    renderOfferCard(msg, isLatestOfferActivity(idx))
                  ) : (
                    <div
                      className={`max-w-[75%] px-4 py-3 brutal-block-sm font-body font-medium text-sm md:text-base ${
                        isMe
                          ? "bg-signal-orange text-paper"
                          : "bg-paper text-ink"
                      }`}
                    >
                      <div
                        className={`font-mono text-[10px] uppercase font-bold mb-1.5 ${isMe ? "text-paper" : "text-ledger-blue"}`}
                      >
                        {label}
                      </div>
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
                            {msg.deliveryStatus === "read" ? (
                              <CheckCheck className="w-3.5 h-3.5" strokeWidth={3} />
                            ) : (
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
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

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    if (sidebarRef.current) {
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

  const wsRef = useRef<WebSocket | null>(null);

  const markCurrentChatRead = async (nextOfferId = offerId) => {
    if (!nextOfferId) return;

    try {
      await api.put(`/chat/${nextOfferId}/read`);
      setChats((current) =>
        current.map((chat) =>
          chat.offerId === nextOfferId ? { ...chat, hasUnread: false } : chat,
        ),
      );
      window.dispatchEvent(new Event("student-cube-chat-read-change"));
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get("/chat");
      setChats(res.data.data || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      if (!offerId) setIsLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchChats]);

  const fetchCurrentChat = useCallback(
    async (silent = false) => {
      if (!offerId) return;

      if (!silent) setIsLoading(true);
      try {
        const res = await api.get(`/chat/${offerId}`);
        setMessages(res.data.data || []);
        setCanSendCustom(Boolean(res.data.canSendCustom));
        setLockedMessage(res.data.lockedMessage);
        setLifecycle(res.data.lifecycle || null);
        setPrePaymentMessages(res.data.prePaymentMessages || []);
        setChatTitle(
          res.data.alias || res.data.product?.title || "Product Chat",
        );
        setChatProduct(res.data.product || null);

        const buyerId = getUserId(res.data.buyer);
        const sellerId = getUserId(res.data.seller);
        setChatSellerId(sellerId);
        setOtherUser(
          buyerId === currentUserId ? res.data.seller : res.data.buyer,
        );
        markCurrentChatRead(offerId);
      } catch {
        toast.error("Unable to open this chat.");
        navigate("/chat", { replace: true });
      } finally {
        setIsLoading(false);
      }
    },
    [offerId, currentUserId, navigate],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCurrentChat();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCurrentChat]);

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const payload = (event as CustomEvent).detail || {};
      fetchChats();

      if (payload.type !== "unread_changed" && offerId) {
        fetchCurrentChat(true);
      }
    };

    window.addEventListener("student-cube-realtime", handleRealtime);
    return () =>
      window.removeEventListener("student-cube-realtime", handleRealtime);
  }, [fetchChats, fetchCurrentChat, offerId]);

  useEffect(() => {
    if (!offerId || !token) return;

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    let isIntentionalClose = false;
    wsRef.current = ws;

    ws.onopen = () => {
      setIsSocketReady(true);
      ws.send(JSON.stringify({ type: "join", offerId }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "message") {
          setMessages((prev) => {
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
      } catch (error) {
        console.error("Invalid chat socket message:", error);
      }
    };

    ws.onclose = () => {
      if (!isIntentionalClose) setIsSocketReady(false);
    };
    ws.onerror = () => {
      if (isIntentionalClose) return;
      setIsSocketReady(false);
      toast.error("Chat connection failed.");
    };

    return () => {
      isIntentionalClose = true;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (wsRef.current === ws) {
        wsRef.current = null;
        setIsSocketReady(false);
      }

      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        window.setTimeout(() => ws.close(), 0);
      }
    };
  }, [offerId, token]);

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
              fetchCurrentChat(true);
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
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const sendMessage = (text: string, kind: "CUSTOM" | "PREDEFINED") => {
    const trimmedText = text.trim();
    if (!offerId || !trimmedText) return;

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

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        offerId,
        text: trimmedText,
        kind,
      }),
    );
    setNewMessage("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage, "CUSTOM");
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

  const handleChatOfferSubmit = async (event: React.FormEvent) => {
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
      fetchCurrentChat(true);
      fetchChats();
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
        message.kind === "OFFER" && message.metadata?.offerId === nextOfferId
          ? { ...message, metadata: { ...message.metadata, status } }
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
      className={`${offerId ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 shrink-0 flex-col border-r-[var(--border-w)] border-ink bg-paper z-20 relative`}
    >
      <div className="px-6 py-5 border-b-[var(--border-w)] border-ink shrink-0 bg-highlighter">
        <h1 className="text-2xl font-display font-black uppercase tracking-tight text-ink">Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto bg-paper">
        {isLoading && chats.length === 0 ? (
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
                  className={`chat-sidebar-item relative flex items-center gap-4 p-4 md:p-5 transition-colors border-b-[var(--border-w-sm)] border-ink/10 ${
                    isActive ? "bg-paper-blue" : "bg-paper hover:bg-highlighter/20"
                  }`}
                >
                  {chat.hasUnread && (
                    <span className="absolute right-4 top-4 w-3 h-3 bg-stamp-red border-[2px] border-ink" style={{ borderRadius: 'var(--radius)' }} />
                  )}
                  <div className="w-14 h-14 bg-paper-blue border-[var(--border-w)] border-ink overflow-hidden shrink-0" style={{ borderRadius: 'var(--radius)' }}>
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
      <div className="h-[calc(100vh-80px)] overflow-hidden bg-paper flex w-full relative">
        {sidebar}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-ink/40 bg-paper">
          <div className="w-20 h-20 bg-paper-blue border-[var(--border-w)] border-ink flex items-center justify-center mb-6" style={{ borderRadius: 'var(--radius)' }}>
            <MessageSquare className="w-8 h-8 text-ink/30" />
          </div>
          <p className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Select a conversation</p>
          <p className="font-body text-sm font-medium mt-2">Choose a chat from the left to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-paper flex w-full relative">
      {sidebar}
      <div ref={chatRef} className="flex-1 flex flex-col min-w-0 bg-paper">
      <div className="bg-paper px-4 md:px-6 py-4 flex items-center gap-4 border-b-[var(--border-w)] border-ink shadow-none z-10 shrink-0">
        <button
          onClick={() => navigate("/chat")}
          className="p-3 bg-paper border-[var(--border-w-sm)] border-ink hover:bg-highlighter brutal-block-sm transition-colors md:hidden shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 bg-ledger-blue border-[var(--border-w)] border-ink flex items-center justify-center text-paper shrink-0" style={{ borderRadius: 'var(--radius)' }}>
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl uppercase font-bold tracking-tight text-ink truncate">
              {chatTitle}
            </h2>
            <p className="font-mono text-xs font-bold text-ink truncate uppercase mt-0.5">
              {canSendCustom ? getUserName(otherUser) : "Hidden Student"}
            </p>
          </div>
        </div>
        {chatProduct?._id && (
          <Link
            to={`/product/${chatProduct._id}`}
            className="shrink-0 brutal-block-sm bg-paper px-4 py-2 font-display text-sm font-bold uppercase tracking-tight text-ink hover:bg-paper-blue transition-colors"
          >
            Product Info
          </Link>
        )}
      </div>

      {!canSendCustom && lockedMessage && (
        <div className="bg-stamp-red border-b-[var(--border-w)] border-ink px-4 md:px-6 py-4 text-sm text-paper font-bold font-body flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 text-paper">
            <Lock className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            <span className="truncate">{lockedMessage}</span>
          </div>

          {currentUserId !== chatSellerId && (
            <button
              onClick={handleUnlockPayment}
              className="bg-paper text-stamp-red hover:bg-paper-blue px-4 py-2 brutal-block-sm font-display uppercase font-bold text-sm transition-colors shrink-0 whitespace-nowrap"
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
      />

      <div className="bg-paper p-4 md:p-6 border-t-[var(--border-w)] border-ink shrink-0 z-10">
        {!canSendCustom && prePaymentMessages.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {prePaymentMessages.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => handleQuickMessage(text)}
                className="shrink-0 brutal-block-sm bg-paper-blue px-4 py-2 font-body font-bold text-sm text-ink hover:bg-highlighter transition-colors whitespace-nowrap"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {isOfferBoxOpen && (
          <form
            onSubmit={handleChatOfferSubmit}
            className="mb-4 flex flex-wrap sm:flex-nowrap gap-3 bg-paper p-4 brutal-block border-[var(--border-w)] border-ink"
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

        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canSendCustom}
            title="Attach image (coming soon)"
            onClick={() => toast("Image attachments aren't wired up yet.")}
            className="w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center brutal-block-sm bg-paper text-ink hover:bg-highlighter disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              canSendCustom
                ? "Type a message..."
                : "Full chat unlocks after payment verification"
            }
            disabled={!canSendCustom}
            className="flex-1 min-w-0 bg-paper brutal-block-sm px-4 md:px-5 py-3 md:py-4 font-body font-medium text-ink outline-none focus:ring-2 focus:ring-ledger-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !canSendCustom}
            className="w-12 h-12 md:w-14 md:h-14 shrink-0 brutal-block-sm bg-signal-orange hover:bg-highlighter disabled:opacity-50 disabled:hover:bg-signal-orange text-ink rounded-none flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5 md:w-6 md:h-6 ml-1" strokeWidth={2.5} />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default Chat;