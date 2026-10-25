'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface ChatMember {
  id?: string;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: 'LANDLORD' | 'TENANT' | 'MEMBER' | string;
  isMe?: boolean;
}

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    type: string;
    contractId?: string | null;
    contract?: {
      id: string;
      name: string;
      status: string;
      landlordId: string;
    } | null;
    participants: Array<{
      id: string;
      userId: string;
      fullName: string;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    }>;
    otherUser?: {
      id: string;
      userId: string;
      fullName: string;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    };
    createdAt?: string;
  };
  currentUser: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
  } | null;
  isArchived?: boolean;
  onToggleArchive?: () => void;
  onUpdateConversationName?: (newName: string) => void;
  onOpenDirectChat?: (targetUserId: string) => void;
  onLeaveContractSuccess?: () => void;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  isArchived,
  onToggleArchive,
  onUpdateConversationName,
  onOpenDirectChat,
  onLeaveContractSuccess,
}) => {
  const router = useRouter();
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Edit Contract Name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Invite Tenant state
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Leave contract state
  const [leaving, setLeaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const isContract = conversation.type === 'CONTRACT';
  const isLandlord = isContract && conversation.contract?.landlordId === currentUser?.id;
  const isTenant = isContract && !isLandlord;

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `${apiUrl}${url}`;
  };

  // Fetch updated members list when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset temporary states
    setIsEditingName(false);
    setEditedName(conversation.contract?.name || '');
    setNameError(null);
    setInvitePhone('');
    setInviteSuccess(null);
    setInviteError(null);

    // Initial populate from conversation participants
    const initialList: ChatMember[] = conversation.participants.map((p) => {
      let role = 'MEMBER';
      if (isContract) {
        if (p.userId === conversation.contract?.landlordId) {
          role = 'LANDLORD';
        } else {
          role = 'TENANT';
        }
      }
      return {
        id: p.id,
        userId: p.userId,
        fullName: p.fullName,
        avatarUrl: p.avatarUrl,
        phone: p.phone,
        email: p.email,
        role,
        isMe: p.userId === currentUser?.id,
      };
    });
    setMembers(initialList);

    // Fetch latest members from backend
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLoadingMembers(true);
    fetch(`${apiUrl}/conversations/${conversation.id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.members) {
          setMembers(data.members);
        }
      })
      .catch((err) => console.error('Error fetching members:', err))
      .finally(() => setLoadingMembers(false));
  }, [isOpen, conversation.id, conversation.participants, isContract, conversation.contract?.landlordId, conversation.contract?.name, currentUser?.id, apiUrl]);

  // Handle saving new contract name
  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      setNameError('Tên đoạn chat không được để trống.');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSavingName(true);
    setNameError(null);
    try {
      const res = await fetch(`${apiUrl}/conversations/${conversation.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.ok) {
        setIsEditingName(false);
        if (onUpdateConversationName) {
          onUpdateConversationName(trimmed);
        }
      } else {
        const err = await res.json().catch(() => null);
        setNameError(err?.message || 'Không thể cập nhật tên đoạn chat.');
      }
    } catch (err) {
      console.error('Error updating name:', err);
      setNameError('Lỗi kết nối máy chủ.');
    } finally {
      setSavingName(false);
    }
  };

  // Handle inviting a new tenant to contract
  const handleInviteTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    const cleanPhone = invitePhone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setInviteError('Vui lòng nhập số điện thoại người thuê.');
      return;
    }

    if (!conversation.contractId) {
      setInviteError('Hợp đồng không tồn tại.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setInviting(true);
    try {
      const res = await fetch(`${apiUrl}/contracts/invitations/${conversation.contractId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (res.ok) {
        setInviteSuccess(`Đã gửi lời mời thành công tới số điện thoại ${cleanPhone}!`);
        setInvitePhone('');
      } else {
        const err = await res.json().catch(() => null);
        setInviteError(err?.message || 'Không thể gửi lời mời. Vui lòng kiểm tra lại số điện thoại.');
      }
    } catch (err) {
      console.error('Error inviting tenant:', err);
      setInviteError('Lỗi kết nối máy chủ.');
    } finally {
      setInviting(false);
    }
  };

  // Handle tenant leaving contract
  const handleLeaveContract = async () => {
    if (!conversation.contractId) return;

    const confirmLeave = window.confirm(
      'Bạn có chắc chắn muốn rời khỏi hợp đồng và đoạn chat này? Thao tác này không thể hoàn tác.'
    );
    if (!confirmLeave) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLeaving(true);
    try {
      const res = await fetch(`${apiUrl}/contracts/${conversation.contractId}/tenants/me/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        onClose();
        if (onLeaveContractSuccess) {
          onLeaveContractSuccess();
        } else {
          router.push('/messages');
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Không thể rời khỏi hợp đồng.');
      }
    } catch (err) {
      console.error('Error leaving contract:', err);
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setLeaving(false);
    }
  };

  const formatContractStatus = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Đang hoạt động', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' };
      case 'PENDING':
        return { label: 'Chờ duyệt', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' };
      case 'TERMINATED':
        return { label: 'Đã chấm dứt', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' };
      case 'EXPIRED':
        return { label: 'Đã hết hạn', color: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400' };
      default:
        return { label: 'Hợp đồng', color: 'bg-primary/10 text-primary' };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-primary/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-card rounded-3xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[88vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-parchment/70">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-primary">settings</span>
            <h2 className="font-headline-sm text-base font-semibold text-ink-primary">
              Cài đặt đoạn chat
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Conversation Overview Card */}
          <div className="p-4 rounded-2xl bg-surface-parchment/60 border border-border-subtle flex flex-col gap-3">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isContract ? 'bg-primary/10 text-primary' : 'bg-accent-warm/10 text-accent-warm'
                }`}
              >
                <span className="material-symbols-outlined text-[26px]">
                  {isContract ? 'handshake' : 'person'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {isContract ? (
                  isEditingName ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          placeholder="Nhập tên hợp đồng mới"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-primary/40 bg-surface text-ink-primary text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          disabled={savingName}
                          onClick={handleSaveName}
                          className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {savingName ? 'Lưu...' : 'Lưu'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setEditedName(conversation.contract?.name || '');
                            setNameError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-surface-container text-ink-secondary text-xs font-semibold hover:bg-surface-variant transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                      {nameError && <p className="text-xs text-rose-500 font-medium">{nameError}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-base font-semibold text-ink-primary truncate">
                        {conversation.contract?.name || 'Đoạn chat hợp đồng'}
                      </h3>
                      {isLandlord && (
                        <button
                          onClick={() => {
                            setEditedName(conversation.contract?.name || '');
                            setIsEditingName(true);
                          }}
                          className="p-1 rounded-lg hover:bg-surface-container text-ink-secondary transition-colors"
                          title="Đổi tên hợp đồng"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <h3 className="font-headline-sm text-base font-semibold text-ink-primary truncate">
                    {conversation.otherUser?.fullName || 'Người dùng Homers'}
                  </h3>
                )}

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-ink-secondary text-[11px] font-medium">
                    {isContract ? 'Đoạn chat hợp đồng nhóm' : 'Đoạn chat trực tiếp 1-1'}
                  </span>
                  {isContract && conversation.contract?.status && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        formatContractStatus(conversation.contract.status).color
                      }`}
                    >
                      {formatContractStatus(conversation.contract.status).label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {conversation.createdAt && (
              <div className="pt-2 border-t border-border-subtle/50 text-[11px] text-ink-tertiary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                <span>Tạo lúc: {new Date(conversation.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>

          {/* Members Section (Specialized for Group Contract Chat) */}
          {isContract ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                  <h4 className="font-headline-sm text-sm font-semibold text-ink-primary">
                    Thành viên đoạn chat ({members.length})
                  </h4>
                </div>
                {loadingMembers && (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                )}
              </div>

              {/* Members List */}
              <div className="flex flex-col gap-2">
                {members.map((member) => {
                  const avatarSrc = getAvatarUrl(member.avatarUrl);
                  const isLandlordMember =
                    member.role === 'LANDLORD' || member.userId === conversation.contract?.landlordId;
                  const isMeMember = member.userId === currentUser?.id;

                  return (
                    <div
                      key={member.userId}
                      className="p-3 rounded-2xl border border-border-subtle bg-surface-card hover:bg-surface-parchment/40 transition-colors flex items-center justify-between gap-3"
                    >
                      {/* Member Info */}
                      <div
                        onClick={() => {
                          onClose();
                          router.push(`/profile/${member.userId}`);
                        }}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                        title="Xem trang cá nhân"
                      >
                        <div className="relative flex-shrink-0">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={member.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-border-subtle group-hover:ring-2 group-hover:ring-primary transition-all"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-secondary-container text-ink-primary flex items-center justify-center font-bold text-xs group-hover:ring-2 group-hover:ring-primary transition-all">
                              {member.fullName
                                ? member.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .substring(0, 2)
                                    .toUpperCase()
                                : 'U'}
                            </div>
                          )}

                          {isLandlordMember && (
                            <span
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs"
                              title="Chủ nhà"
                            >
                              <span className="material-symbols-outlined text-[10px]">star</span>
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-headline-sm text-sm font-semibold text-ink-primary truncate group-hover:text-primary transition-colors">
                              {member.fullName}
                            </span>

                            {isMeMember && (
                              <span className="px-1.5 py-0.2 rounded bg-surface-container text-ink-secondary text-[10px] font-semibold">
                                Bạn
                              </span>
                            )}

                            {isLandlordMember ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-bold">
                                Chủ nhà
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                Người thuê
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-tertiary truncate">
                            {member.phone && <span>{member.phone}</span>}
                            {member.phone && member.email && <span>•</span>}
                            {member.email && <span className="truncate">{member.email}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions for member */}
                      {!isMeMember && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {onOpenDirectChat && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenDirectChat(member.userId);
                              }}
                              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-ink-primary transition-colors"
                              title="Nhắn tin riêng"
                            >
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              router.push(`/profile/${member.userId}`);
                            }}
                            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-ink-primary transition-colors"
                            title="Xem trang cá nhân"
                          >
                            <span className="material-symbols-outlined text-[16px]">person</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Landlord Feature: Invite New Tenant */}
              {isLandlord && (
                <div className="mt-2 p-4 rounded-2xl border border-dashed border-border-strong/40 bg-surface-parchment/40 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 text-ink-primary font-semibold text-xs">
                    <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                    <span>Mời thêm người thuê vào hợp đồng</span>
                  </div>

                  <form onSubmit={handleInviteTenant} className="flex gap-2">
                    <input
                      type="tel"
                      value={invitePhone}
                      onChange={(e) => {
                        setInvitePhone(e.target.value);
                        setInviteError(null);
                        setInviteSuccess(null);
                      }}
                      placeholder="Nhập số điện thoại người thuê..."
                      className="flex-1 px-3 py-2 rounded-xl border border-border-subtle bg-surface text-ink-primary text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={inviting || !invitePhone.trim()}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs flex items-center gap-1 flex-shrink-0"
                    >
                      {inviting ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></div>
                      ) : (
                        <span>Gửi mời</span>
                      )}
                    </button>
                  </form>

                  {inviteSuccess && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      {inviteSuccess}
                    </p>
                  )}
                  {inviteError && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {inviteError}
                    </p>
                  )}
                </div>
              )}

              {/* Tenant Feature: Leave Contract */}
              {isTenant && (
                <div className="mt-3 pt-3 border-t border-border-subtle flex justify-end">
                  <button
                    disabled={leaving}
                    onClick={handleLeaveContract}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>{leaving ? 'Đang xử lý...' : 'Rời khỏi hợp đồng'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Direct Chat Info */
            <div className="flex flex-col gap-3">
              <h4 className="font-headline-sm text-sm font-semibold text-ink-primary">
                Thông tin người nhận
              </h4>

              {conversation.otherUser && (
                <div className="p-4 rounded-2xl border border-border-subtle bg-surface-card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {conversation.otherUser.avatarUrl ? (
                        <img
                          src={getAvatarUrl(conversation.otherUser.avatarUrl)}
                          alt={conversation.otherUser.fullName}
                          className="w-12 h-12 rounded-full object-cover border border-border-subtle"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary-container text-ink-primary flex items-center justify-center font-bold text-sm">
                          {conversation.otherUser.fullName
                            ? conversation.otherUser.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()
                            : 'U'}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-headline-sm text-sm font-semibold text-ink-primary">
                        {conversation.otherUser.fullName}
                      </span>
                      <span className="text-xs text-ink-secondary">
                        {conversation.otherUser.email || conversation.otherUser.phone || 'Thành viên Homers'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/profile/${conversation.otherUser!.userId}`);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-ink-primary text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Xem hồ sơ</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions (Archive / Unarchive) */}
          {onToggleArchive && (
            <div className="pt-4 border-t border-border-subtle flex flex-col gap-2 mt-4">
              <button
                type="button"
                onClick={onToggleArchive}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container text-ink-primary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-ink-secondary">
                    {isArchived ? 'unarchive' : 'archive'}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink-primary">
                      {isArchived ? 'Bỏ lưu trữ đoạn chat này' : 'Lưu trữ đoạn chat này'}
                    </div>
                    <div className="text-xs text-ink-tertiary">
                      {isArchived
                        ? 'Đưa đoạn chat này trở lại hộp thư đến'
                        : 'Ẩn đoạn chat khỏi danh sách chính nhưng vẫn giữ tin nhắn'}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-ink-quaternary">
                  chevron_right
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
