'use client';

import { Modal } from '@/components/ui/Modal';

interface ShareModalProps {
  onClose: () => void;
  onCopy: () => void;
  communityUrl: string;
}

export function ShareModal({ onClose, onCopy, communityUrl }: ShareModalProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(communityUrl)}&bgcolor=16181c&color=d4a373&format=png`;

  const openShare = (url: string) => window.open(url, '_blank');

  const whatsapp = () => openShare(`https://wa.me/?text=${encodeURIComponent(`🌿 Join WildSaura Community! 📸\n${communityUrl}`)}`);
  const twitter = () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent('🌿 Join WildSaura Community! Wildlife & nature photography lovers unite 📸🐯')}&url=${encodeURIComponent(communityUrl)}`);
  const facebook = () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(communityUrl)}`);

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'WildSaura Community 🌿', text: 'Join WildSaura Community!', url: communityUrl }); } catch {}
    }
  };

  const optionStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: '#1f2126', border: '1px solid #2e323a', borderRadius: 14,
    padding: '0.8rem 1rem', cursor: 'pointer', color: '#e4e4e7',
    fontSize: '0.9rem', fontWeight: 500, transition: 'border-color 0.2s',
  };

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem', fontWeight: 700, color: '#d4a373', fontSize: '1.3rem' }}>📤 Share Community</h2>
        <p style={{ color: '#8a8f98', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Invite friends to join WildSaura Community!</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src={qrUrl} alt="QR Code" width={160} height={160} style={{ borderRadius: 12, border: '2px solid #2e323a' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <button style={optionStyle} onClick={onCopy}><span style={{ fontSize: '1.3rem' }}>🔗</span> Copy Link</button>
          <button style={optionStyle} onClick={whatsapp}><span style={{ fontSize: '1.3rem' }}>💬</span> WhatsApp</button>
          <button style={optionStyle} onClick={twitter}><span style={{ fontSize: '1.3rem' }}>🐦</span> Twitter / X</button>
          <button style={optionStyle} onClick={facebook}><span style={{ fontSize: '1.3rem' }}>📘</span> Facebook</button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button style={{ ...optionStyle, justifyContent: 'center', width: '100%', marginBottom: '1rem' }} onClick={nativeShare}>
            <span style={{ fontSize: '1.3rem' }}>📱</span> More Options...
          </button>
        )}

        <div style={{ background: '#1f2126', border: '1px solid #2e323a', borderRadius: 12, padding: '0.7rem 1rem', color: '#8a8f98', fontSize: '0.8rem', marginBottom: '1.2rem', wordBreak: 'break-all', textAlign: 'left' }}>
          🔗 {communityUrl}
        </div>

        <button style={{ background: '#1f2126', border: 'none', color: '#e4e4e7', padding: '0.6rem 1.4rem', borderRadius: 30, fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
