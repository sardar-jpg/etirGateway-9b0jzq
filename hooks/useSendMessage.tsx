/**
 * useSendMessage.tsx
 * Encapsulates the full send-message flow:
 *   1. Optimistic UI update (via ChatContext)
 *   2. DB persist
 *   3. Driver push notification (fire-and-forget)
 * Extracted from app/(tabs)/chat.tsx to keep the component focused on rendering.
 */
import { useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { fetchDriverPushToken, notifyDriverNewMessage } from '@/services/notificationService';
import { UserRole } from '@/types';

interface SendMessageOptions {
  message: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  activeThreadId: string | null;
  pendingAttachmentUrl?: string;
  pendingAttachmentType?: 'image' | 'document';
}

interface UseSendMessageReturn {
  send: (opts: SendMessageOptions) => Promise<void>;
}

export function useSendMessage(): UseSendMessageReturn {
  const { sendMessage, threads } = useChat();

  const send = useCallback(async ({
    message,
    senderId,
    senderName,
    senderRole,
    activeThreadId,
    pendingAttachmentUrl,
    pendingAttachmentType,
  }: SendMessageOptions): Promise<void> => {
    if ((!message.trim() && !pendingAttachmentUrl) || !activeThreadId) return;

    // 1. Optimistic update + DB persist (handled inside ChatContext.sendMessage)
    // sendMessage returns void — errors are thrown internally, caught below
    await sendMessage(
      message.trim(),
      senderId,
      senderName,
      senderRole,
      activeThreadId,
      pendingAttachmentUrl,
      pendingAttachmentType,
    );

    // 2. Push notification to driver (fire-and-forget — never blocks the UI)
    if (senderRole === 'admin') {
      const thread = threads.find(t => t.id === activeThreadId);
      if (thread?.driverId) {
        const preview = message.trim() || (pendingAttachmentUrl ? '📎 Attachment from dispatch' : '');
        fetchDriverPushToken(thread.driverId)
          .then(token => notifyDriverNewMessage(preview, token))
          .catch(pushErr => console.warn('[useSendMessage] push notification failed:', pushErr));
      }
    }
  }, [sendMessage, threads]);

  return { send };
}
