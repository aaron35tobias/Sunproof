import { useState, type ImgHTMLAttributes } from 'react';

export function Image({ className = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`${className} grid place-items-center border border-zinc-700 text-xs text-zinc-500`}>Image unavailable</div>;
  return <img {...props} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)}/>;
}
