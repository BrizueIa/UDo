import React, { useState, useRef, useEffect } from 'react';
import { SketchItem } from '../../../shared/types';
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Pen,
  Highlighter,
  ArrowRight,
  Square,
  Undo2,
  Save,
} from 'lucide-react';

interface Props {
  sketch: SketchItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSketch: SketchItem) => void;
}

type Tool = 'pen' | 'highlighter' | 'arrow' | 'rectangle';

export const ImageAnnotatorModal: React.FC<Props> = ({
  sketch,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [selectedColor, setSelectedColor] = useState('#ef4444'); // Default red
  const [history, setHistory] = useState<ImageData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'];

  // Initialize canvas with sketch image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sketch.dataUrl;
    img.onload = () => {
      canvas.width = img.width || 600;
      canvas.height = img.height || 450;
      ctx.drawImage(img, 0, 0);
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    };
  }, [sketch]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (activeTool === 'pen') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = `${selectedColor}66`; // 40% alpha
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / zoom;
    const endY = (e.clientY - rect.top) / zoom;

    if (activeTool === 'rectangle') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
    } else if (activeTool === 'arrow') {
      // Draw arrow line
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw arrowhead
      const headlen = 12;
      const angle = Math.atan2(endY - startPos.y, endX - startPos.x);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headlen * Math.cos(angle - Math.PI / 6),
        endY - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - headlen * Math.cos(angle + Math.PI / 6),
        endY - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Save snapshot to history
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave({
      ...sketch,
      dataUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150">
      {/* Top Toolbar */}
      <div className="h-14 bg-theme-sidebar border-b border-theme-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-theme-text">{sketch.title}</span>
        </div>

        {/* Tools center ribbon */}
        <div className="flex items-center space-x-1.5 bg-theme-card/80 p-1 rounded-xl border border-theme-border">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono text-theme-muted px-1.5">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-[1px] h-4 bg-theme-border mx-1" />

          {/* Rotate */}
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
            title="Rotate 90°"
          >
            <RotateCw size={16} />
          </button>

          <div className="w-[1px] h-4 bg-theme-border mx-1" />

          {/* Pen */}
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'pen'
                ? 'bg-theme-accent text-white'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title="Freehand Pen"
          >
            <Pen size={16} />
          </button>

          {/* Highlighter */}
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'highlighter'
                ? 'bg-theme-accent text-white'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title="Highlighter"
          >
            <Highlighter size={16} />
          </button>

          {/* Arrow */}
          <button
            onClick={() => setActiveTool('arrow')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'arrow'
                ? 'bg-theme-accent text-white'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title="Callout Arrow"
          >
            <ArrowRight size={16} />
          </button>

          {/* Rectangle */}
          <button
            onClick={() => setActiveTool('rectangle')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'rectangle'
                ? 'bg-theme-accent text-white'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
            }`}
            title="Bounding Box"
          >
            <Square size={16} />
          </button>

          <div className="w-[1px] h-4 bg-theme-border mx-1" />

          {/* Color palette */}
          <div className="flex items-center space-x-1 px-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-[1px] h-4 bg-theme-border mx-1" />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover disabled:opacity-40"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
        </div>

        {/* Right actions: Save & Close */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Save size={14} />
            <span>Save Annotations</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <div
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="shadow-2xl rounded-lg overflow-hidden border border-theme-border/50"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="cursor-crosshair bg-neutral-900"
          />
        </div>
      </div>
    </div>
  );
};
