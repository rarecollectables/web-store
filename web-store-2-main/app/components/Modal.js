import React, { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, children, showClose = true, autoCloseMs, animation = 'fade', style = {} }) {
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    if (autoCloseMs) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseMs, onClose]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && open) {
        onClose && onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`modal-overlay ${animation}`} style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.32)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', ...style.overlay }}>
      <div ref={modalRef} className={`modal-content ${animation}`} style={{ background:'#fff', borderRadius:18, boxShadow:'0 4px 24px rgba(44,62,80,0.14)', minWidth:320, maxWidth:420, width:'90%', padding:32, position:'relative', animation: animation==='slide'?'modal-slide-in 0.4s cubic-bezier(.4,0,.2,1)':'modal-fade-in 0.3s', ...style.content }}>
        {showClose && <button aria-label="Close" onClick={onClose} style={{ position:'absolute', top:18, right:18, background:'none', border:'none', fontSize:24, color:'#BFA054', cursor:'pointer' }}>&times;</button>}
        {children}
      </div>
      <style>{`
        .modal-fade-in { opacity:0; animation: modal-fade-in 0.32s forwards; }
        @keyframes modal-fade-in { from{opacity:0; transform:scale(0.96);} to{opacity:1; transform:scale(1);} }
        .modal-slide-in { opacity:0; animation: modal-slide-in 0.4s forwards; }
        @keyframes modal-slide-in { from{opacity:0; transform:translateY(80px) scale(0.98);} to{opacity:1; transform:translateY(0) scale(1);} }
      `}</style>
    </div>
  );
}
