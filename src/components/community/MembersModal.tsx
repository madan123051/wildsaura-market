'use client';

import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/utils';
import type { Member } from '@/types/community';

interface MembersModalProps {
  onClose: () => void;
  members: Member[];
  memberCount: number;
}

export function MembersModal({ onClose, members, memberCount }: MembersModalProps) {
  return (
    <Modal onClose={onClose} maxWidth={420}>
      <h2 style={{ fontWeight: 700, color: '#d4a373', fontSize: '1.2rem', marginBottom: '0.5rem', textAlign: 'center' }}>👥 Community Members</h2>
      <p style={{ textAlign: 'center', color: '#8a8f98', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {memberCount} {memberCount === 1 ? 'member' : 'members'} joined
      </p>

      <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {members.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
            No members yet. Be the first to join! 🌿
          </div>
        ) : (
          members.map((m) => (
            <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: '#1f2126', borderRadius: 12, padding: '0.6rem 0.8rem' }}>
              <Avatar displayName={m.displayName || 'User'} avatarUrl={m.avatarUrl} avatarColor={m.avatarColor} size={36} />
              <div>
                <div style={{ fontWeight: 600, color: '#e4e4e7', fontSize: '0.95rem' }}>{m.displayName || 'User'}</div>
                <div style={{ color: '#8a8f98', fontSize: '0.75rem' }}>
                  {m.joinedAt ? `Joined ${timeAgo(m.joinedAt)}` : 'Member'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button style={{ background: '#1f2126', border: 'none', color: '#e4e4e7', padding: '0.6rem 1.4rem', borderRadius: 30, fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
