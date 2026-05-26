'use client';

import { useEffect } from 'react';

interface CommunityModalProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ onClose, children, maxWidth = 540 }: CommunityModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#0f1114',
          border: '1px solid rgba(212,163,115,0.2)',
          borderRadius: 20,
          padding: '2rem',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
