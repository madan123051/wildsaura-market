'use client';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1a1a',
        color: '#4ECDC4',
        border: '1px solid rgba(76,205,196,0.4)',
        borderRadius: 10,
        padding: '0.7rem 1.4rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}
