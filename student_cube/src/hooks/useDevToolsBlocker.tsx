import { useEffect } from 'react';

const useDevToolsBlocker = () => {
  useEffect(() => {

    // 1. Right-Click Block karna
    const handleContextMenu = (e: MouseEvent) => { 
    e.preventDefault();
};

    // 2. Keyboard Shortcuts (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
    // Block F12
    if (e.key === 'F12') {
        e.preventDefault();
      }
      
      // Block Ctrl + Shift + I (Inspect) / J (Console) / C (Element Select)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
      }

      // Block Ctrl + U (View Source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    // Listeners ko Window par attach karo
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function (Jab component unmount ho)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};

export default useDevToolsBlocker;