import React, { useEffect, useState } from 'react';

export default function QRDisplay({ value, size = 180 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: { dark: '#FF00FF', light: '#0D0D0D' },
      }).then(setDataUrl);
    });
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div style={{
        width: size,
        height: size,
        background: '#1A1A1A',
        borderRadius: 12,
        border: '2px solid #FF00FF33',
      }} />
    );
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      style={{ borderRadius: 12, display: 'block' }}
      alt={`QR code for squad ${value}`}
    />
  );
}
