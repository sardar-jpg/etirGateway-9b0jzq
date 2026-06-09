
import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ChatThread, UserRole } from '@/types';
import {
  fetchAllThreads, sendChatMessage, markThreadRead, ensureDriverThread,
  ensureShipmentThread, fetchShipmentThread,
} from '@/services/chatService';
import {
  fetchAdminPushTokens, notifyAdminNewMessage,
  fetchDriverPushToken, notifyDriverNewMessage,
} from '@/services/notificationService';

// Queued outbound message — stored when offline, drained on reconnect
export interface QueuedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  threadId: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'document';
  queuedAt: number;
}

interface ChatContextType {
  threads: ChatThread[];
  loading: boolean;
  isOffline: boolean;
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  totalUnread: number;
  messageQueue: QueuedMessage[];
  setActiveThreadId: (id: string | null) => void;
  sendMessage: (
    content: string,
    senderId: string,
    senderName: string,
    senderRole: UserRole,
    threadId?: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'document'
  ) => Promise<void>;
  markRead: (threadId: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Ensure a thread exists for the logged-in driver, returns the thread id */
  initDriverThread: (driverId: string, driverName: string, plateNumber: string) => Promise<string | null>;
  /** Ensure an order-specific thread exists for a shipment, returns the thread id */
  initShipmentThread: (shipmentId: string, tirNumber: string, driverId: string, driverName: string, plateNumber: string) => Promise<string | null>;
  /** Fetch messages for a specific shipment thread (by shipmentId) */
  getShipmentThread: (shipmentId: string) => Promise<void>;
  /** Synchronous lookup — returns the thread for a shipment if already in state */
  getShipmentChatThread: (shipmentId: string) => ChatThread | null;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // Track previous unread counts to detect new messages for admin notification.
  // Initialised to null so the FIRST poll never fires stale notifications.
  const prevUnreadRef = useRef<Record<string, number> | null>(null);
  // Ref mirror of messageQueue so the NetInfo callback (stale closure) can drain it
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const isOfflineRef = useRef(false);

  const POLL_TIMEOUT_MS = 10_000;
  const pollAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
    try {
      const { threads: data } = await fetchAllThreads();
      if (!controller.signal.aborted) {
        setThreads(data);
        // Seed ref on first load so the initial poll baseline is correct
        if (prevUnreadRef.current === null) {
          prevUnreadRef.current = Object.fromEntries(data.map(t => [t.id, t.unreadCount]));
        }
      }
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') console.warn('[ChatContext] load error:', e);
      else console.warn('[ChatContext] initial load timed out after 10s');
    } finally {
      clearTimeout(timer);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── NetInfo: offline detection + queue drain ─────────────────────────────────
  useEffect(() => {
    const handleNetChange = (state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      const wasOffline = isOfflineRef.current;
      isOfflineRef.current = !online;
      setIsOffline(!online);

      // Reconnect: drain the queue
      if (wasOffline && online) {
        const queued = [...messageQueueRef.current];
        if (queued.length === 0) return;
        // Drain serially so ordering is preserved
        (async () => {
          for (const item of queued) {
            try {
              await sendChatMessage(
                item.threadId, item.senderId, item.senderName,
                item.senderRole, item.content,
                item.attachmentUrl, item.attachmentType,
              );
              // Remove from queue on success
              setMessageQueue(prev => {
                const next = prev.filter(q => q.id !== item.id);
                messageQueueRef.current = next;
                return next;
              });
            } catch (drainErr) {
              console.warn('[ChatContext] queue drain failed for item', item.id, drainErr);
              // Leave it in the queue for the next reconnect
            }
          }
          // Refresh threads to pull server-confirmed messages
          load();
        })();
      }
    };

    const unsubscribe = NetInfo.addEventListener(handleNetChange);
    // Fetch current state immediately so initial render knows the state
    NetInfo.fetch().then(handleNetChange).catch(() => {});
    return () => unsubscribe();
  }, [load]);

  // Poll every 10 seconds for new messages + notify admin only when thread is not active
  useEffect(() => {
    const interval = setInterval(async () => {
      const controller = new AbortController();
      pollAbortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
      let freshThreads: ChatThread[] = [];
      try {
        const result = await fetchAllThreads();
        if (controller.signal.aborted) return;
        freshThreads = result.threads;
      } catch (e) {
        clearTimeout(timer);
        pollAbortRef.current = null;
        if ((e as any)?.name !== 'AbortError') console.warn('[ChatContext] poll error:', e);
        else console.warn('[ChatContext] poll timed out after 10s — skipping update');
        return;
      } finally {
        clearTimeout(timer);
        pollAbortRef.current = null;
      }
      // Detect new messages arriving for the admin.
      // Only fire a push notification when:
      //   1. The unread count actually increased (new message arrived), AND
      //   2. The admin is NOT currently viewing that thread (activeThreadId !== thread.id)
      // This prevents spamming notifications while the admin is actively reading.
      // prevUnreadRef starts as null — skip notification check until baseline is seeded
      const prev = prevUnreadRef.current;
      const notifyThreads = prev === null ? [] : freshThreads.filter(thread => {
        const prevCount = prev[thread.id] ?? 0;
        return thread.unreadCount > prevCount && thread.id !== activeThreadId;
      });

      if (notifyThreads.length > 0) {
        // Fetch admin tokens once, then fire notifications for each new-message thread
        const adminTokens = await fetchAdminPushTokens();
        for (const thread of notifyThreads) {
          const preview = thread.lastMessage || 'New message';
          await notifyAdminNewMessage(thread.driverName, preview, adminTokens);
        }
      }

      // Update the ref with latest unread counts (never reset back to null)
      prevUnreadRef.current = Object.fromEntries(freshThreads.map(t => [t.id, t.unreadCount]));

      setThreads(freshThreads);
      setLoading(false);
    }, 10000);
    return () => {
      clearInterval(interval);
      pollAbortRef.current?.abort();
    };
  }, [activeThreadId]);

  const activeThread = activeThreadId
    ? threads.find(t => t.id === activeThreadId) ?? null
    : null;

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  const sendMessage = useCallback(async (
    content: string,
    senderId: string,
    senderName: string,
    senderRole: UserRole,
    threadId?: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'document'
  ) => {
    const targetId = threadId ?? activeThreadId;
    if (!targetId || (!content.trim() && !attachmentUrl)) return;

    // Optimistic update — assign a stable temp id so we can roll it back on failure
    const tempMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newMsg = {
      id: tempMsgId,
      senderId,
      senderName,
      senderRole,
      content: content.trim() || (attachmentUrl ? '📎 Attachment' : ''),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: true,
      attachmentUrl,
      attachmentType,
    };

    setThreads(prev =>
      prev.map(t =>
        t.id === targetId
          ? { ...t, messages: [...t.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: newMsg.timestamp }
          : t
      )
    );

    /** Roll back the optimistic message — removes it by tempMsgId */
    const rollback = () => {
      setThreads(prev =>
        prev.map(t =>
          t.id === targetId
            ? {
                ...t,
                messages: t.messages.filter(m => m.id !== tempMsgId),
                // Restore lastMessage to what the previous tail was
                lastMessage: t.messages.filter(m => m.id !== tempMsgId).at(-1)?.content ?? t.lastMessage,
              }
            : t
        )
      );
    };

    // If offline: queue the message for retry on reconnect, don't attempt DB write
    if (isOfflineRef.current) {
      // Roll back the optimistic message — it will re-appear when drained from the queue
      rollback();
      const queueItem: QueuedMessage = {
        id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        content: content.trim(),
        senderId,
        senderName,
        senderRole,
        threadId: targetId,
        attachmentUrl,
        attachmentType,
        queuedAt: Date.now(),
      };
      setMessageQueue(prev => {
        const next = [...prev, queueItem];
        messageQueueRef.current = next;
        return next;
      });
      // Throw so chat.tsx shows the 'Failed — tap to retry' bubble.
      throw new Error('offline');
    }

    // Persist to DB — roll back and rethrow on failure so the caller can show retry UI
    try {
      await sendChatMessage(targetId, senderId, senderName, senderRole, content, attachmentUrl, attachmentType);
    } catch (dbErr) {
      rollback();
      console.warn('[ChatContext] sendMessage DB write failed, rolled back optimistic update:', dbErr);
      throw dbErr;
    }

    // Notify the driver when admin sends a message.
    // Read driverId from the current threads snapshot at call time to avoid stale state.
    if (senderRole === 'admin') {
      // Use functional form of setState to read latest threads without stale closure.
      setThreads(prev => {
        const thread = prev.find(t => t.id === targetId);
        if (thread?.driverId) {
          const preview = content.trim() || (attachmentUrl ? '📎 Attachment' : '');
          fetchDriverPushToken(thread.driverId)
            .then(token => notifyDriverNewMessage(preview, token))
            .catch(pushErr => console.warn('[ChatContext] push notification failed:', pushErr));
        }
        return prev; // no state change — only side effect
      });
    }
  }, [activeThreadId, threads]);

  const markRead = useCallback(async (threadId: string) => {
    setThreads(prev =>
      prev.map(t =>
        t.id === threadId
          ? { ...t, unreadCount: 0, messages: t.messages.map(m => ({ ...m, read: true })) }
          : t
      )
    );
    await markThreadRead(threadId);
  }, []);

  const initShipmentThread = useCallback(async (
    shipmentId: string,
    tirNumber: string,
    driverId: string,
    driverName: string,
    plateNumber: string,
  ): Promise<string | null> => {
    const { thread, error } = await ensureShipmentThread(shipmentId, tirNumber, driverId, driverName, plateNumber);
    if (error) console.warn('[chat] ensureShipmentThread error:', error);
    if (thread) {
      setThreads(prev => {
        const exists = prev.find(t => t.id === thread.id);
        // Guard: thread must be non-null before spreading
        if (exists) return prev.map(t => t.id === thread.id ? { ...t, ...thread } : t);
        return [thread, ...prev];
      });
      return thread.id;
    }
    return null;
  }, []);

  const getShipmentThread = useCallback(async (shipmentId: string): Promise<void> => {
    const { thread } = await fetchShipmentThread(shipmentId);
    if (thread) {
      setThreads(prev => {
        const exists = prev.find(t => t.id === thread.id);
        if (exists) return prev.map(t => t.id === thread.id ? { ...thread } : t);
        return [thread, ...prev];
      });
    }
  }, []);

  const initDriverThread = useCallback(async (driverId: string, driverName: string, plateNumber: string): Promise<string | null> => {
    const { thread, error } = await ensureDriverThread(driverId, driverName, plateNumber);
    if (error) console.warn('[chat] ensureDriverThread error:', error);
    if (thread) {
      // Merge into threads state if not already present
      setThreads(prev => {
        const exists = prev.find(t => t.id === thread.id);
        if (exists) {
          // Update it with linked driver_id — guard against null thread
          return prev.map(t => t.id === thread.id ? { ...t, ...thread } : t);
        }
        return [thread, ...prev];
      });
      return thread.id;
    }
    return null;
  }, []);

  const getShipmentChatThread = useCallback(
    (shipmentId: string) => threads.find(t => t.shipmentId === shipmentId) ?? null,
    [threads]
  );

  return (
    <ChatContext.Provider value={{
      threads, loading, isOffline, activeThreadId, activeThread, totalUnread,
      messageQueue, setActiveThreadId, sendMessage, markRead, refresh: load,
      initDriverThread, initShipmentThread, getShipmentThread, getShipmentChatThread,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
