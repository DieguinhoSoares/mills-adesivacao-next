import { useEffect, useState } from 'react';
import { urlAmpliada } from '../utils/cloudinaryUrl';

export function Lightbox({ src, alt, onClose }) {
  const [original, setOriginal] = useState(false);

  // Reseta para a versão otimizada sempre que abre uma foto nova.
  useEffect(() => { setOriginal(false); }, [src]);

  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        zIndex: 1000,
        padding: '2rem',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={original ? src : urlAmpliada(src)}
        alt={alt}
        style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius)' }}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setOriginal((v) => !v); }}
        style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.3)' }}
      >
        {original ? 'Ver versão otimizada' : 'Ver original'}
      </button>
    </div>
  );
}
