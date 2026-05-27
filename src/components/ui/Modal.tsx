'use client';

import { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ onClose, children, maxWidth = 520 }: ModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#16181c',
          width: '90%',
          maxWidth,
          borderRadius: 24,
          padding: '2rem',
          border: '1px solid #2e323a',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideIn 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
