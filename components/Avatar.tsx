import React, { useState } from 'react';

interface AvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  shape?: 'circle' | 'rounded';
}

const PALETTE = [
  '#d4af37',
  '#0f172a',
  '#7c3aed',
  '#0ea5e9',
  '#10b981',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#a855f7',
];

const colorFor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
};

const initialFor = (displayName?: string | null, email?: string | null): string => {
  const source = (displayName && displayName.trim()) || (email && email.trim()) || '?';
  const firstWord = source.split(/[\s@.]+/).filter(Boolean)[0] || '?';
  return firstWord.charAt(0).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  photoURL,
  displayName,
  email,
  size = 40,
  className = '',
  shape = 'circle',
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(photoURL && !imageFailed);
  const seed = (displayName || email || 'mirrorly').toLowerCase();
  const bg = colorFor(seed);
  const initial = initialFor(displayName, email);
  const fontSize = Math.round(size * 0.42);
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  if (showImage) {
    return (
      <img
        src={photoURL as string}
        alt={displayName || email || 'Avatar'}
        onError={() => setImageFailed(true)}
        style={{ width: size, height: size }}
        className={`${radius} object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: bg, fontSize }}
      className={`${radius} flex items-center justify-center text-white font-medium select-none ${className}`}
      aria-label={displayName || email || 'Avatar'}
    >
      {initial}
    </div>
  );
};

export default Avatar;
