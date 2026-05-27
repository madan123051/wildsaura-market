'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { POST_CATEGORIES } from '@/types/community';
import type { Post } from '@/types/community';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (text: string, category: string, story: string, imageFile: File | null) => Promise<void>;
  editingPost?: Post | null;
  submitting: boolean;
  uploadProgress: string;
}

export function CreatePostModal({ onClose, onSubmit, editingPost, submitting, uploadProgress }: CreatePostModalProps) {
  const [text, setText] = useState(editingPost?.text || '');
  const [category, setCategory] = useState(editingPost?.category || '');
  const [story, setStory] = useState(editingPost?.story || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editingPost?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1f2126',
    border: '1px solid #2e323a',
    borderRadius: 14,
    padding: '0.8rem',
    color: '#e4e4e7',
    fontFamily: 'inherit',
    fontSize: '1rem',
    marginBottom: '1.2rem',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 500,
    color: '#b0b5c0',
    fontSize: '0.9rem',
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image too large! Max 10MB.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    onSubmit(text, category, story, imageFile);
  };

  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700, color: '#d4a373', fontSize: '1.3rem' }}>
        {editingPost ? '✏️ Edit Post' : '🌿 Create Post'}
      </h2>

      <label style={labelStyle}>Caption / Text</label>
      <textarea
        rows={3}
        placeholder="Write something about wildlife..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
      >
        {POST_CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <label style={labelStyle}>📖 Story Behind the Photo (optional)</label>
      <textarea
        rows={3}
        placeholder="Share the story — where was this? What happened?"
        value={story}
        onChange={(e) => setStory(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Photo</label>
      {imagePreview ? (
        <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
          <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover' }} />
          <button
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
          >✕</button>
        </div>
      ) : (
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1f2126', border: '1px dashed #3a3f4a', borderRadius: 14, padding: '0.8rem 1.2rem', color: '#a1a5b0', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.2rem', width: '100%', justifyContent: 'center' }}
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Choose Photo
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*,image/heic,image/heif,.heic,.heif" style={{ display: 'none' }} onChange={handleImageChange} />

      {uploadProgress && (
        <div style={{ background: 'rgba(76,205,196,0.12)', border: '1px solid rgba(76,205,196,0.3)', borderRadius: 10, padding: '0.5rem 1rem', color: '#4ECDC4', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
          {uploadProgress}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          style={{ background: '#1f2126', border: 'none', color: '#e4e4e7', padding: '0.6rem 1.4rem', borderRadius: 30, fontWeight: 600, cursor: 'pointer' }}
          onClick={onClose}
        >Cancel</button>
        <button
          style={{ background: '#d4a373', color: '#0b0c0e', border: 'none', padding: '0.6rem 1.6rem', borderRadius: 30, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Posting...' : (editingPost ? 'Save ✏️' : 'Post 🌿')}
        </button>
      </div>
    </Modal>
  );
}
