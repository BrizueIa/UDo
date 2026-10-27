import React from 'react';

export const TrafficLights: React.FC = () => {
  const handleClose = async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().hide(); // Minimize to tray on close!
    }
  };

  const handleMinimize = async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    }
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-2 select-none group">
      <button
        onClick={handleClose}
        aria-label="Close"
        className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-90 transition-all flex items-center justify-center text-[8px] text-black/60 opacity-90 group-hover:opacity-100"
      />
      <button
        onClick={handleMinimize}
        aria-label="Minimize"
        className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-90 transition-all flex items-center justify-center text-[8px] text-black/60 opacity-90 group-hover:opacity-100"
      />
      <button
        onClick={handleMaximize}
        aria-label="Maximize"
        className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-90 transition-all flex items-center justify-center text-[8px] text-black/60 opacity-90 group-hover:opacity-100"
      />
    </div>
  );
};
