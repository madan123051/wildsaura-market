'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/utils';
import type { Post, CurrentUser, CommentItem } from '@/types/community';
import { POST_CATEGORIES } from '@/types/community';

interface PostCardProps {
  post: Post;
  currentUser: CurrentUser | null;
  onLike: (postId: string, likes: string[]) => void;
  onComment: (postId: string, text: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onLoginClick: () => void;
}

export function PostCard({ post, currentUser, onLike, onComment, onEdit, onDelete, onLoginClick }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showStory, setShowStory] = useState(false);

  const uid = currentUser?.uid;
  const liked = uid ? post.likes?.includes(uid) : false;
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;
  const isOwner = uid && post.userId === uid;
  const catLabel = POST_CATEGORIES.find(c => c.value === post.category)?.label;

  const handleLike = () => {
    if (!currentUser) { onLoginClick(); return; }
    onLike(post.id, post.likes || []);
  };

  const handleComment = () => {
    if (!currentUser) { onLoginClick(); return; }
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <div style={{ background: '#16181c', borderRadius: 18, padding: '1.2rem', border: '1px solid #262a31', position: 'relative' }}>
      {/* Three-dot menu */}
      {isOwner && (
        <>
          <button
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#8a8f98', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: 8 }}
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >⋮</button>
          {showMenu && (
            <div style={{ position: 'absolute', top: '2.5rem', right: '1rem', background: '#1f2126', border: '1px solid #2e323a', borderRadius: 12, padding: '0.3rem 0', zIndex: 50, minWidth: 120, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
              <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#e4e4e7', padding: '0.6rem 1rem', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => { setShowMenu(false); onEdit(post); }}>✏️ Edit Post</button>
              <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#e76f51', padding: '0.6rem 1rem', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => { setShowMenu(false); onDelete(post.id); }}>🗑️ Delete Post</button>
            </div>
          )}
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
        <Avatar displayName={post.username || 'Anonymous'} avatarUrl={post.avatarUrl} avatarColor={post.avatarColor} size={42} showBorder />
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#e4e4e7' }}>
            {post.username || 'Anonymous'}
            {catLabel && <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(212,163,115,0.15)', color: '#d4a373', padding: '0.15rem 0.5rem', borderRadius: 10, marginLeft: '0.4rem' }}>{catLabel}</span>}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a8f98' }}>{timeAgo(post.timestamp)}</div>
        </div>
      </div>

      {/* Text */}
      {post.text && <div style={{ margin: '0.5rem 0 0.8rem', fontSize: '1rem', lineHeight: 1.6, color: '#d1d5db', whiteSpace: 'pre-wrap' }}>{post.text}</div>}

      {/* Story */}
      {post.story && (
        <div style={{ background: 'rgba(233,196,106,0.06)', border: '1px solid rgba(233,196,106,0.15)', borderRadius: 12, padding: '0.7rem 1rem', marginBottom: '0.8rem' }}>
          <button style={{ background: 'none', border: 'none', color: '#e9c46a', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowStory(!showStory)}>
            📖 Story behind this photo {showStory ? '▲' : '▼'}
          </button>
          {showStory && <div style={{ color: '#b0b5c0', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.4rem', whiteSpace: 'pre-wrap' }}>{post.story}</div>}
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post" style={{ width: '100%', borderRadius: 14, marginBottom: '1rem', maxHeight: 500, objectFit: 'cover' }} loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', paddingTop: '0.8rem', borderTop: '1px solid #252830' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: liked ? '#e76f51' : '#a1a5b0', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }} onClick={handleLike}>
          <span>{liked ? '❤️' : '🤍'}</span> <span>{likeCount}</span>
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#a1a5b0', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }} onClick={() => setShowComments(!showComments)}>
          💬 <span>{commentCount}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, maxHeight: 200, overflowY: 'auto', marginBottom: '0.8rem' }}>
            {(post.comments || []).length === 0 && (
              <li style={{ padding: '0.5rem 0', color: '#555', fontSize: '0.9rem' }}>No comments yet.</li>
            )}
            {(post.comments || []).map((c: CommentItem, i: number) => (
              <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #23262e', fontSize: '0.9rem', color: '#d1d5db', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Avatar displayName={c.username || 'User'} avatarUrl={c.avatarUrl} avatarColor={c.avatarColor} size={28} />
                <div>
                  <span style={{ fontWeight: 600, color: '#d4a373', marginRight: 6 }}>{c.username}</span>
                  {c.text}
                </div>
              </li>
            ))}
          </ul>
          {currentUser ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Avatar displayName={currentUser.displayName} avatarUrl={currentUser.avatarUrl} avatarColor={currentUser.avatarColor} size={28} />
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComment(); }}
                style={{ flex: 1, background: '#1f2126', border: '1px solid #2e323a', borderRadius: 20, padding: '0.6rem 1rem', color: '#e4e4e7', outline: 'none', fontSize: '0.9rem' }}
              />
              <button style={{ background: '#d4a373', color: '#0b0c0e', border: 'none', borderRadius: 20, padding: '0.5rem 1.2rem', fontWeight: 700, cursor: 'pointer' }} onClick={handleComment}>Post</button>
            </div>
          ) : (
            <button style={{ color: '#d4a373', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem', background: 'none', border: 'none' }} onClick={onLoginClick}>🔑 Login to comment</button>
          )}
        </div>
      )}
    </div>
  );
}
