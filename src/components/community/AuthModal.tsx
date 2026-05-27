'use client';

import { Modal } from '@/components/ui/Modal';

interface AuthModalProps {
  onClose: () => void;
  onGoogle: () => void;
  onFacebook: () => void;
  onApple: () => void;
}

export function AuthModal({ onClose, onGoogle, onFacebook, onApple }: AuthModalProps) {
  const btnStyle = (bg: string, color: string, border?: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    width: '100%',
    padding: '0.8rem 1.2rem',
    borderRadius: 14,
    border: border || 'none',
    background: bg,
    color,
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '0.75rem',
    transition: 'opacity 0.2s',
  });

  return (
    <Modal onClose={onClose} maxWidth={380}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
        <h2 style={{ color: '#d4a373', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.3rem' }}>
          Join WildSaura Community
        </h2>
        <p style={{ color: '#8a8f98', fontSize: '0.9rem' }}>
          Sign in to post, like, and connect with wildlife lovers worldwide.
        </p>
      </div>

      <button style={btnStyle('#fff', '#222')} onClick={onGoogle}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="Google" />
        Continue with Google
      </button>

      <button style={btnStyle('#1877F2', '#fff')} onClick={onFacebook}>
        <span style={{ fontSize: '1.1rem' }}>f</span>
        Continue with Facebook
      </button>

      <button style={btnStyle('#000', '#fff', '1px solid #333')} onClick={onApple}>
        <span style={{ fontSize: '1.2rem' }}></span>
        Continue with Apple
      </button>

      <button
        style={{ width: '100%', background: 'none', border: 'none', color: '#8a8f98', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}
        onClick={onClose}
      >
        Maybe later — browse as guest
      </button>
    </Modal>
  );
}
