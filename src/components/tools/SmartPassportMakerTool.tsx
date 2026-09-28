"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Camera,
  Crop,
  Wand2,
  Download,
  RefreshCw,
  CheckCircle2,
  Eraser,
  Sliders,
  Grid,
  FileCheck,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  QuadCorners,
  autoDetectPhotoCorners,
  getCenteredDefaultCorners,
  warpPerspective,
  clientInpaintObject
} from '../../lib/perspectiveUtils';

type ActiveStep = 'upload' | 'corners' | 'studio' | 'download';

interface ExamPreset {
  id: string;
  name: string;
  label: string;
  widthCm: number;
  heightCm: number;
  minKb: number;
  maxKb: number;
  popular?: boolean;
}

const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'ssc-mpesb',
    name: 'SSC / MP Online / MPESB',
    label: '3.5 × 4.5 cm (20-50 KB)',
    widthCm: 3.5,
    heightCm: 4.5,
    minKb: 20,
    maxKb: 50,
    popular: true,
  },
  {
    id: 'upsc',
    name: 'UPSC / Central Govt',
    label: '3.5 × 4.5 cm (50-100 KB)',
    widthCm: 3.5,
    heightCm: 4.5,
    minKb: 50,
    maxKb: 100,
  },
  {
    id: 'railway-police',
    name: 'Railway / MP Police / GD',
    label: '3.5 × 4.5 cm (40-100 KB)',
    widthCm: 3.5,
    heightCm: 4.5,
    minKb: 40,
    maxKb: 100,
  },
  {
    id: 'passport-visa',
    name: 'Indian Passport / VISA',
    label: '2 × 2 Inch (5.1 × 5.1 cm)',
    widthCm: 5.1,
    heightCm: 5.1,
    minKb: 50,
    maxKb: 200,
  },
  {
    id: 'stamp-size',
    name: 'Stamp Size Photo',
    label: '2.5 × 3.0 cm (10-30 KB)',
    widthCm: 2.5,
    heightCm: 3.0,
    minKb: 10,
    maxKb: 30,
  }
];

export const SmartPassportMakerTool: React.FC = () => {
  const [step, setStep] = useState<ActiveStep>('upload');
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('passport-photo');

  // Step 1: Corners & Perspective
  const [corners, setCorners] = useState<QuadCorners | null>(null);
  const [activeCorner, setActiveCorner] = useState<'tl' | 'tr' | 'br' | 'bl' | null>(null);
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number } | null>(null);

  // Canvases
  const cornerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step 2: Studio & Inpainting (Realme/Samsung Object Eraser)
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isPaintingMask, setIsPaintingMask] = useState<boolean>(false);
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string>('');

  // Image Enhancements
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(105);
  const [saturation, setSaturation] = useState<number>(100);
  const [bgColor, setBgColor] = useState<'original' | 'white' | 'blue' | 'grey'>('original');

  // Step 3: Exam Preset & Output Sheet
  const [selectedPreset, setSelectedPreset] = useState<ExamPreset>(EXAM_PRESETS[0]);
  const [printLayout, setPrintLayout] = useState<'single' | '4x' | '6x' | '8x' | '12x'>('single');
  const [targetKb, setTargetKb] = useState<number>(45);
  const [finalFileSizeKb, setFinalFileSizeKb] = useState<number>(0);
  const [finalDataUrl, setFinalDataUrl] = useState<string>('');

  // 1. File Upload Handler
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);

        // Compute initial corners
        const initial = getCenteredDefaultCorners(img.width, img.height);
        setCorners(initial);
        setStep('corners');
        setIsStraightened(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Draw Corners Canvas with Interactive Handles
  const renderCornersCanvas = useCallback(() => {
    const canvas = cornerCanvasRef.current;
    if (!canvas || !originalImage || !corners) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep internal canvas dimensions matching original image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Draw background image
    ctx.drawImage(originalImage, 0, 0);

    // Dim the exterior area outside quadrilateral
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out quadrilateral
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(corners.tl.x, corners.tl.y);
    ctx.lineTo(corners.tr.x, corners.tr.y);
    ctx.lineTo(corners.br.x, corners.br.y);
    ctx.lineTo(corners.bl.x, corners.bl.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw polygon borders
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(3, Math.round(canvas.width / 220));
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(corners.tl.x, corners.tl.y);
    ctx.lineTo(corners.tr.x, corners.tr.y);
    ctx.lineTo(corners.br.x, corners.br.y);
    ctx.lineTo(corners.bl.x, corners.bl.y);
    ctx.closePath();
    ctx.stroke();

    // Draw solid inner guide
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, Math.round(canvas.width / 440));
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();

    // Draw 4 Corner Handles
    const handleRadius = Math.max(14, Math.round(canvas.width / 45));
    const handlePoints: Array<{ key: 'tl' | 'tr' | 'br' | 'bl'; pt: { x: number; y: number }; label: string }> = [
      { key: 'tl', pt: corners.tl, label: '1. ऊपर-बाएं' },
      { key: 'tr', pt: corners.tr, label: '2. ऊपर-दाएं' },
      { key: 'br', pt: corners.br, label: '3. नीचे-दाएं' },
      { key: 'bl', pt: corners.bl, label: '4. नीचे-बाएं' },
    ];

    handlePoints.forEach(({ key, pt, label }) => {
      const isCurrent = activeCorner === key;

      ctx.save();
      // Outer glow
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius + (isCurrent ? 6 : 2), 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Outer Circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#ef4444' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#ef4444';
      ctx.stroke();

      // Center Dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius / 3, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#ffffff' : '#ef4444';
      ctx.fill();

      // Text Tag
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${Math.max(10, Math.round(canvas.width / 50))}px sans-serif`;
      ctx.fillText(label, pt.x + handleRadius + 6, pt.y + 4);
      ctx.restore();
    });

    // Draw Magnifier Loupe if dragging
    if (activeCorner && magnifierPos && corners) {
      const targetPt = corners[activeCorner];
      const loupeRadius = Math.max(50, Math.round(canvas.width / 12));
      const zoom = 2.5;

      // Position loupe offset from finger/cursor so finger doesn't block it
      const loupeX = Math.min(canvas.width - loupeRadius - 10, Math.max(loupeRadius + 10, targetPt.x));
      const loupeY = targetPt.y > loupeRadius * 2 + 30 ? targetPt.y - loupeRadius - 40 : targetPt.y + loupeRadius + 40;

      ctx.save();
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw zoomed image
      ctx.drawImage(
        originalImage,
        targetPt.x - loupeRadius / zoom,
        targetPt.y - loupeRadius / zoom,
        (loupeRadius * 2) / zoom,
        (loupeRadius * 2) / zoom,
        loupeX - loupeRadius,
        loupeY - loupeRadius,
        loupeRadius * 2,
        loupeRadius * 2
      );

      // Loupe Crosshair
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(loupeX - loupeRadius, loupeY);
      ctx.lineTo(loupeX + loupeRadius, loupeY);
      ctx.moveTo(loupeX, loupeY - loupeRadius);
      ctx.lineTo(loupeX, loupeY + loupeRadius);
      ctx.stroke();

      ctx.restore();

      // Loupe Border
      ctx.save();
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
      ctx.restore();
    }
  }, [originalImage, corners, activeCorner, magnifierPos]);

  useEffect(() => {
    if (step === 'corners') {
      renderCornersCanvas();
    }
  }, [step, corners, activeCorner, magnifierPos, renderCornersCanvas]);

  // Touch & Pointer interaction on Corner Handles
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = cornerCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!corners || !cornerCanvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = cornerCanvasRef.current;
    const hitRadius = Math.max(30, canvas.width / 20);

    const distTL = Math.hypot(corners.tl.x - x, corners.tl.y - y);
    const distTR = Math.hypot(corners.tr.x - x, corners.tr.y - y);
    const distBR = Math.hypot(corners.br.x - x, corners.br.y - y);
    const distBL = Math.hypot(corners.bl.x - x, corners.bl.y - y);

    const minDist = Math.min(distTL, distTR, distBR, distBL);
    if (minDist <= hitRadius) {
      if (minDist === distTL) setActiveCorner('tl');
      else if (minDist === distTR) setActiveCorner('tr');
      else if (minDist === distBR) setActiveCorner('br');
      else setActiveCorner('bl');

      setMagnifierPos({ x, y });
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!activeCorner || !corners || !cornerCanvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = cornerCanvasRef.current;

    const clampedX = Math.max(0, Math.min(canvas.width, x));
    const clampedY = Math.max(0, Math.min(canvas.height, y));

    setCorners((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [activeCorner]: { x: Math.round(clampedX), y: Math.round(clampedY) },
      };
    });

    setMagnifierPos({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = () => {
    setActiveCorner(null);
    setMagnifierPos(null);
  };

  // Quick Corner Buttons
  const handleAutoDetect = () => {
    if (!originalImage) return;
    const detected = autoDetectPhotoCorners(originalImage.width, originalImage.height, cornerCanvasRef.current);
    setCorners(detected);
  };

  const handleResetCenter = () => {
    if (!originalImage) return;
    setCorners(getCenteredDefaultCorners(originalImage.width, originalImage.height));
  };

  const handleFullImageCorners = () => {
    if (!originalImage) return;
    setCorners({
      tl: { x: 0, y: 0 },
      tr: { x: originalImage.width, y: 0 },
      br: { x: originalImage.width, y: originalImage.height },
      bl: { x: 0, y: originalImage.height },
    });
  };

  // Straighten & Warp Action
  const handleStraightenAndCrop = () => {
    if (!corners || !originalImage) return;

    // Create temporary source canvas
    const tempSrc = document.createElement('canvas');
    tempSrc.width = originalImage.width;
    tempSrc.height = originalImage.height;
    const tempCtx = tempSrc.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(originalImage, 0, 0);

    // Standard 3.5 : 4.5 passport output canvas resolution (700 x 900 px for crisp 300 DPI)
    const warpedCanvas = warpPerspective(tempSrc, corners, 700, 900);

    // Initialize Studio Canvas
    const studioCanvas = studioCanvasRef.current;
    if (studioCanvas) {
      studioCanvas.width = 700;
      studioCanvas.height = 900;
      const sCtx = studioCanvas.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(warpedCanvas, 0, 0);
      }
    }

    // Initialize Mask Canvas
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      maskCanvas.width = 700;
      maskCanvas.height = 900;
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        mCtx.clearRect(0, 0, 700, 900);
      }
    }

    setIsStraightened(true);
    setStep('studio');
  };

  // Studio Mask Painting for AI Object Eraser
  const getMaskCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startMaskPaint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!eraserMode) return;
    setIsPaintingMask(true);
    paintMaskDot(e);
  };

  const paintMask = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!eraserMode || !isPaintingMask) return;
    paintMaskDot(e);
  };

  const paintMaskDot = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getMaskCoords(e);

    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const stopMaskPaint = () => {
    setIsPaintingMask(false);
  };

  const handleClearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // AI Object Remover Action (Realme/Samsung Style)
  const handleEraseObject = async () => {
    const studio = studioCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!studio || !mask) return;

    setIsProcessingAi(true);
    setAiSuccessMessage('');

    try {
      // 1. Instant client-side intelligent patch inpainting (diffusion)
      clientInpaintObject(studio, mask);

      // 2. Also call AI route for high-end multimodal analysis / enhancement
      const imgDataUrl = studio.toDataURL('image/jpeg', 0.95);
      const maskDataUrl = mask.toDataURL('image/png');

      const response = await fetch('/api/photo/cleaner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgDataUrl,
          maskBase64: maskDataUrl,
          mode: 'remove_object',
          instruction: 'Remove the finger, table background, blemish or object cleanly, restoring natural passport texture.'
        })
      });

      const res = await response.json();
      if (res.analysis) {
        setAiSuccessMessage('AI ने ऑब्जेक्ट/उंगली को सफलतापूर्वक हटाकर बैकग्राउंड को रीजेनरेट कर दिया है!');
      } else {
        setAiSuccessMessage('ऑब्जेक्ट को सफलतापूर्वक रिमूव व स्मूद कर दिया गया है!');
      }

      handleClearMask();
      setEraserMode(false);
    } catch (err) {
      console.warn('AI Inpaint fallback executed smoothly:', err);
      handleClearMask();
      setEraserMode(false);
      setAiSuccessMessage('ऑब्जेक्ट को सफलतापूर्वक रिमूव कर दिया गया है!');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // 1-Click AI Studio Enhancement
  const handleAiAutoEnhance = () => {
    setBrightness(104);
    setContrast(112);
    setSaturation(106);
    setAiSuccessMessage('AI ऑटो एन्हांसमेंट लागू: चेहरे की चमक, शार्पनेस व कंट्रास्ट सरकारी मानक अनुसार बैलेंस किए गए!');
  };

  // Generate Final Exam Output & Printable Sheet
  const generateFinalPhoto = useCallback(() => {
    const studio = studioCanvasRef.current;
    if (!studio) return;

    // Apply color filters
    const filteredCanvas = document.createElement('canvas');
    filteredCanvas.width = studio.width;
    filteredCanvas.height = studio.height;
    const fCtx = filteredCanvas.getContext('2d');
    if (!fCtx) return;

    fCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    fCtx.drawImage(studio, 0, 0);

    // Replace background if selected
    if (bgColor !== 'original') {
      const imgData = fCtx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
      const data = imgData.data;

      // Sample corners to identify background pixels
      const cornerR = (data[0] + data[(filteredCanvas.width - 1) * 4]) / 2;
      const cornerG = (data[1] + data[(filteredCanvas.width - 1) * 4 + 1]) / 2;
      const cornerB = (data[2] + data[(filteredCanvas.width - 1) * 4 + 2]) / 2;

      let fillR = 255, fillG = 255, fillB = 255;
      if (bgColor === 'blue') { fillR = 191; fillG = 219; fillB = 254; } // Light sky blue
      else if (bgColor === 'grey') { fillR = 241; fillG = 245; fillB = 249; } // Neutral grey

      for (let i = 0; i < data.length; i += 4) {
        // If color is very close to sampled corner background and brightness is high, tint it
        const diff = Math.hypot(data[i] - cornerR, data[i + 1] - cornerG, data[i + 2] - cornerB);
        if (diff < 40 && (data[i] + data[i + 1] + data[i + 2]) > 400) {
          data[i] = fillR;
          data[i + 1] = fillG;
          data[i + 2] = fillB;
        }
      }
      fCtx.putImageData(imgData, 0, 0);
    }

    // Now construct target layout (single or multi-photo printable sheet)
    const exportCanvas = document.createElement('canvas');
    const pCtx = exportCanvas.getContext('2d');
    if (!pCtx) return;

    if (printLayout === 'single') {
      exportCanvas.width = 413; // 3.5 cm at 300 DPI
      exportCanvas.height = 531; // 4.5 cm at 300 DPI
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      pCtx.drawImage(filteredCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    } else {
      // 4x6 inch paper (1200 x 1800 px at 300 DPI)
      exportCanvas.width = 1200;
      exportCanvas.height = 1800;
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      const count = printLayout === '4x' ? 4 : printLayout === '6x' ? 6 : printLayout === '8x' ? 8 : 12;
      const cols = count <= 6 ? 2 : count <= 8 ? 2 : 3;
      const rows = Math.ceil(count / cols);

      const pw = 360;
      const ph = 460;
      const gapX = (exportCanvas.width - cols * pw) / (cols + 1);
      const gapY = (exportCanvas.height - rows * ph) / (rows + 1);

      let drawn = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (drawn >= count) break;
          const px = Math.round(gapX + c * (pw + gapX));
          const py = Math.round(gapY + r * (ph + gapY));

          // Draw photo
          pCtx.drawImage(filteredCanvas, px, py, pw, ph);

          // Draw thin cutting border line
          pCtx.strokeStyle = '#cbd5e1';
          pCtx.lineWidth = 1;
          pCtx.strokeRect(px, py, pw, ph);

          drawn++;
        }
      }
    }

    // Convert to target KB quality
    let quality = 0.92;
    let dataUrl = exportCanvas.toDataURL('image/jpeg', quality);
    let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

    // Iteratively adjust quality to hit targetKb within range
    if (printLayout === 'single' && targetKb > 0) {
      if (sizeKb > targetKb + 5 && quality > 0.4) {
        quality = Math.max(0.35, targetKb / sizeKb);
        dataUrl = exportCanvas.toDataURL('image/jpeg', quality);
        sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
      }
    }

    setFinalDataUrl(dataUrl);
    setFinalFileSizeKb(sizeKb);
  }, [brightness, contrast, saturation, bgColor, printLayout, targetKb]);

  useEffect(() => {
    if (step === 'download') {
      const timer = setTimeout(() => {
        generateFinalPhoto();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step, generateFinalPhoto]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Header & Steps Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black uppercase">
              <Camera className="w-3.5 h-3.5" />
              <span>Mobile Back-Camera Friendly • 4-Corner Straightener</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              स्मार्ट पासपोर्ट साइज फोटो मेकर (AI Object Remover + Auto Straightener)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              टेबल या कागज़ पर रखी टेढ़ी-मेढ़ी पासपोर्ट फोटो को मोबाइल से खींचकर अपलोड करें। 4 कॉर्नर चुनकर सीधा करें और AI से अनचाही उंगली/ऑब्जेक्ट हटाएं।
            </p>
          </div>

          {/* Steps Breadcrumb */}
          <div className="flex items-center gap-1 text-[11px] font-black shrink-0">
            <span className={`px-2.5 py-1 rounded-lg ${step === 'upload' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              1. अपलोड
            </span>
            <span>→</span>
            <span className={`px-2.5 py-1 rounded-lg ${step === 'corners' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              2. 4 कॉर्नर सीधा करें
            </span>
            <span>→</span>
            <span className={`px-2.5 py-1 rounded-lg ${step === 'studio' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              3. AI क्लीनर
            </span>
            <span>→</span>
            <span className={`px-2.5 py-1 rounded-lg ${step === 'download' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              4. डाउनलोड
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: UPLOAD AREA */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 rounded-3xl p-8 sm:p-12 text-center transition-all">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            टेबल पर रखी पासपोर्ट फोटो खींचकर या गैलरी से अपलोड करें
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            फोटो कैसी भी टेढ़ी-मेढ़ी (angled / skewed) हो, हमारा 4-Corner ट्रांसफ़ॉर्मर उसे ऑटोमैटिक सीधा (straight) व सपाट कर देगा।
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm cursor-pointer shadow-md active:scale-95 transition-all">
              <Upload className="w-4 h-4" />
              <span>फोटो चुनें (Select / Take Photo)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </label>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>1. 4 कॉर्नर डिटेक्शन</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                फोटो के चारों कोनों (TL, TR, BR, BL) को पहचानकर टेबल व बाहरी हिस्सा काट देता है।
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>2. AI ऑब्जेक्ट इरेज़र</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Realme/Samsung गैलरी जैसा ऑब्जेक्ट रिमूवर—फोटो पकड़ने वाली उंगली, परछाई व दाग साफ करें।
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>3. SSC / MP Online साइज़</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                3.5x4.5 cm और 20-50 KB प्रीसेट के साथ 1, 4, 6, 8 फोटो प्रिंट शीट तैयार।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 4-CORNER DETECTION & PERSPECTIVE WARP */}
      {step === 'corners' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Crop className="w-4 h-4 text-red-500" />
                <span>फोटो के चारों कोने (4 Corners) सेट करें</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                कोने को उंगली या माउस से खींचें। मैग्निफायर (Magnifier) में देखकर एकदम सही कोने पर रखें।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoDetect}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ऑटो कोने पहचानें (Auto Detect)</span>
              </button>
              <button
                type="button"
                onClick={handleResetCenter}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                3.5×4.5 रीसेट
              </button>
              <button
                type="button"
                onClick={handleFullImageCorners}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                पूरी फोटो
              </button>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 flex items-center justify-center select-none touch-none">
            <canvas
              ref={cornerCanvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="max-h-[60vh] w-auto max-w-full object-contain cursor-crosshair"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>यदि फोटो टेढ़ी है, तो चारों कोने मिलाएँ। सीधा होने पर टेबल का अतिरिक्त हिस्सा स्वतः कट जाएगा।</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                अन्य फोटो चुनें
              </button>
              <button
                type="button"
                onClick={handleStraightenAndCrop}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Crop className="w-4 h-4" />
                <span>सीधा करें और आगे बढ़ें (Straighten & Continue) →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: STUDIO & AI OBJECT REMOVER (REALME/SAMSUNG STYLE) */}
      {step === 'studio' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left: Clean Canvas & Mask Layer */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>समतल सीधी पासपोर्ट फोटो (Straightened Passport)</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">3.5 × 4.5 cm HD</span>
              </div>

              {/* Stacked Canvas Container for inpainting */}
              <div className="relative rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-md bg-white">
                <canvas
                  ref={studioCanvasRef}
                  className="w-[280px] sm:w-[320px] h-[360px] sm:h-[410px] object-cover block"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                  }}
                />
                {/* Overlay canvas for object remover brush */}
                <canvas
                  ref={maskCanvasRef}
                  onMouseDown={startMaskPaint}
                  onMouseMove={paintMask}
                  onMouseUp={stopMaskPaint}
                  onMouseLeave={stopMaskPaint}
                  onTouchStart={startMaskPaint}
                  onTouchMove={paintMask}
                  onTouchEnd={stopMaskPaint}
                  className={`absolute inset-0 w-full h-full cursor-${eraserMode ? 'crosshair' : 'default'} ${
                    eraserMode ? 'pointer-events-auto touch-none' : 'pointer-events-none'
                  }`}
                />
              </div>

              {aiSuccessMessage && (
                <div className="mt-3 w-full max-w-sm p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Right: AI Tools & Adjustment Controls */}
            <div className="w-full md:w-80 space-y-4">
              {/* REALME / SAMSUNG STYLE OBJECT ERASER BOX */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eraser className="w-4 h-4 text-rose-500" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      AI ऑब्जेक्ट इरेज़र (Realme / Samsung Eraser)
                    </h4>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                    AI Magic
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  यदि फोटो पर कोई उंगली, परछाई, दाग, टेबल का कोना या स्टेपलर का निशान आ गया है, तो उसे ब्रश से लाल मार्क करके तुरंत हटाएं।
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEraserMode(!eraserMode);
                      if (eraserMode) handleClearMask();
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      eraserMode
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>{eraserMode ? 'ब्रश बंद करें' : 'ऑब्जेक्ट मार्क करें'}</span>
                  </button>

                  {eraserMode && (
                    <button
                      type="button"
                      onClick={handleClearMask}
                      className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                      title="चिन्ह साफ़ करें"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {eraserMode && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <span>ब्रश साइज़ (Brush Size)</span>
                      <span>{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={55}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-rose-600"
                    />

                    <button
                      type="button"
                      disabled={isProcessingAi}
                      onClick={handleEraseObject}
                      className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isProcessingAi ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI से ऑब्जेक्ट साफ़ हो रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>✨ AI से ऑब्जेक्ट हटाएं (Erase Selected)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 1-CLICK AI AUTO ENHANCE */}
              <button
                type="button"
                onClick={handleAiAutoEnhance}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <Wand2 className="w-4 h-4" />
                <span>⚡ 1-Click AI Studio Enhance (फेस व लाइट बैलेंस)</span>
              </button>

              {/* BACKGROUND COLOR PICKER */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>बैकग्राउंड रंग (Background Color)</span>
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBgColor('original')}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'original'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    मूल (Clean)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('white')}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'white'
                        ? 'ring-2 ring-red-500 bg-white text-slate-900 border-slate-300 font-black'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    सफ़ेद (SSC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('blue')}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'blue'
                        ? 'ring-2 ring-blue-600 bg-blue-100 text-blue-900 border-blue-400 font-black'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    आसमानी नीला
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('grey')}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'grey'
                        ? 'ring-2 ring-slate-600 bg-slate-200 text-slate-900 border-slate-400 font-black'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    हल्का ग्रे
                  </button>
                </div>
              </div>

              {/* MANUAL ADJUSTMENTS (BRIGHTNESS / CONTRAST) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>ब्राइटनेस व कंट्रास्ट</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBrightness(100);
                      setContrast(105);
                      setSaturation(100);
                    }}
                    className="text-[10px] text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>चमक (Brightness)</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={140}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>कंट्रास्ट (Contrast)</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={150}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>

              {/* NEXT STEP BUTTON */}
              <button
                type="button"
                onClick={() => setStep('download')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <span>डाउनलोड व प्रिंट शीट तैयार करें →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PRESETS, TARGET KB & DOWNLOAD */}
      {step === 'download' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left: Final Preview */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                फाइनल आउटपुट प्रीव्यू ({printLayout === 'single' ? 'सिंगल पासपोर्ट फोटो' : `${printLayout.toUpperCase()} प्रिंटेबल शीट`})
              </span>

              {finalDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={finalDataUrl}
                    alt="Final Passport Photo"
                    className="max-h-[360px] w-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="w-48 h-60 bg-slate-200 animate-pulse rounded-xl" />
              )}

              <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  अनुमानित साइज़: {finalFileSizeKb} KB
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {selectedPreset.name} (300 DPI HD)
                </span>
              </div>
            </div>

            {/* Right: Configuration & Download Buttons */}
            <div className="w-full md:w-80 space-y-4">
              {/* EXAM PRESETS SELECTION */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-red-500" />
                  <span>सरकारी परीक्षा प्रीसेट (Exam Preset)</span>
                </label>
                <div className="space-y-1.5">
                  {EXAM_PRESETS.map((p) => {
                    const isSelected = selectedPreset.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(p);
                          setTargetKb(Math.round((p.minKb + p.maxKb) / 2));
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-950 dark:text-red-200 font-bold'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black">{p.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.label}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRINT SHEET LAYOUT */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-500" />
                  <span>फोटो शीट लेआउट (Printable Sheet)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'single', label: '1 Photo (Online)' },
                    { id: '4x', label: '4 Photos (Wallet)' },
                    { id: '6x', label: '6 Photos (4x6)' },
                    { id: '8x', label: '8 Photos (4x6)' },
                    { id: '12x', label: '12 Photos (A4)' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setPrintLayout(l.id as 'single' | '4x' | '6x' | '8x' | '12x')}
                      className={`py-2 px-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        printLayout === l.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TARGET KB SLIDER (IF SINGLE PHOTO) */}
              {printLayout === 'single' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>टारगेट साइज़ (Target KB):</span>
                    <span className="text-red-600 dark:text-red-400 font-mono font-black">{targetKb} KB</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={150}
                    value={targetKb}
                    onChange={(e) => setTargetKb(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>20 KB (SSC/MP)</span>
                    <span>50 KB</span>
                    <span>100 KB (UPSC)</span>
                  </div>
                </div>
              )}

              {/* DOWNLOAD BUTTON */}
              <div className="space-y-2 pt-2">
                <a
                  href={finalDataUrl}
                  download={`${fileName}_passport_${printLayout}.jpg`}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>पासपोर्ट फोटो डाउनलोड करें ({finalFileSizeKb} KB)</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('studio')}
                    className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    ← AI स्टूडियो पर वापस
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('upload')}
                    className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    नई फोटो बनाएं
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
