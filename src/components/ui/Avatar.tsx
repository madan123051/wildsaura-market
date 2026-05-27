'use client';

interface AvatarProps {
  displayName: string;
  avatarUrl?: string;
  size?: number;
  showBorder?: boolean;
  avatarColor?: string;
}

export function Avatar({ displayName, avatarUrl, size = 40, showBorder = false, avatarColor = '#4ECDC4' }: AvatarProps) {
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const borderStyle = showBorder
    ? `2px solid ${avatarColor}`
    : '2px solid transparent';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: borderStyle,
          flexShrink: 0,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${avatarColor}33, ${avatarColor}66)`,
        border: borderStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: avatarColor,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
