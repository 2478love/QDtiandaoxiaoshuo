import { useState, useEffect } from 'react';

export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 切换专注模式
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
      }
      // ESC 退出专注模式
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);
  
  // 进入专注模式时隐藏滚动条
  useEffect(() => {
    if (isFocusMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFocusMode]);
  
  return { isFocusMode, setIsFocusMode };
}
