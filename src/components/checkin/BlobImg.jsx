import { useEffect, useState } from 'react';

/** 顯示 Blob 圖片：建立 object URL，換圖或卸載時釋放 */
export default function BlobImg({ blob, alt = '', ...rest }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? <img src={url} alt={alt} draggable="false" {...rest} /> : null;
}
