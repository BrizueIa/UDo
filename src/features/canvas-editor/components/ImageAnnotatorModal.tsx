import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SketchItem } from '../../../shared/types';
import { CanvasToolbar, CanvasTool } from './CanvasToolbar';
import { CanvasCropOverlay, CropRect } from './CanvasCropOverlay';

interface Props {
  sketch: SketchItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSketch: SketchItem) => void;
}

export const ImageAnnotatorModal: React.FC<Props> = ({
  sketch,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(sketch.title || '');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [showGrid, setShowGrid] = useState(!sketch.dataUrl);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const historyRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);

  const updateHistory = (newHistory: ImageData[]) => {
    historyRef.current = newHistory;
    setHistory(newHistory);
  };

  const updateRedoStack = (newRedo: ImageData[]) => {
    redoStackRef.current = newRedo;
    setRedoStack(newRedo);
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Interactive Crop State
  const [cropSelection, setCropSelection] = useState<CropRect | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ffffff'];

  useEffect(() => {
    setTitle(sketch.title || '');
  }, [sketch.title]);

  // Initialize canvas with sketch image or blank whiteboard
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sketch.dataUrl) {
      canvas.width = 900;
      canvas.height = 600;
      ctx.fillStyle = '#181825';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      updateHistory([initial]);
      updateRedoStack([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sketch.dataUrl;
    img.onload = () => {
      canvas.width = img.width || 800;
      canvas.height = img.height || 600;
      ctx.drawImage(img, 0, 0);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      updateHistory([initial]);
      updateRedoStack([]);
    };
  }, [sketch, isOpen]);

  const handleUndo = useCallback(() => {
    const h = historyRef.current;
    if (h.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const current = h[h.length - 1];
    const newHistory = h.slice(0, -1);
    const prevState = newHistory[newHistory.length - 1];

    updateRedoStack([current, ...redoStackRef.current]);
    updateHistory(newHistory);
    ctx.putImageData(prevState, 0, 0);
  }, []);

  const handleRedo = useCallback(() => {
    const r = redoStackRef.current;
    if (r.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const nextState = r[0];
    const newRedoStack = r.slice(1);

    updateRedoStack(newRedoStack);
    updateHistory([...historyRef.current, nextState]);
    ctx.putImageData(nextState, 0, 0);
  }, []);

  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus modal on open so keyboard shortcuts work immediately
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => modalContainerRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const isCtrl = e.ctrlKey || e.metaKey;
      const isZ = e.code === 'KeyZ' || e.key.toLowerCase() === 'z';
      const isY = e.code === 'KeyY' || e.key.toLowerCase() === 'y';

      if (!isInput && isCtrl && !e.shiftKey && isZ) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
      } else if (!isInput && ((isCtrl && isY) || (isCtrl && e.shiftKey && isZ))) {
        e.preventDefault();
        e.stopPropagation();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (cropSelection) {
          setCropSelection(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleUndo, handleRedo, cropSelection, onClose]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setStartPos({ x, y });

    if (activeTool === 'crop') {
      setIsCropping(true);
      setCropSelection(null);
      return;
    }

    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (isCropping && startPos) {
      setCropSelection({
        x: Math.max(0, Math.min(startPos.x, x)),
        y: Math.max(0, Math.min(startPos.y, y)),
        w: Math.abs(x - startPos.x),
        h: Math.abs(y - startPos.y),
      });
      return;
    }

    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = `${selectedColor}55`;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.save();
      ctx.strokeStyle = '#181825';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCropping) {
      setIsCropping(false);
      if (cropSelection && (cropSelection.w < 15 || cropSelection.h < 15)) {
        setCropSelection(null);
      }
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: endX, y: endY } = getCanvasCoords(e);

    if (activeTool === 'rectangle') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
    } else if (activeTool === 'arrow') {
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const headlen = 12;
      const angle = Math.atan2(endY - startPos.y, endX - startPos.x);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    updateHistory([...historyRef.current, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    updateRedoStack([]);
  };

  const handleApplyCrop = () => {
    if (!cropSelection || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, w, h } = cropSelection;
    if (w < 10 || h < 10) return;

    const cropped = ctx.getImageData(x, y, w, h);
    canvas.width = w;
    canvas.height = h;
    ctx.putImageData(cropped, 0, 0);

    updateHistory([...historyRef.current, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    updateRedoStack([]);
    setCropSelection(null);
    setActiveTool('pen');
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    const safeTitle = (title.trim() || 'whiteboard-drawing').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    a.download = `${safeTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const finalSketch: SketchItem = {
      ...sketch,
      title: title.trim() || sketch.title,
      dataUrl,
    };
    onClose();
    setTimeout(() => onSave(finalSketch), 0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.min(3, Math.max(0.3, Number((z + zoomDelta).toFixed(2)))));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col select-none outline-none animate-in fade-in duration-150"
    >
      <CanvasToolbar
        title={title}
        onTitleChange={setTitle}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(2))))}
        onZoomOut={() => setZoom((z) => Math.max(0.3, Number((z - 0.2).toFixed(2))))}
        onRotate={() => setRotation((r) => (r + 90) % 360)}
        activeTool={activeTool}
        onSelectTool={(tool) => {
          setActiveTool(tool);
          if (tool !== 'crop') setCropSelection(null);
        }}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        colors={colors}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        canUndo={history.length > 1}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportPng={handleExportPng}
        onSave={handleSave}
        onClose={onClose}
      />

      {/* Canvas Viewport */}
      <div
        onWheel={handleWheel}
        className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
        style={
          showGrid
            ? {
                backgroundSize: '24px 24px',
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px)',
              }
            : undefined
        }
      >
        <div
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
          }}
          className="relative shadow-2xl rounded-lg overflow-hidden border border-theme-border/50"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`bg-[#181825] ${
              activeTool === 'crop' ? 'cursor-crosshair' : activeTool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
            }`}
          />
          <CanvasCropOverlay
            cropSelection={cropSelection}
            isCropping={isCropping}
            onApplyCrop={handleApplyCrop}
            onCancelCrop={() => setCropSelection(null)}
          />
        </div>
      </div>
    </div>
  );
};
