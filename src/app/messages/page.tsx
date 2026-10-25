'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatSettingsModal } from '@/components/ChatSettingsModal';
import { getSocket } from '@/lib/socket';
import { MessagesSkeleton, Skeleton } from '@/components/ui/Skeleton';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  lastReadAt?: string | null;
  isArchived?: boolean;
}

interface ContractInfo {
  id: string;
  name: string;
  status: string;
  landlordId: string;
}

interface Conversation {
  id: string;
  type: string;
  contractId?: string | null;
  contract?: ContractInfo | null;
  participants: Participant[];
  createdAt: string;
  lastMessage?: Message | null;
  otherUser?: Participant;
  isArchived?: boolean;
}

interface MessageListing {
  id: string;
  title: string;
  listingType?: string;
  saleType?: string;
  size?: number | null;
  monthlyRent?: number | null;
  salePrice?: number | null;
  imageUrl?: string | null;
  address?: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  listingId?: string | null;
  listing?: MessageListing | null;
  attachments?: string[];
  sentAt: string;
  sender?: {
    id: string;
    fullName: string;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface ContractInvitationItem {
  id: string;
  contractId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  contract: {
    id: string;
    name: string;
    landlord: {
      id: string;
      fullName: string;
      phone?: string;
      avatarUrl?: string;
    };
  };
  invitedBy: {
    id: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface PendingAttachment {
  id: string;
  file: File;
  previewUrl?: string;
  isImage: boolean;
  name: string;
  size: number;
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(url);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateDivider(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hôm nay';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function getMessageDateDivider(currentMsgDate: string, prevMsgDate?: string): string | null {
  if (!currentMsgDate) return null;
  const cur = new Date(currentMsgDate);
  if (isNaN(cur.getTime())) return null;
  if (!prevMsgDate) {
    return formatDateDivider(cur);
  }
  const prev = new Date(prevMsgDate);
  if (isNaN(prev.getTime())) return formatDateDivider(cur);

  if (
    cur.getFullYear() !== prev.getFullYear() ||
    cur.getMonth() !== prev.getMonth() ||
    cur.getDate() !== prev.getDate()
  ) {
    return formatDateDivider(cur);
  }
  return null;
}

function getFileExtension(filename: string): string {
  if (!filename) return '';
  const clean = filename.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  return lastDot !== -1 ? clean.substring(lastDot + 1).toLowerCase() : '';
}

interface FileTypeInfo {
  iconColor: string;
  bgClass: string;
  borderClass: string;
  tag: string;
}

function getFileTag(ext: string): string {
  if (!ext) return 'FILE';
  const lower = ext.toLowerCase();
  if (lower === 'docx') return 'DOCX';
  if (lower === 'doc') return 'DOC';
  if (lower === 'pdf') return 'PDF';
  if (lower === 'xlsx') return 'XLSX';
  if (lower === 'xls') return 'XLS';
  if (lower === 'pptx') return 'PPTX';
  if (lower === 'ppt') return 'PPT';
  if (lower === 'csv') return 'CSV';
  if (lower === 'txt') return 'TXT';
  if (lower === 'zip') return 'ZIP';
  if (lower === 'rar') return 'RAR';
  const upper = ext.toUpperCase();
  return upper.length <= 4 ? upper : upper.slice(0, 3);
}

function getFileTypeInfo(filenameOrUrl: string): FileTypeInfo {
  const ext = getFileExtension(filenameOrUrl);
  const tag = getFileTag(ext);

  // Word: Blue (xanh dương)
  if (['doc', 'docx'].includes(ext)) {
    return {
      iconColor: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200/60',
      tag,
    };
  }

  // Excel: Green (xanh lá)
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return {
      iconColor: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200/60',
      tag,
    };
  }

  // PDF or PowerPoint: Red (đỏ)
  if (['pdf', 'ppt', 'pptx'].includes(ext)) {
    return {
      iconColor: 'text-red-600',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200/60',
      tag,
    };
  }

  // Các loại file khác: Đen (như hiện tại)
  return {
    iconColor: 'text-ink-primary',
    bgClass: 'bg-surface-secondary',
    borderClass: 'border-border-subtle',
    tag,
  };
}

function FileTypeIcon({
  filename,
  className = "w-[22px] h-[26px]",
}: {
  filename: string;
  className?: string;
}) {
  const fileInfo = getFileTypeInfo(filename);
  const tag = fileInfo.tag;

  return (
    <svg
      className={className}
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* File Page Body with Folded Corner */}
      <path
        d="M4 2C2.89543 2 2 2.89543 2 4V24C2 25.1046 2.89543 26 4 26H20C21.1046 26 22 25.1046 22 24V9L15 2H4Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Folded Corner */}
      <path
        d="M15 2V8C15 8.55228 15.4477 9 16 9H22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* File Type Tag Text */}
      <text
        x="12"
        y="19.5"
        textAnchor="middle"
        fill="currentColor"
        style={{
          fontSize: tag.length >= 4 ? '6.8px' : '8.5px',
          fontWeight: 900,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace, sans-serif',
          letterSpacing: tag.length >= 4 ? '-0.06em' : '-0.03em',
        }}
      >
        {tag}
      </text>
    </svg>
  );
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function calculateTextSimilarity(target: string, query: string): number {
  if (!target || !query) return 0;

  const rawTarget = target.trim().toLowerCase();
  const rawQuery = query.trim().toLowerCase();

  const normTarget = removeVietnameseTones(target);
  const normQuery = removeVietnameseTones(query);

  if (!normTarget.includes(normQuery)) {
    return 0; // Not matched
  }

  let score = 0;

  // 1. Exact match
  if (rawTarget === rawQuery) {
    score += 1000;
  } else if (normTarget === normQuery) {
    score += 900;
  } else {
    // 2. Word matching
    const rawWords = rawTarget.split(/\s+/);
    const normWords = normTarget.split(/\s+/);

    if (rawWords.includes(rawQuery)) {
      score += 700;
    } else if (normWords.includes(normQuery)) {
      score += 650;
    } else if (rawTarget.startsWith(rawQuery)) {
      score += 600;
    } else if (normTarget.startsWith(normQuery)) {
      score += 550;
    } else if (rawWords.some((w) => w.startsWith(rawQuery))) {
      score += 500;
    } else if (normWords.some((w) => w.startsWith(normQuery))) {
      score += 450;
    } else {
      score += 300;
    }
  }

  // 3. Proximity / Length similarity bonus (up to 300 points)
  const lengthDiff = Math.abs(normTarget.length - normQuery.length);
  const lengthBonus = Math.max(0, 300 - lengthDiff * 10);
  score += lengthBonus;

  // 4. Exact accent bonus: if original accented letters match exactly, reward +50
  if (rawTarget.includes(rawQuery)) {
    score += 50;
  }

  return score;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const targetContractId = searchParams.get('contractId');
  const targetConvId = searchParams.get('conversationId');
  const targetListingId = searchParams.get('listingId');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [readConvIds, setReadConvIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<PendingAttachment[]>([]);
  const [pendingListing, setPendingListing] = useState<MessageListing | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const typingTimeoutsRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});
  const localTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Attached Listing details if listingId is in URL
  useEffect(() => {
    if (!targetListingId) {
      setPendingListing(null);
      return;
    }

    let isCancelled = false;

    async function loadTargetListing() {
      try {
        const res = await fetch(`${apiUrl}/listings/${targetListingId}`);
        if (res.ok) {
          const data = await res.json();
          if (isCancelled) return;

          const addr = [
            data.ward?.name,
            data.district?.name,
            data.city?.name,
          ].filter(Boolean).join(', ') || data.address || '';

          const rawImg = data.images?.[0]?.imageUrl || data.images?.[0]?.url || (typeof data.images?.[0] === 'string' ? data.images?.[0] : null);
          const img = rawImg
            ? (rawImg.startsWith('http') ? rawImg : `${apiUrl}${rawImg}`)
            : null;

          setPendingListing({
            id: data.id,
            title: data.title,
            listingType: data.listingType,
            saleType: data.saleType,
            size: data.size ? Number(data.size) : null,
            monthlyRent: data.monthlyRent ? Number(data.monthlyRent) : null,
            salePrice: data.salePrice ? Number(data.salePrice) : null,
            imageUrl: img,
            address: addr,
          });
        }
      } catch (e) {
        console.error('Error fetching attached listing context:', e);
      }
    }

    loadTargetListing();

    return () => {
      isCancelled = true;
    };
  }, [targetListingId, apiUrl]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      selectedAttachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
      Object.values(typingTimeoutsRef.current).forEach((t) => clearTimeout(t));
      if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
    };
  }, []);

  // When switching conversations, clear attachments, typing states, and revoke preview URLs
  useEffect(() => {
    setSelectedAttachments((prev) => {
      prev.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
      return [];
    });
    setTypingUserIds(new Set());
    Object.values(typingTimeoutsRef.current).forEach((t) => clearTimeout(t));
    typingTimeoutsRef.current = {};
    if (isLocalTypingRef.current && selectedConv?.id) {
      const socket = getSocket();
      socket?.emit('typing:stop', { conversationId: selectedConv.id, userId: currentUser?.id });
      isLocalTypingRef.current = false;
    }
  }, [selectedConv?.id]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Separate active and archived conversations
  const activeConversations = useMemo(
    () => conversations.filter((c) => !c.isArchived),
    [conversations]
  );

  const archivedConversations = useMemo(
    () => conversations.filter((c) => !!c.isArchived),
    [conversations]
  );

  const displayList = showArchived ? archivedConversations : activeConversations;

  // Toggle archive status for a conversation
  const handleToggleArchive = async (
    e: React.MouseEvent,
    convId: string,
    currentArchived: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetArchived = !currentArchived;
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isArchived: targetArchived } : c))
    );
    if (selectedConv?.id === convId) {
      setSelectedConv((prev) => (prev ? { ...prev, isArchived: targetArchived } : prev));
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${apiUrl}/conversations/${convId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived: targetArchived }),
      });
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  // Search results dropdown (searches all conversations including archived ones):
  // 1. Direct chats matching user name rank highest (most similar to search keyword first)
  // 2. Group chats matching title rank next
  // 3. Group chats matching members rank third
  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];

    interface ScoredConv {
      conv: Conversation;
      score: number;
    }

    const scoredList: ScoredConv[] = [];

    for (const conv of conversations) {
      const isContract = conv.type === 'CONTRACT';
      let score = 0;

      if (!isContract) {
        // Direct chat with another user: Search by opponent's name (otherUser.fullName)
        const otherName = conv.otherUser?.fullName || '';
        const similarity = calculateTextSimilarity(otherName, trimmed);
        if (similarity > 0) {
          // Direct chat with user matching name ranks highest (base 10,000)
          score = 10000 + similarity;
        }
      } else {
        // Group chat / Contract chat: Search by contract title
        const contractTitle = conv.contract?.name || '';
        const titleSimilarity = calculateTextSimilarity(contractTitle, trimmed);

        if (titleSimilarity > 0) {
          // Group chat matching by title ranks second (base 5,000)
          score = 5000 + titleSimilarity;
        } else {
          // Also check other participants' names in the group chat (base 2,000)
          let bestParticipantSim = 0;
          for (const p of conv.participants) {
            if (p.userId !== currentUser?.id && p.fullName) {
              const pSim = calculateTextSimilarity(p.fullName, trimmed);
              if (pSim > bestParticipantSim) {
                bestParticipantSim = pSim;
              }
            }
          }
          if (bestParticipantSim > 0) {
            score = 2000 + bestParticipantSim;
          }
        }
      }

      if (score > 0) {
        scoredList.push({ conv, score });
      }
    }

    // Sort by score DESC. If equal, sort by lastMessage.sentAt or createdAt DESC
    scoredList.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const timeA = new Date(a.conv.lastMessage?.sentAt || a.conv.createdAt).getTime();
      const timeB = new Date(b.conv.lastMessage?.sentAt || b.conv.createdAt).getTime();
      return timeB - timeA;
    });

    return scoredList.map((item) => item.conv);
  }, [conversations, searchQuery, currentUser]);

  // Contract Invitations state
  const [pendingInvitations, setPendingInvitations] = useState<ContractInvitationItem[]>([]);
  const [actionInvId, setActionInvId] = useState<string | null>(null);

  // Create Contract Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contractName, setContractName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [tenantPhones, setTenantPhones] = useState<string[]>([]);
  const [creatingContract, setCreatingContract] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Chat Settings Modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const handleChatScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 160;
    setShowScrollBottom(!isNearBottom);
  };

  useEffect(() => {
    setShowScrollBottom(false);
  }, [selectedConv?.id]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, selectedConv?.id]);

  // Fetch Pending Invitations
  const fetchPendingInvitations = async (token: string) => {
    try {
      const res = await fetch(`${apiUrl}/contracts/my-invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ContractInvitationItem[] = await res.json();
        setPendingInvitations(data.filter((item) => item.status === 'PENDING'));
      }
    } catch (err) {
      console.error('Error fetching contract invitations:', err);
    }
  };

  // Fetch Conversations List
  const fetchConversations = async (token: string, meId?: string) => {
    const userId = meId || currentUser?.id;
    try {
      const convsRes = await fetch(`${apiUrl}/conversations/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (convsRes.ok) {
        const rawConvs: Conversation[] = await convsRes.json();
        const processed = rawConvs.map((conv) => {
          const other = conv.participants.find((p) => p.userId !== userId) || conv.participants[0];
          const myParticipant = conv.participants.find((p) => p.userId === userId);
          const isArchived = (conv as any).isArchived ?? myParticipant?.isArchived ?? false;
          return {
            ...conv,
            otherUser: other,
            isArchived,
          };
        });
        setConversations(processed);
        return processed;
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    return [];
  };

  // Handle Approve Contract Invitation
  const handleApproveInvitation = async (invitationId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setActionInvId(invitationId);
      const res = await fetch(`${apiUrl}/contracts/invitations/${invitationId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        await fetchConversations(token);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Không thể chấp nhận lời mời');
      }
    } catch (err) {
      console.error('Error approving invitation:', err);
    } finally {
      setActionInvId(null);
    }
  };

  // Handle Reject Contract Invitation
  const handleRejectInvitation = async (invitationId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setActionInvId(invitationId);
      const res = await fetch(`${apiUrl}/contracts/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Không thể từ chối lời mời');
      }
    } catch (err) {
      console.error('Error rejecting invitation:', err);
    } finally {
      setActionInvId(null);
    }
  };

  // Handle adding phone to tenantPhones array in modal
  const handleAddPhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneInput.trim().replace(/\s+/g, '');
    if (!cleanPhone) return;

    if (tenantPhones.includes(cleanPhone)) {
      setCreateError('Số điện thoại này đã được thêm vào danh sách.');
      return;
    }

    setTenantPhones((prev) => [...prev, cleanPhone]);
    setPhoneInput('');
    setCreateError(null);
  };

  const handleRemovePhone = (index: number) => {
    setTenantPhones((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle creating contract and starting contract chat
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const name = contractName.trim();
    if (!name) {
      setCreateError('Vui lòng nhập tên hợp đồng.');
      return;
    }

    const phones = [...tenantPhones];
    const pendingPhone = phoneInput.trim().replace(/\s+/g, '');
    if (pendingPhone && !phones.includes(pendingPhone)) {
      phones.push(pendingPhone);
      setTenantPhones(phones);
      setPhoneInput('');
    }

    if (phones.length === 0) {
      setCreateError('Vui lòng nhập ít nhất 1 số điện thoại người thuê.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setCreateError('Vui lòng đăng nhập lại.');
      return;
    }

    setCreatingContract(true);
    try {
      const res = await fetch(`${apiUrl}/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          tenantPhones: phones,
        }),
      });

      if (res.ok) {
        const contractData = await res.json();
        setCreateSuccess('Tạo hợp đồng thành công! Lời mời đã được gửi tới người thuê.');

        const updatedConvs = await fetchConversations(token);
        const contractConv = updatedConvs.find((c) => c.contractId === contractData.id);
        if (contractConv) {
          setSelectedConv(contractConv);
          setSelectedConvId(contractConv.id);
        }

        setTimeout(() => {
          setShowCreateModal(false);
          setContractName('');
          setTenantPhones([]);
          setPhoneInput('');
          setCreateSuccess(null);
        }, 700);
      } else {
        const err = await res.json().catch(() => null);
        setCreateError(err?.message || 'Tạo hợp đồng thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      console.error('Error creating contract:', err);
      setCreateError('Không thể kết nối đến máy chủ.');
    } finally {
      setCreatingContract(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    async function initMessages() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // 1. Get Me
        const userRes = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }
        const me = await userRes.json();
        setCurrentUser(me);

        // 2. Fetch Pending Invitations
        fetchPendingInvitations(token);

        // 3. Get Conversations
        const processed = await fetchConversations(token, me.id);

        // Record last visited time to clear navigation badge while preserving bold styling on unread chats
        if (typeof window !== 'undefined') {
          localStorage.setItem('haven:lastVisitedMessagesAt', new Date().toISOString());
          window.dispatchEvent(new CustomEvent('haven:messages-updated'));
        }

        // 4. Handle target searchParams (contractId, userId, conversationId)
        if (targetContractId || targetUserId || targetConvId) {
          await openConversationByTarget(
            {
              userId: targetUserId,
              contractId: targetContractId,
              conversationId: targetConvId,
            },
            processed,
            me.id
          );
        }
      } catch (err) {
        console.error('Error initializing messages:', err);
      } finally {
        setLoadingConvs(false);
      }
    }

    initMessages();
  }, [apiUrl, router]);

  // Open / select conversation by query parameters or custom event
  const openConversationByTarget = async (
    targetParams: {
      userId?: string | null;
      contractId?: string | null;
      conversationId?: string | null;
    },
    currentConvsList?: Conversation[],
    currentMeId?: string,
  ) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const myId = currentMeId || currentUser?.id;
    if (!myId) return;

    const convList = currentConvsList || conversations;
    const { userId, contractId, conversationId } = targetParams;

    // 1. Contract Conversation
    if (contractId) {
      let contractConv = convList.find(
        (c) => c.contractId === contractId || c.contract?.id === contractId
      );
      if (!contractConv) {
        const refreshed = await fetchConversations(token, myId);
        contractConv = refreshed.find(
          (c) => c.contractId === contractId || c.contract?.id === contractId
        );
      }
      if (contractConv) {
        setSelectedConv(contractConv);
        setSelectedConvId(contractConv.id);
        return;
      }
    }

    // 2. Specific Conversation by ID
    if (conversationId) {
      let foundConv = convList.find((c) => c.id === conversationId);
      if (!foundConv) {
        try {
          const res = await fetch(`${apiUrl}/conversations/${conversationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data: Conversation = await res.json();
            const other = data.participants.find((p) => p.userId !== myId) || data.participants[0];
            foundConv = { ...data, otherUser: other };
            setConversations((prev) => {
              if (prev.some((c) => c.id === conversationId)) return prev;
              return [foundConv!, ...prev];
            });
          }
        } catch (e) {
          console.error('Error fetching conversation by id:', e);
        }
      }
      if (foundConv) {
        setSelectedConv(foundConv);
        setSelectedConvId(foundConv.id);
        return;
      }
    }

    // 3. Direct Conversation with target user
    if (userId) {
      let directConv = convList.find((c) => {
        if (userId === myId) {
          return c.type === 'DIRECT' && c.participants.length === 1 && c.participants[0].userId === myId;
        }
        return c.type === 'DIRECT' && c.participants.some((p) => p.userId === userId);
      });

      if (directConv) {
        setSelectedConv(directConv);
        setSelectedConvId(directConv.id);
        return;
      }

      try {
        const directRes = await fetch(`${apiUrl}/messages/direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetUserId: userId }),
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          const newConvId = directData.conversationId;

          const newConvRes = await fetch(`${apiUrl}/conversations/${newConvId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (newConvRes.ok) {
            const newConvData: Conversation = await newConvRes.json();
            const other = newConvData.participants.find((p) => p.userId !== myId) || newConvData.participants[0];
            const myParticipant = newConvData.participants.find((p) => p.userId === myId);
            const isArchived = (newConvData as any).isArchived ?? myParticipant?.isArchived ?? false;
            const processedNew = { ...newConvData, otherUser: other, isArchived };
            setConversations((prev) => {
              if (prev.some((c) => c.id === newConvId)) return prev;
              return [processedNew, ...prev];
            });
            setSelectedConv(processedNew);
            setSelectedConvId(processedNew.id);
          }
        }
      } catch (err) {
        console.error('Error starting direct conversation:', err);
      }
    }
  };

  // Handle URL searchParams changes after initial load
  useEffect(() => {
    if (!currentUser || loadingConvs) return;
    if (targetContractId || targetUserId || targetConvId) {
      openConversationByTarget({
        userId: targetUserId,
        contractId: targetContractId,
        conversationId: targetConvId,
      });
    }
  }, [targetUserId, targetContractId, targetConvId, currentUser, loadingConvs]);

  // Listen to custom event for instantaneous opening from notification modal
  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      openConversationByTarget(detail);
    };
    window.addEventListener('haven:open-chat', handleCustomOpen);
    return () => {
      window.removeEventListener('haven:open-chat', handleCustomOpen);
    };
  }, [conversations, currentUser]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConv?.id) return;
    const convId = selectedConv.id;

    setReadConvIds((prev) => new Set(prev).add(convId));
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetch(`${apiUrl}/conversations/${convId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('haven:messages-updated'));
          }
        })
        .catch((err) => console.error('Error marking as read:', err));
    }

    async function fetchMessages() {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      setLoadingMessages(true);
      try {
        const res = await fetch(`${apiUrl}/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [selectedConv?.id, apiUrl]);

  // Socket.IO realtime handling for active conversation and conversations list
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (selectedConv?.id) {
      socket.emit('join:conversation', { conversationId: selectedConv.id });
    }

    const handleNewMessage = (msg: Message) => {
      if (!msg?.id) return;

      if (selectedConv?.id === msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Mark as read immediately on server if received in current active chat and from someone else
        if (msg.senderId !== currentUser?.id) {
          const token = localStorage.getItem('accessToken');
          if (token) {
            fetch(`${apiUrl}/conversations/${msg.conversationId}/read`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null);
          }
        }

        setReadConvIds((prev) => new Set(prev).add(msg.conversationId));
      } else {
        // If received in another conversation, make sure it is marked unread in the list
        setReadConvIds((prev) => {
          const next = new Set(prev);
          next.delete(msg.conversationId);
          return next;
        });
      }

      // When a new message arrives from a user, clear their typing indicator
      if (msg?.senderId) {
        if (typingTimeoutsRef.current[msg.senderId]) {
          clearTimeout(typingTimeoutsRef.current[msg.senderId]);
          delete typingTimeoutsRef.current[msg.senderId];
        }
        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(msg.senderId);
          return next;
        });
      }

      // Update conversations list: update lastMessage and reorder active conversation to top
      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c.id === msg.conversationId);
        if (convIndex !== -1) {
          const target = { ...prev[convIndex], lastMessage: msg };
          const remaining = prev.filter((c) => c.id !== msg.conversationId);
          return [target, ...remaining];
        } else {
          // If conversation wasn't in list yet, refetch conversations list
          const token = localStorage.getItem('accessToken');
          if (token && currentUser?.id) {
            fetchConversations(token, currentUser.id);
          }
          return prev;
        }
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('haven:messages-updated'));
      }
    };

    const handleConversationUpdated = (data: { conversationId: string; lastMessage: any }) => {
      if (!data?.conversationId) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === data.conversationId);
        if (idx !== -1) {
          const updated = { ...prev[idx], lastMessage: data.lastMessage };
          const rest = prev.filter((c) => c.id !== data.conversationId);
          return [updated, ...rest];
        }
        return prev;
      });
    };

    const handleConversationRead = (data: { conversationId: string; userId: string }) => {
      // Ignore our own read receipt to prevent unnecessary re-renders
      if (data.userId === currentUser?.id) return;

      if (selectedConv?.id === data.conversationId) {
        setSelectedConv((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.userId === data.userId ? { ...p, lastReadAt: new Date().toISOString() } : p
            ),
          };
        });
      }
    };

    const handleTypingStart = (data: { conversationId: string; userId: string }) => {
      if (!data?.conversationId || !data?.userId) return;
      if (data.conversationId === selectedConv?.id && data.userId !== currentUser?.id) {
        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
        }
        typingTimeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUserIds((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
          delete typingTimeoutsRef.current[data.userId];
        }, 4000);

        setTypingUserIds((prev) => new Set(prev).add(data.userId));
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (!data?.conversationId || !data?.userId) return;
      if (data.conversationId === selectedConv?.id) {
        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
          delete typingTimeoutsRef.current[data.userId];
        }
        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('conversation:read', handleConversationRead);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    // Loose fallback sync every 15s
    const fallbackInterval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (token && currentUser?.id) {
        fetchConversations(token, currentUser.id);
      }
    }, 15000);

    return () => {
      if (selectedConv?.id) {
        socket.emit('leave:conversation', { conversationId: selectedConv.id });
      }
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('conversation:read', handleConversationRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      clearInterval(fallbackInterval);
    };
  }, [selectedConv?.id, currentUser?.id, apiUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: PendingAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      newAttachments.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        previewUrl,
        isImage,
        name: file.name,
        size: file.size,
      });
    }

    setSelectedAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setSelectedAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const getAttachmentUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    return rawUrl.startsWith('http') ? rawUrl : `${apiUrl}${rawUrl}`;
  };

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedAttachments.length === 0 && !pendingListing) || !selectedConv || isSending) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const contentToSend = inputText.trim();
    const attachmentsToSend = [...selectedAttachments];
    const listingToSend = pendingListing;

    // Clear typing indicator for current user
    const socket = getSocket();
    if (isLocalTypingRef.current && selectedConv?.id) {
      isLocalTypingRef.current = false;
      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
      }
      socket?.emit('typing:stop', { conversationId: selectedConv.id, userId: currentUser?.id });
    }

    setInputText('');
    setSelectedAttachments([]);
    setPendingListing(null);
    setIsSending(true);

    try {
      let res: Response;
      if (attachmentsToSend.length > 0) {
        const formData = new FormData();
        if (contentToSend) {
          formData.append('content', contentToSend);
        }
        if (listingToSend?.id) {
          formData.append('listingId', listingToSend.id);
        }
        attachmentsToSend.forEach((att) => {
          formData.append('files', att.file);
        });

        res = await fetch(`${apiUrl}/conversations/${selectedConv.id}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        res = await fetch(`${apiUrl}/conversations/${selectedConv.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: contentToSend,
            listingId: listingToSend?.id,
          }),
        });
      }

      if (res.ok) {
        const newMessage: Message = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? { ...c, lastMessage: newMessage } : c))
        );
        attachmentsToSend.forEach((att) => {
          if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
        });

        // Clear listingId from URL without reload so subsequent messages aren't tied to it
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.has('listingId')) {
            url.searchParams.delete('listingId');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
          }
          window.dispatchEvent(new CustomEvent('haven:messages-updated'));
        }
      } else {
        setInputText(contentToSend);
        setSelectedAttachments(attachmentsToSend);
        setPendingListing(listingToSend);
        alert('Gửi tin nhắn thất bại');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setInputText(contentToSend);
      setSelectedAttachments(attachmentsToSend);
      setPendingListing(listingToSend);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSending(false);
    }
  };

  // Helper for formatting time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    const socket = getSocket();
    if (!socket || !selectedConv?.id) return;

    if (value.trim().length > 0) {
      if (!isLocalTypingRef.current) {
        isLocalTypingRef.current = true;
        socket.emit('typing:start', { conversationId: selectedConv.id, userId: currentUser?.id });
      }

      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
      }
      localTypingTimeoutRef.current = setTimeout(() => {
        isLocalTypingRef.current = false;
        socket.emit('typing:stop', { conversationId: selectedConv.id, userId: currentUser?.id });
      }, 3000);
    } else {
      if (isLocalTypingRef.current) {
        isLocalTypingRef.current = false;
        if (localTypingTimeoutRef.current) {
          clearTimeout(localTypingTimeoutRef.current);
        }
        socket.emit('typing:stop', { conversationId: selectedConv.id, userId: currentUser?.id });
      }
    }
  };

  const isContract = selectedConv?.type === 'CONTRACT';
  const isGroupChat = isContract || (selectedConv?.participants?.length || 0) > 2;
  const typingText = isGroupChat ? 'Ai đó đang soạn' : 'Đang soạn';
  const otherUser = selectedConv?.otherUser;
  const otherAvatar = !isContract && otherUser?.avatarUrl
    ? (otherUser.avatarUrl.startsWith('http') ? otherUser.avatarUrl : `${apiUrl}${otherUser.avatarUrl}`)
    : undefined;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      {/* ============================================================ */}
      {/* CỘT TRÁI: Danh sách các đoạn chat (Instagram Style)          */}
      {/* ============================================================ */}
      <aside
        className={`w-full md:w-[350px] lg:w-[390px] xl:w-[420px] flex-shrink-0 flex flex-col h-full border-r border-border-subtle bg-surface z-10 transition-all ${
          selectedConv ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header: User Handle / Title & Nút Tạo chat hợp đồng */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border-subtle/70 bg-surface/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
            <span className="font-headline-sm text-lg font-bold text-ink-primary tracking-tight truncate max-w-[220px]">
              {currentUser?.fullName || 'Tin nhắn'}
            </span>
            <span className="material-symbols-outlined text-[18px] text-ink-tertiary">
              keyboard_arrow_down
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
              setCreateSuccess(null);
            }}
            title="Tạo đoạn chat hợp đồng mới"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-primary hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">edit_square</span>
          </button>
        </div>

        {/* Search Bar with Floating Results Dropdown */}
        <div ref={searchContainerRef} className="relative px-3 pt-3 pb-2 z-30 flex-shrink-0">
          <div className="flex items-center bg-surface-card rounded-full px-3.5 py-1.5 shadow-[inset_0_1px_2px_rgba(28,28,28,0.03)] border border-border-subtle focus-within:border-ink-primary transition-all">
            <span className="material-symbols-outlined text-ink-tertiary text-[18px] mr-2 select-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Tìm kiếm..."
              className="w-full bg-transparent font-body-md text-xs text-ink-primary placeholder:text-ink-tertiary outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                className="text-ink-quaternary hover:text-ink-secondary p-0.5 flex items-center transition-colors"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          {/* Search Results Dropdown Popover */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-border-subtle max-h-80 overflow-y-auto backdrop-blur-xl p-2 flex flex-col gap-1 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                <span>Kết quả tìm kiếm</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-ink-tertiary text-xs flex flex-col items-center gap-1.5">
                  <span className="material-symbols-outlined text-[24px] text-ink-quaternary">search_off</span>
                  <span>Không tìm thấy đoạn chat phù hợp với &quot;{searchQuery.trim()}&quot;</span>
                </div>
              ) : (
                searchResults.map((conv) => {
                  const isContractItem = conv.type === 'CONTRACT';
                  const other = conv.otherUser;
                  const avatarUrl = !isContractItem && other?.avatarUrl
                    ? (other.avatarUrl.startsWith('http') ? other.avatarUrl : `${apiUrl}${other.avatarUrl}`)
                    : undefined;
                  const titleText = isContractItem
                    ? (conv.contract?.name || 'Đoạn chat hợp đồng')
                    : (other?.fullName || 'Người dùng Homers');

                  let lastMsgText = 'Bắt đầu trò chuyện';
                  if (conv.lastMessage) {
                    const isMy = conv.lastMessage.senderId === currentUser?.id;
                    let text = conv.lastMessage.content;
                    if (!text && conv.lastMessage.attachments && conv.lastMessage.attachments.length > 0) {
                      text = conv.lastMessage.attachments.some(isImageUrl) ? '[Hình ảnh]' : '[Tệp đính kèm]';
                    }
                    lastMsgText = isMy ? `Bạn: ${text || 'Đã gửi một tin nhắn'}` : (text || 'Đã gửi một tin nhắn');
                  }

                  return (
                    <button
                      key={`search-${conv.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedConv(conv);
                        setSelectedConvId(conv.id);
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container transition-colors text-left group"
                    >
                      <div className="relative flex-shrink-0">
                        {isContractItem ? (
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-[18px]">handshake</span>
                          </div>
                        ) : avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={other?.fullName || 'User'}
                            className="w-9 h-9 rounded-full object-cover border border-border-subtle"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-ink-primary font-semibold text-xs">
                            {other?.fullName ? other.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-ink-primary text-xs truncate">
                            {titleText}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            {conv.isArchived && (
                              <span className="px-1 py-0.2 rounded bg-surface-container-high text-ink-secondary text-[9px] font-medium flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">archive</span>
                                Lưu trữ
                              </span>
                            )}
                            {isContractItem && (
                              <span className="px-1 py-0.2 rounded bg-primary/10 text-primary font-semibold text-[9px]">
                                Hợp đồng
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-ink-secondary truncate">
                          {lastMsgText}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Pending Contract Invitations Banner */}
        {pendingInvitations.length > 0 && (
          <div className="px-3 pb-2 flex-shrink-0">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                <span className="material-symbols-outlined text-[16px]">mark_email_unread</span>
                <span>{pendingInvitations.length} lời mời tham gia hợp đồng</span>
              </div>
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-surface-card p-2.5 rounded-xl border border-border-subtle flex flex-col gap-2 shadow-2xs text-xs"
                >
                  <div>
                    <div className="font-semibold text-ink-primary truncate">
                      {inv.contract.name}
                    </div>
                    <div className="text-[11px] text-ink-secondary truncate">
                      Mời bởi: {inv.contract.landlord.fullName}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleRejectInvitation(inv.id)}
                      disabled={actionInvId === inv.id}
                      className="px-2.5 py-1 rounded-full bg-surface-container text-ink-secondary text-[11px] font-semibold hover:bg-surface-variant transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleApproveInvitation(inv.id)}
                      disabled={actionInvId === inv.id}
                      className="px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionInvId === inv.id ? (
                        <div className="w-3 h-3 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></div>
                      ) : (
                        <span>Chấp nhận</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List Header: Messages Label + Tabs (Instagram style) */}
        <div className="px-3.5 py-1.5 flex items-center justify-between flex-shrink-0">
          <span className="font-semibold text-sm text-ink-primary">Tin nhắn</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                !showArchived
                  ? 'bg-ink-primary text-white shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Chính ({activeConversations.length})
            </button>
            {archivedConversations.length > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived(true)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                  showArchived
                    ? 'bg-ink-primary text-white shadow-xs'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">archive</span>
                <span>Lưu trữ ({archivedConversations.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Conversation Items */}
        <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-1 chat-scrollbar">
          {loadingConvs ? (
            <div className="flex flex-col gap-2 p-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                  <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-3 w-10 rounded" />
                    </div>
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-12 text-ink-tertiary text-xs flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[40px] text-ink-quaternary">
                {showArchived ? 'archive' : 'chat_bubble_outline'}
              </span>
              <span>
                {showArchived
                  ? 'Chưa có đoạn chat nào trong mục lưu trữ'
                  : 'Chưa có cuộc trò chuyện nào'}
              </span>
            </div>
          ) : (
            displayList.map((conv) => {
              const isContractItem = conv.type === 'CONTRACT';
              const other = conv.otherUser;
              const avatarUrl = !isContractItem && other?.avatarUrl
                ? (other.avatarUrl.startsWith('http') ? other.avatarUrl : `${apiUrl}${other.avatarUrl}`)
                : undefined;

              const lastMsg = conv.lastMessage;
              const isMyMessage = lastMsg?.senderId === currentUser?.id;
              const myParticipant = conv.participants.find((p) => p.userId === currentUser?.id);
              const lastReadAt = myParticipant?.lastReadAt;

              const hasBeenReadLocally = readConvIds.has(conv.id);
              const isUnread = !!(
                lastMsg &&
                !isMyMessage &&
                !hasBeenReadLocally &&
                (!lastReadAt || new Date(lastMsg.sentAt) > new Date(lastReadAt))
              );

              const isSelected = selectedConv?.id === conv.id;

              const titleText = isContractItem
                ? (conv.contract?.name || 'Đoạn chat hợp đồng')
                : (other?.fullName || 'Người dùng Homers');

              let lastMsgText = 'Bắt đầu trò chuyện';
              if (lastMsg) {
                let text = lastMsg.content;
                if (!text && lastMsg.listing) {
                  text = `[Bài đăng: ${lastMsg.listing.title}]`;
                } else if (!text && lastMsg.attachments && lastMsg.attachments.length > 0) {
                  text = lastMsg.attachments.some(isImageUrl) ? '[Hình ảnh]' : '[Tệp đính kèm]';
                }
                lastMsgText = isMyMessage ? `Bạn: ${text || 'Đã gửi một tin nhắn'}` : (text || 'Đã gửi một tin nhắn');
              }

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv);
                    setSelectedConvId(conv.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedConv(conv);
                      setSelectedConvId(conv.id);
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left cursor-pointer select-none relative ${
                    isSelected
                      ? 'bg-surface-container-high border border-border-subtle shadow-2xs'
                      : 'hover:bg-surface-container/60 border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {isContractItem ? (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                        <span className="material-symbols-outlined text-[22px]">handshake</span>
                      </div>
                    ) : avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={other?.fullName || 'User'}
                        className="w-12 h-12 rounded-full object-cover border border-border-subtle"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-headline-sm text-ink-primary font-semibold text-sm">
                        {other?.fullName ? other.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`text-sm truncate ${isUnread ? 'font-bold text-ink-primary' : isSelected ? 'font-semibold text-ink-primary' : 'font-medium text-ink-primary'}`}>
                          {titleText}
                        </span>
                        {isContractItem && (
                          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold text-[9px] flex-shrink-0">
                            Hợp đồng
                          </span>
                        )}
                      </div>
                      {lastMsg?.sentAt && (
                        <span className={`text-[11px] flex-shrink-0 ml-1.5 ${isUnread ? 'text-primary font-semibold' : 'text-ink-tertiary'}`}>
                          {formatTime(lastMsg.sentAt)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isUnread ? 'text-ink-primary font-bold' : 'text-ink-secondary'}`}>
                      {lastMsgText}
                    </p>
                  </div>

                  {/* Archive Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleArchive(e, conv.id, !!conv.isArchived)}
                    title={conv.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ đoạn chat'}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink-primary hover:bg-surface-variant transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {conv.isArchived ? 'unarchive' : 'archive'}
                    </span>
                  </button>

                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-sm animate-pulse"></span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* CỘT PHẢI: Đoạn chat đang chọn HOẶC Màn hình chờ (Empty)      */}
      {/* ============================================================ */}
      <section
        className={`flex-1 flex flex-col h-full bg-surface-card/10 min-w-0 transition-all ${
          selectedConv ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <header className="h-16 px-4 border-b border-border-subtle bg-surface-parchment/90 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button on mobile */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConv(null);
                    setSelectedConvId(null);
                    router.push('/messages');
                  }}
                  className="md:hidden w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-ink-primary hover:bg-surface-variant transition-colors flex-shrink-0"
                  title="Quay lại danh sách"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>

                {isContract ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">handshake</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-ink-primary font-semibold text-base leading-tight truncate">
                          {selectedConv.contract?.name || 'Đoạn chat hợp đồng'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold text-[10px] leading-none flex-shrink-0">
                          Hợp đồng
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-secondary leading-none mt-0.5">
                        {selectedConv.participants.length} thành viên
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => otherUser?.userId && router.push(`/profile/${otherUser.userId}`)}
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
                  >
                    <div className="relative flex-shrink-0">
                      {otherAvatar ? (
                        <img
                          src={otherAvatar}
                          alt={otherUser?.fullName || 'User'}
                          className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-label-md text-ink-primary font-semibold text-xs">
                          {otherUser?.fullName ? otherUser.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-ink-primary font-semibold text-base leading-tight truncate">
                        {otherUser?.fullName || 'Người dùng Homers'}
                      </span>
                      <span className="text-[11px] text-ink-secondary leading-none mt-0.5 truncate">
                        {otherUser?.email || otherUser?.phone || 'Đang hoạt động'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Icons (Archive, Info) */}
              <div className="flex items-center gap-1 flex-shrink-0">

                <button
                  type="button"
                  onClick={(e) => handleToggleArchive(e, selectedConv.id, !!selectedConv.isArchived)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-ink-primary hover:bg-surface-container active:scale-95 transition-all"
                  title={selectedConv.isArchived ? 'Bỏ lưu trữ đoạn chat' : 'Lưu trữ đoạn chat'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {selectedConv.isArchived ? 'unarchive' : 'archive'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-ink-primary hover:bg-surface-container active:scale-95 transition-all"
                  title="Thông tin đoạn chat"
                >
                  <span className="material-symbols-outlined text-[21px]">info</span>
                </button>
              </div>
            </header>

            {/* Scrollable Messages Area */}
            <main
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="flex-1 w-full overflow-y-auto px-4 py-4 flex flex-col gap-3 chat-scrollbar relative"
            >
              <div className="max-w-2xl w-full mx-auto flex flex-col gap-3">
                {loadingMessages ? (
                  <div className="flex flex-col gap-4 py-4 w-full">
                    <div className="flex items-end gap-2.5 max-w-[70%]">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <Skeleton className="h-14 w-48 rounded-2xl rounded-bl-sm" />
                    </div>
                    <div className="flex items-end gap-2.5 max-w-[70%] self-end flex-row-reverse">
                      <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm" />
                    </div>
                    <div className="flex items-end gap-2.5 max-w-[70%]">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <Skeleton className="h-20 w-64 rounded-2xl rounded-bl-sm" />
                    </div>
                    <div className="flex items-end gap-2.5 max-w-[70%] self-end flex-row-reverse">
                      <Skeleton className="h-12 w-52 rounded-2xl rounded-br-sm" />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-ink-tertiary font-body-md">
                    Bắt đầu trò chuyện bằng cách gửi tin nhắn bên dưới.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const prevMsg = index > 0 ? messages[index - 1] : undefined;
                    const dateDivider = getMessageDateDivider(msg.sentAt, prevMsg?.sentAt);

                    let senderName = isMe ? (currentUser?.fullName || 'Bạn') : 'Người dùng';
                    let rawAvatar: string | undefined = isMe ? currentUser?.avatarUrl : undefined;

                    if (!isMe) {
                      if (msg.sender?.fullName) {
                        senderName = msg.sender.fullName;
                        rawAvatar = msg.sender.avatarUrl || undefined;
                      } else {
                        const p = selectedConv.participants.find((part) => part.userId === msg.senderId);
                        if (p?.fullName) {
                          senderName = p.fullName;
                          rawAvatar = p.avatarUrl;
                        } else if (selectedConv.otherUser?.fullName) {
                          senderName = selectedConv.otherUser.fullName;
                          rawAvatar = selectedConv.otherUser.avatarUrl;
                        }
                      }
                    }

                    const avatarUrl = rawAvatar
                      ? (rawAvatar.startsWith('http') ? rawAvatar : `${apiUrl}${rawAvatar}`)
                      : undefined;

                    const initials = senderName
                      ? senderName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'U';

                    return (
                      <React.Fragment key={msg.id}>
                        {dateDivider && (
                          <div className="flex items-center justify-center my-3 select-none">
                            <span className="px-3.5 py-1 rounded-full bg-surface-container-high/90 text-ink-secondary text-[11px] font-medium shadow-2xs border border-border-subtle/80">
                              {dateDivider}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex gap-2.5 max-w-[85%] ${
                            isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'
                          }`}
                        >
                          {/* Sender Avatar */}
                          <div className="flex-shrink-0 self-start mt-0.5">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover border border-border-subtle shadow-xs"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shadow-xs ${
                                  isMe
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-secondary-container text-ink-primary'
                                }`}
                              >
                                {initials}
                              </div>
                            )}
                          </div>

                          {/* Message Bubble + Name + Timestamp */}
                          <div className={`flex flex-col max-w-[85%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                            {isContract && !isMe && (
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[12px] font-semibold text-ink-primary">
                                  {senderName}
                                </span>
                              </div>
                            )}

                            {/* Attached Listing Card */}
                            {msg.listing && (
                              <div
                                onClick={() => router.push(`/listings/${msg.listing!.id}`)}
                                className={`mb-2 w-full max-w-sm rounded-2xl overflow-hidden border transition-all cursor-pointer group shadow-xs hover:shadow-md ${
                                  isMe
                                    ? 'bg-surface-card border-border-subtle/80 hover:border-primary'
                                    : 'bg-surface-card border-border-subtle/80 hover:border-primary'
                                }`}
                              >
                                <div className="relative aspect-[16/9] w-full bg-surface-container overflow-hidden">
                                  {msg.listing.imageUrl ? (
                                    <img
                                      src={
                                        msg.listing.imageUrl.startsWith('http')
                                          ? msg.listing.imageUrl
                                          : `${apiUrl}${msg.listing.imageUrl}`
                                      }
                                      alt={msg.listing.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ink-tertiary">
                                      <span className="material-symbols-outlined text-[32px]">home</span>
                                    </div>
                                  )}
                                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white shadow-xs">
                                      {msg.listing.saleType === 'RENT' ? 'Cho thuê' : 'Cần bán'}
                                    </span>
                                  </div>
                                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-ink-primary font-bold text-xs shadow-xs">
                                    {msg.listing.saleType === 'RENT'
                                      ? `${Number(msg.listing.monthlyRent || 0).toLocaleString('vi-VN')} ₫/tháng`
                                      : `${Number(msg.listing.salePrice || 0).toLocaleString('vi-VN')} ₫`}
                                  </div>
                                </div>
                                <div className="p-3 flex flex-col gap-1 bg-surface-card text-left">
                                  <h4 className="text-xs sm:text-sm font-semibold text-ink-primary line-clamp-1 group-hover:text-primary transition-colors">
                                    {msg.listing.title}
                                  </h4>
                                  {msg.listing.address && (
                                    <p className="text-[11px] text-ink-secondary line-clamp-1 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px] text-ink-tertiary">location_on</span>
                                      {msg.listing.address}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className={`flex flex-col gap-1.5 mb-1.5 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                                {(() => {
                                  const images = msg.attachments.filter(isImageUrl);
                                  const files = msg.attachments.filter((url) => !isImageUrl(url));

                                  return (
                                    <>
                                      {images.length > 0 && (
                                        <div
                                          className={`grid gap-1.5 rounded-2xl overflow-hidden ${
                                            images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                          }`}
                                        >
                                          {images.map((imgUrl, imgIdx) => {
                                            const fullUrl = getAttachmentUrl(imgUrl);
                                            return (
                                              <a
                                                key={`img-${imgIdx}`}
                                                href={fullUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative group overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary/20 shadow-xs block cursor-pointer"
                                              >
                                                <img
                                                  src={fullUrl}
                                                  alt="Hình ảnh đính kèm"
                                                  className={`w-full object-cover transition-transform group-hover:scale-105 duration-200 ${
                                                    images.length === 1 ? 'max-h-72 min-h-32' : 'h-36'
                                                  }`}
                                                  loading="lazy"
                                                />
                                              </a>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {files.length > 0 && (
                                        <div className="flex flex-col gap-1.5 w-full">
                                          {files.map((fileUrl, fileIdx) => {
                                            const fullUrl = getAttachmentUrl(fileUrl);
                                            const rawName = fileUrl.split('/').pop() || 'Tệp đính kèm';
                                            const displayName = rawName.includes('-')
                                              ? rawName.substring(rawName.indexOf('-') + 1)
                                              : rawName;
                                            const fileInfo = getFileTypeInfo(displayName);

                                            return (
                                              <a
                                                key={`file-${fileIdx}`}
                                                href={fullUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                                                  isMe
                                                    ? 'bg-primary/10 border-primary/20 hover:bg-primary/20 text-ink-primary'
                                                    : 'bg-surface-card border-border-subtle hover:bg-surface-secondary text-ink-primary'
                                                }`}
                                              >
                                                <div className={`w-10 h-10 rounded-xl ${fileInfo.bgClass} flex items-center justify-center flex-shrink-0 ${fileInfo.iconColor} border ${fileInfo.borderClass} shadow-2xs`}>
                                                  <FileTypeIcon filename={displayName} className="w-[22px] h-[26px]" />
                                                </div>
                                                <div className="flex-1 min-w-0 pr-1">
                                                  <p className="text-xs font-semibold truncate text-ink-primary" title={displayName}>
                                                    {displayName}
                                                  </p>
                                                  <p className="text-[10px] text-ink-tertiary">
                                                    Bấm để tải về
                                                  </p>
                                                </div>
                                                <span className="material-symbols-outlined text-[18px] text-ink-tertiary">
                                                  download
                                                </span>
                                              </a>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Text Message Content */}
                            {msg.content && msg.content.trim() !== '' && (
                              <div
                                className={`px-4 py-2.5 rounded-2xl font-body-md text-sm shadow-xs break-words whitespace-pre-wrap ${
                                  isMe
                                    ? 'bg-primary text-on-primary rounded-tr-xs shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.2)]'
                                    : 'bg-surface-card text-ink-primary rounded-tl-xs border border-border-subtle'
                                }`}
                              >
                                {msg.content}
                              </div>
                            )}

                            <span className="text-[10px] text-ink-tertiary mt-1 px-1">
                              {formatTime(msg.sentAt)}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="fixed bottom-20 right-6 z-20 w-10 h-10 rounded-full bg-surface-card text-ink-primary shadow-lg border border-border-subtle flex items-center justify-center hover:bg-surface-secondary active:scale-95 transition-all group"
                  title="Cuộn xuống tin nhắn mới nhất"
                >
                  <span className="material-symbols-outlined text-[20px] text-ink-secondary group-hover:text-ink-primary transition-colors">
                    arrow_downward
                  </span>
                </button>
              )}
            </main>

            {/* Input Bar Footer (Instagram Style) */}
            <footer className="border-t border-border-subtle p-3 bg-surface-parchment/95 backdrop-blur-xl flex-shrink-0">
              <div className="max-w-2xl w-full mx-auto flex flex-col gap-2">
                {/* Pending Attached Listing Preview */}
                {pendingListing && (
                  <div className="flex items-center gap-3 p-2.5 bg-surface-card rounded-2xl border border-primary/40 shadow-xs relative animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 relative">
                      {pendingListing.imageUrl ? (
                        <img
                          src={
                            pendingListing.imageUrl.startsWith('http')
                              ? pendingListing.imageUrl
                              : `${apiUrl}${pendingListing.imageUrl}`
                          }
                          alt={pendingListing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-tertiary">
                          <span className="material-symbols-outlined text-[20px]">home</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary text-on-primary">
                          Đính kèm tin đăng
                        </span>
                        <span className="text-[11px] font-bold text-accent-warm">
                          {pendingListing.saleType === 'RENT'
                            ? `${Number(pendingListing.monthlyRent || 0).toLocaleString('vi-VN')} ₫/tháng`
                            : `${Number(pendingListing.salePrice || 0).toLocaleString('vi-VN')} ₫`}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink-primary truncate" title={pendingListing.title}>
                        {pendingListing.title}
                      </p>
                      {pendingListing.address && (
                        <p className="text-[11px] text-ink-secondary truncate">
                          {pendingListing.address}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingListing(null);
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href);
                          if (url.searchParams.has('listingId')) {
                            url.searchParams.delete('listingId');
                            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
                          }
                        }
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink-primary hover:bg-surface-secondary/80 transition-colors"
                      title="Bỏ đính kèm tin đăng"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {/* Selected Attachments Preview */}
                {selectedAttachments.length > 0 && (
                  <div className="pt-1 pb-1">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-xs font-medium text-ink-secondary">
                        Đính kèm ({selectedAttachments.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          selectedAttachments.forEach((att) => {
                            if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
                          });
                          setSelectedAttachments([]);
                        }}
                        className="text-xs text-error hover:underline"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 px-1">
                      {selectedAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="relative group flex items-center gap-2 p-1.5 bg-surface-card border border-border-subtle rounded-xl shadow-xs flex-shrink-0"
                        >
                          {att.isImage && att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (() => {
                            const fileInfo = getFileTypeInfo(att.name);
                            return (
                              <div className={`w-12 h-12 ${fileInfo.bgClass} ${fileInfo.iconColor} rounded-xl flex items-center justify-center flex-shrink-0 border ${fileInfo.borderClass} shadow-2xs`}>
                                <FileTypeIcon filename={att.name} className="w-[26px] h-[30px]" />
                              </div>
                            );
                          })()}
                          <div className="min-w-0 max-w-[130px] pr-2">
                            <p className="text-xs font-medium text-ink-primary truncate" title={att.name}>
                              {att.name}
                            </p>
                            <p className="text-[10px] text-ink-tertiary">
                              {formatFileSize(att.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink-tertiary/90 text-white hover:bg-error flex items-center justify-center transition-all shadow-sm"
                            title="Xóa"
                          >
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typing Indicator: Hiển thị ngay bên trên nút kẹp giấy */}
                {typingUserIds.size > 0 && (
                  <div className="flex items-center gap-1.5 pl-1 select-none animate-fade-in">
                    {/* Animated 3-dots */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-card border border-border-subtle shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-[12px] font-medium text-ink-secondary">
                      {typingText}
                    </span>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    id="chat-file-input"
                  />

                  {/* Nút kẹp giấy bên trái thanh chat để gửi file và ảnh */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    title="Đính kèm tệp hoặc ảnh"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-container active:scale-95 transition-all flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[22px]">attach_file</span>
                  </button>

                  {/* Thanh chat */}
                  <div className="flex-1 flex items-center bg-surface-card rounded-full px-4 py-1.5 border border-border-subtle focus-within:border-ink-primary transition-all shadow-2xs">
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder="Nhắn tin..."
                      className="w-full bg-transparent font-body-md text-sm text-ink-primary placeholder:text-ink-tertiary outline-none py-1"
                    />
                  </div>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && selectedAttachments.length === 0) || isSending}
                    className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 transition-all shadow-xs active:scale-95 flex-shrink-0"
                  >
                    {isSending ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    )}
                  </button>
                </form>
              </div>
            </footer>
          </>
        ) : (
          /* Empty state on desktop when no conversation is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-surface-card/10">
            <div className="w-24 h-24 rounded-full border-2 border-border-strong flex items-center justify-center mb-4 text-ink-tertiary">
              <span className="material-symbols-outlined text-[44px]">chat</span>
            </div>
            <h2 className="font-headline-sm text-xl font-bold text-ink-primary mb-1.5">
              Tin nhắn của bạn
            </h2>
            <p className="font-body-md text-sm text-ink-secondary max-w-sm mb-6">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo đoạn chat hợp đồng mới để bắt đầu kết nối.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                setCreateError(null);
                setCreateSuccess(null);
              }}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Tạo chat hợp đồng</span>
            </button>
          </div>
        )}
      </section>

      {/* Chat Settings Modal */}
      {selectedConv && (
        <ChatSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          conversation={selectedConv}
          currentUser={currentUser}
          isArchived={!!selectedConv.isArchived}
          onToggleArchive={() => {
            const currentArchived = !!selectedConv.isArchived;
            const fakeEvent = { preventDefault: () => { }, stopPropagation: () => { } } as any;
            handleToggleArchive(fakeEvent, selectedConv.id, currentArchived);
          }}
          onUpdateConversationName={(newName) => {
            setSelectedConv((prev) =>
              prev && prev.contract
                ? { ...prev, contract: { ...prev.contract, name: newName } }
                : prev
            );
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedConv.id && c.contract
                  ? { ...c, contract: { ...c.contract, name: newName } }
                  : c
              )
            );
          }}
          onOpenDirectChat={(targetUserId) => {
            setShowSettingsModal(false);
            openConversationByTarget({ userId: targetUserId });
          }}
          onLeaveContractSuccess={() => {
            setShowSettingsModal(false);
            setSelectedConv(null);
            setSelectedConvId(null);
            const token = localStorage.getItem('accessToken');
            if (token && currentUser) {
              fetchConversations(token, currentUser.id);
            }
          }}
        />
      )}

      {/* Modal: Tạo đoạn chat hợp đồng */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg bg-surface-card rounded-3xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-parchment/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">handshake</span>
                </div>
                <h2 className="font-headline-sm text-base font-semibold text-ink-primary">
                  Tạo đoạn chat hợp đồng
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateContract} className="p-6 flex flex-col gap-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-medium">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-medium">
                  {createSuccess}
                </div>
              )}

              {/* Tên hợp đồng */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-primary">
                  Tên hợp đồng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="Ví dụ: Hợp đồng thuê phòng 302, Masteri Thảo Điền"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface text-ink-primary text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Danh sách số điện thoại tenant */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-primary">
                  Số điện thoại người thuê / thành viên <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPhone();
                      }
                    }}
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface text-ink-primary text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPhone()}
                    className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-variant text-ink-primary text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Thêm</span>
                  </button>
                </div>

                {/* Display added phone chips */}
                {tenantPhones.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tenantPhones.map((phone, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        <span className="material-symbols-outlined text-[14px]">phone</span>
                        <span>{phone}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(idx)}
                          className="hover:text-red-500 transition-colors ml-0.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-ink-secondary mt-1">
                  💡 Người thuê cần có tài khoản đã đăng ký bằng số điện thoại này trên Homers để nhận thông báo lời mời và tham gia nhóm chat.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-ink-secondary hover:bg-surface-container text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingContract}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingContract ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></div>
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Tạo hợp đồng & Bắt đầu chat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesContent />
    </Suspense>
  );
}
