'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useMembers } from '@/hooks/useMembers';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { ShareModal } from './ShareModal';
import { MembersModal } from './MembersModal';
import { AuthModal } from './AuthModal';
import { Toast } from '@/components/ui/Toast';
import type { Post } from '@/types/community';

const COMMUNITY_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}`
    : 'https://community.wildsaura.com';

const NAV_SITES = [
  { label: 'WildSaura', href: 'https://wildsaura.com', emoji: '🏠' },
  { label: 'Drishya', href: 'https://drishya.wildsaura.com', emoji: '📸' },
  { label: 'Market', href: 'https://market.wildsaura.com', emoji: '🛒' },
];

// ── Profile Edit Modal ──────────────────────────────────────────────────
function ProfileEditModal({
  user, onClose, onSave
}: {
  user: { displayName?: string; avatarUrl?: string };
  onClose: () => void;
  onSave: (name: string, photo: File | null) => Promise<void>;
}) {
  const [name, setName] = useState(user.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(name, photoFile); onClose(); }
    catch (e: any) { alert('Failed: ' + (e?.message || 'Try again')); }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#0f1114', border: '1px solid rgba(212,163,115,0.2)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#e9c46a', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>✏️ Edit Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: '50%', cursor: 'pointer',
              border: '2.5px solid rgba(212,163,115,0.4)',
              overflow: 'hidden', position: 'relative',
              background: 'rgba(212,163,115,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212,163,115,0.15)',
            }}
          >
            {preview ? (
              <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>👤</span>
            )}
            {/* Overlay */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
            >
              <span style={{ fontSize: '1.5rem' }}>📷</span>
            </div>
          </div>
          <span style={{ color: 'rgba(212,163,115,0.5)', fontSize: '0.75rem' }}>Tap to change photo</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ color: 'rgba(212,163,115,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>Display Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name..."
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,163,115,0.2)',
              borderRadius: 10, padding: '0.65rem 0.9rem', color: '#e5e7eb',
              fontSize: '0.95rem', outline: 'none', width: '100%',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.7rem' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', borderRadius: 12, padding: '0.7rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, background: 'linear-gradient(135deg, #d4a373, #e9c46a)', color: '#0b0c0e', border: 'none', borderRadius: 12, padding: '0.7rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: saving ? 0.7 : 1 }}
          >{saving ? '💾 Saving...' : '✅ Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Avatar + Dropdown ────────────────────────────────────────────
function ProfileMenu({
  user, onLogout, onEditProfile, onShare
}: {
  user: { displayName?: string; avatarUrl?: string; email?: string };
  onLogout: () => void;
  onEditProfile: () => void;
  onShare: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user.displayName || 'W').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: open ? '2px solid #e9c46a' : '2px solid rgba(212,163,115,0.35)',
          overflow: 'hidden', cursor: 'pointer', padding: 0,
          background: 'rgba(212,163,115,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
          boxShadow: open ? '0 0 12px rgba(233,196,106,0.3)' : 'none',
          flexShrink: 0,
        }}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e9c46a', lineHeight: 1 }}>{initials}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'rgba(14,16,20,0.97)',
          border: '1px solid rgba(212,163,115,0.2)',
          borderRadius: 16, minWidth: 210,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden', zIndex: 200,
          backdropFilter: 'blur(16px)',
        }}>
          {/* User info header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(212,163,115,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid rgba(212,163,115,0.3)', overflow: 'hidden', background: 'rgba(212,163,115,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e9c46a' }}>{initials}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</div>
              {user.email && <div style={{ color: '#6b7280', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
            </div>
          </div>

          {/* Menu items */}
          {[
            { icon: '✏️', label: 'Edit Profile', action: () => { setOpen(false); onEditProfile(); } },
            { icon: '📤', label: 'Share Community', action: () => { setOpen(false); onShare(); } },
            { icon: '↩️', label: 'Logout', action: () => { setOpen(false); onLogout(); }, danger: true },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: '100%', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.7rem 1rem', cursor: 'pointer',
                color: item.danger ? '#f87171' : '#d1d5db',
                fontSize: '0.88rem', fontWeight: 500,
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = item.danger ? 'rgba(239,68,68,0.08)' : 'rgba(212,163,115,0.07)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Community Page ──────────────────────────────────────────────────
export function CommunityPage() {
  const { user, loading: authLoading, loginWithGoogle, loginWithFacebook, loginWithApple, logout, updateUserProfile } = useAuth();
  const { posts, loading: postsLoading, createPost, updatePost, deletePost, toggleLike, addComment } = usePosts(user);
  const { members, memberCount, isMember, joining, joinCommunity, ensureMember } = useMembers(user);

  const [showPostModal, setShowPostModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const requireLogin = (action: () => void) => {
    if (!user) { setShowAuthModal(true); return; }
    action();
  };

  const handleCreatePost = async (text: string, category: string, story: string, imageFile: File | null) => {
    if (!user) return;
    setSubmitting(true);
    setUploadProgress(imageFile ? '📷 Compressing image...' : '');
    try {
      if (editingPost) {
        setUploadProgress(imageFile ? '☁️ Uploading photo...' : '💾 Saving...');
        await updatePost(editingPost.id, text, category, story, imageFile, editingPost.imageUrl);
        showToast('✅ Post updated!');
      } else {
        if (imageFile) setUploadProgress('☁️ Uploading photo...');
        const result = await createPost(text, category, story, imageFile);
        if (result.success) {
          await ensureMember();
          showToast(result.imageUploaded ? '✅ Post published with photo!' : '✅ Post published!');
        }
      }
      setShowPostModal(false);
      setEditingPost(null);
    } catch (err: any) {
      showToast(`❌ Failed: ${err?.message || 'Try again'}`);
    }
    setSubmitting(false);
    setUploadProgress('');
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowPostModal(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    await deletePost(postId);
    showToast('🗑️ Post deleted');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(COMMUNITY_URL);
      showToast('✅ Link copied!');
    } catch {
      window.prompt('Copy this link:', COMMUNITY_URL);
    }
  };

  const handleProfileSave = async (name: string, photo: File | null) => {
    await updateUserProfile(name, photo);
    showToast('✅ Profile updated!');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--wa-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── TOP NAV STRIP ── */}
      <div style={{
        background: 'rgba(5,6,8,0.95)',
        borderBottom: '1px solid rgba(212,163,115,0.08)',
        padding: '0.35rem 1rem',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.15rem' }}>
            {NAV_SITES.map(site => (
              <a
                key={site.href}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  color: '#8a8f98', fontSize: '0.72rem', fontWeight: 500,
                  textDecoration: 'none', padding: '0.2rem 0.55rem', borderRadius: 20,
                  transition: 'all 0.2s', letterSpacing: '0.01em',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#d4a373'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,163,115,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8a8f98'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span>{site.emoji}</span> {site.label}
              </a>
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'rgba(212,163,115,0.45)', letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>Community</span>
        </div>
      </div>

      {/* ── MAIN HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,12,14,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(212,163,115,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>

          {/* LEFT — Logo + title + members */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1200, #2e1f00)',
              border: '1.5px solid rgba(212,163,115,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
              boxShadow: '0 0 12px rgba(212,163,115,0.15)',
            }}>🌿</div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.98rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #d4a373 0%, #e9c46a 50%, #d4a373 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'nowrap',
              }}>WildSaura</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(212,163,115,0.5)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>Community</div>
            </div>

            <button
              onClick={() => setShowMembersModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(233,196,106,0.08)', border: '1px solid rgba(233,196,106,0.2)',
                borderRadius: 20, padding: '0.22rem 0.6rem',
                fontSize: '0.75rem', color: '#e9c46a', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(233,196,106,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(233,196,106,0.08)'; }}
            >
              <span style={{ fontSize: '0.8rem' }}>👥</span> {memberCount}
            </button>
          </div>

          {/* RIGHT — Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>

            {/* Login / Member / Join */}
            {user ? (
              isMember ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: 'rgba(76,205,196,0.1)', border: '1px solid rgba(76,205,196,0.25)',
                  color: '#4ECDC4', borderRadius: 20, padding: '0.3rem 0.65rem',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  <span style={{ fontSize: '0.7rem' }}>✅</span> Member
                </div>
              ) : (
                <button
                  onClick={joinCommunity}
                  disabled={joining}
                  style={{
                    background: 'linear-gradient(135deg, #d4a373, #e9c46a)',
                    color: '#0b0c0e', border: 'none', borderRadius: 20,
                    padding: '0.3rem 0.75rem', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 700, opacity: joining ? 0.7 : 1,
                    boxShadow: '0 2px 10px rgba(212,163,115,0.3)',
                  }}
                >{joining ? '...' : '🤝 Join'}</button>
              )
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #d4a373, #e9c46a)',
                  color: '#0b0c0e', border: 'none', borderRadius: 20,
                  padding: '0.3rem 0.75rem', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 700,
                  boxShadow: '0 2px 10px rgba(212,163,115,0.25)',
                }}>🔑 Login</button>
            )}

            {/* Post button */}
            <button
              onClick={() => requireLogin(() => { setEditingPost(null); setShowPostModal(true); })}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.3)',
                color: '#d4a373', borderRadius: 20, padding: '0.3rem 0.7rem',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,163,115,0.22)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,163,115,0.12)'; }}
            >
              <span>✏️</span> Post
            </button>

            {/* Profile avatar dropdown (logged in only) */}
            {user && (
              <ProfileMenu
                user={user}
                onLogout={logout}
                onEditProfile={() => setShowProfileEdit(true)}
                onShare={() => setShowShareModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: '1rem 1rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {!user && !authLoading && (
          <div style={{ background: 'rgba(212,163,115,0.07)', border: '1px solid rgba(212,163,115,0.2)', borderRadius: 16, padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ color: '#e9c46a', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>🌍 Welcome to WildSaura Community!</div>
            <div style={{ color: '#b0b5c0', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Browse posts freely — no login needed! 🎉<br />
              Join to post, like, comment, and connect with wildlife lovers.
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button style={{ background: 'linear-gradient(135deg, #d4a373, #e9c46a)', color: '#0b0c0e', fontWeight: 700, cursor: 'pointer', border: 'none', padding: '0.65rem 1.8rem', borderRadius: 30, fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(212,163,115,0.3)' }} onClick={() => setShowAuthModal(true)}>
                🔑 Login to Join
              </button>
              <button style={{ background: 'rgba(212,163,115,0.1)', border: '1px solid rgba(212,163,115,0.25)', color: '#d4a373', borderRadius: 30, padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowShareModal(true)}>
                📤 Share
              </button>
            </div>
          </div>
        )}

        {postsLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>✨ Loading posts...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>🌿 No posts yet. Be the first to share!</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={toggleLike}
              onComment={addComment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLoginClick={() => setShowAuthModal(true)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(30,33,40,0.8)', padding: '1.5rem', textAlign: 'center', color: '#4a4f58', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {NAV_SITES.map(site => (
            <a key={site.href} href={site.href} target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(212,163,115,0.4)', textDecoration: 'none', fontSize: '0.75rem', transition: 'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#d4a373'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(212,163,115,0.4)'; }}
            >{site.emoji} {site.label}</a>
          ))}
        </div>
        <div>🌿 WildSaura Community · Share the wild beauty of Nepal</div>
      </footer>

      {/* Modals */}
      {showPostModal && (
        <CreatePostModal
          onClose={() => { setShowPostModal(false); setEditingPost(null); }}
          onSubmit={handleCreatePost}
          editingPost={editingPost}
          submitting={submitting}
          uploadProgress={uploadProgress}
        />
      )}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} onCopy={handleCopyLink} communityUrl={COMMUNITY_URL} />}
      {showMembersModal && <MembersModal onClose={() => setShowMembersModal(false)} members={members} memberCount={memberCount} />}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onGoogle={async () => { try { await loginWithGoogle(); setShowAuthModal(false); } catch (e: any) { showToast(`❌ ${e.message}`); } }}
          onFacebook={async () => { try { await loginWithFacebook(); setShowAuthModal(false); } catch (e: any) { showToast(`❌ ${e.message}`); } }}
          onApple={async () => { try { await loginWithApple(); setShowAuthModal(false); } catch (e: any) { showToast(`❌ ${e.message}`); } }}
        />
      )}
      {showProfileEdit && user && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileEdit(false)}
          onSave={handleProfileSave}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
