/**
 * usePickAttachment
 * Shared hook for picking images or documents for chat attachments.
 * Handles both web (input[type=file]) and native (expo-image-picker / expo-document-picker).
 */
import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAlert } from '@/template';
import { uploadChatAttachment } from '@/services/chatService';

export type AttachmentResult = {
  url: string;
  type: 'image' | 'document';
  name: string;
};

// ── MIME type whitelists ─────────────────────────────────────────────────────
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/heic', 'image/heif',
]);

const ALLOWED_DOCUMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
  'application/octet-stream', // fallback for some mobile pickers
]);

/** File extension → MIME for cases where the picker reports empty mimeType */
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain', csv: 'text/csv',
  zip: 'application/zip',
};

function resolveMime(mimeType: string | undefined | null, fileName: string): string {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? 'application/octet-stream';
}

interface UsePickAttachmentOptions {
  senderId: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onProgress?: (pct: number) => void;
}

export function usePickAttachment({
  senderId,
  onUploadStart,
  onUploadEnd,
  onProgress,
}: UsePickAttachmentOptions) {
  const { showAlert } = useAlert();
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = useCallback(() => {
    onProgress?.(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      onProgress?.(-1); // signal "tick" — caller drives the value via state
    }, 250);
  }, [onProgress]);

  const stopProgress = useCallback((final = 100) => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    onProgress?.(final);
  }, [onProgress]);

  /** Pick an image (gallery on native, file input on web). */
  const pickImage = useCallback(async (): Promise<AttachmentResult | null> => {
    if (Platform.OS === 'web') {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) { resolve(null); return; }
          const mime = resolveMime(file.type, file.name);
          if (!ALLOWED_IMAGE_MIME.has(mime)) {
            showAlert('File Not Allowed', `Images of type "${mime}" are not supported.`);
            resolve(null); return;
          }
          onUploadStart?.();
          startProgress();
          try {
            const { url, type, error } = await uploadChatAttachment(
              { uri: '', name: file.name, mimeType: mime, rawFile: file },
              senderId
            );
            stopProgress(100);
            if (error) { showAlert('Upload Failed', error); resolve(null); return; }
            if (url) resolve({ url, type, name: file.name });
            else resolve(null);
          } finally {
            onUploadEnd?.();
          }
        };
        input.click();
      });
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert('Permission Denied', 'Media library access is required.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const imageMime = resolveMime(asset.mimeType, asset.fileName ?? 'photo.jpg');
    if (!ALLOWED_IMAGE_MIME.has(imageMime)) {
      showAlert('File Not Allowed', `Images of type "${imageMime}" are not supported.`);
      return null;
    }
    onUploadStart?.();
    startProgress();
    try {
      const { url, type, error } = await uploadChatAttachment(
        { uri: asset.uri, name: asset.fileName ?? `photo_${Date.now()}.jpg`, mimeType: imageMime },
        senderId
      );
      stopProgress(100);
      if (error) { showAlert('Upload Failed', error); return null; }
      if (url) return { url, type, name: asset.fileName ?? 'photo.jpg' };
      return null;
    } finally {
      onUploadEnd?.();
    }
  }, [senderId, showAlert, onUploadStart, onUploadEnd, startProgress, stopProgress]);

  /** Pick a document (PDF, Word, Excel, etc.). */
  const pickDocument = useCallback(async (): Promise<AttachmentResult | null> => {
    if (Platform.OS === 'web') {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip';
        input.onchange = async (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) { resolve(null); return; }
          const mime = resolveMime(file.type, file.name);
          if (!ALLOWED_DOCUMENT_MIME.has(mime)) {
            showAlert('File Not Allowed', `Documents of type "${mime}" are not supported.`);
            resolve(null); return;
          }
          onUploadStart?.();
          startProgress();
          try {
            const { url, type, error } = await uploadChatAttachment(
              { uri: '', name: file.name, mimeType: mime, rawFile: file },
              senderId
            );
            stopProgress(100);
            if (error) { showAlert('Upload Failed', error); resolve(null); return; }
            if (url) resolve({ url, type, name: file.name });
            else resolve(null);
          } finally {
            onUploadEnd?.();
          }
        };
        input.click();
      });
    }

    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const docMime = resolveMime(asset.mimeType, asset.name);
    if (!ALLOWED_DOCUMENT_MIME.has(docMime)) {
      showAlert('File Not Allowed', `Documents of type "${docMime}" are not supported.`);
      return null;
    }
    onUploadStart?.();
    startProgress();
    try {
      const { url, type, error } = await uploadChatAttachment(
        { uri: asset.uri, name: asset.name, mimeType: docMime },
        senderId
      );
      stopProgress(100);
      if (error) { showAlert('Upload Failed', error); return null; }
      if (url) return { url, type, name: asset.name };
      return null;
    } finally {
      onUploadEnd?.();
    }
  }, [senderId, showAlert, onUploadStart, onUploadEnd, startProgress, stopProgress]);

  /** Cleanup — call on component unmount. */
  const cleanup = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  return { pickImage, pickDocument, cleanup };
}
