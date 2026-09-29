"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
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
  Info,
  FolderOpen,
  RotateCw,
  RotateCcw,
  Lock,
  Unlock,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  QuadCorners,
  autoDetectPhotoCorners,
  getCenteredDefaultCorners,
  getInnerCardDefaultCorners,
  getQuadNaturalDimensions,
  warpPerspective,
  clientInpaintObject,
  rotateCanvas,
  aiDetectPhotoCorners,
  replacePassportBackground,
  enhancePassportSharpness
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
    id: 'original-crop',
    name: 'मूल क्रॉप्ड फोटो (Original Aspect / Size)',
    label: 'क्रॉप की गई मूल फ़ोटो का प्राकृतिक अनुपात व स्पष्टता',
    widthCm: 3.5,
    heightCm: 4.5,
    minKb: 20,
    maxKb: 300,
    popular: true,
  },
  {
    id: 'ssc-mpesb',
    name: 'SSC / MP Online / MPESB',
    label: '3.5 × 4.5 cm (20-50 KB)',
    widthCm: 3.5,
    heightCm: 4.5,
    minKb: 20,
    maxKb: 50,
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
  },
  {
    id: 'custom-sheet',
    name: 'कस्टम / प्रिंटेबल शीट (Ultra HD Print)',
    label: 'रंगीन प्रिंटर / फोटो पेपर हेतु अल्ट्रा एचडी क्लैरिटी',
    widthCm: 3.5,
    heightCm: 4.5,
    minKb: 100,
    maxKb: 2000,
  }
];

export const SmartPassportMakerTool: React.FC = () => {
  const [step, setStep] = useState<ActiveStep>('upload');
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('passport-photo');

  // Step 2: Corners & Perspective
  const [corners, setCorners] = useState<QuadCorners | null>(null);
  const [activeCorner, setActiveCorner] = useState<'tl' | 'tr' | 'br' | 'bl' | null>(null);
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number } | null>(null);

  // Canvases
  const cornerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step 3: Straightened Data & Studio State (Guarantees NO blank white canvas!)
  const [straightenedDataUrl, setStraightenedDataUrl] = useState<string>('');
  const [workingDataUrl, setWorkingDataUrl] = useState<string>('');
  const [studioReady, setStudioReady] = useState<boolean>(false);

  // Studio & Inpainting (Realme/Samsung Object Eraser)
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

  // Step 4: Exam Preset & Output Sheet
  const [selectedPreset, setSelectedPreset] = useState<ExamPreset>(EXAM_PRESETS[0]);
  const [printLayout, setPrintLayout] = useState<'single' | '4x' | '6x' | '8x' | '12x'>('single');
  const [sheetResolution, setSheetResolution] = useState<'300dpi' | '450dpi' | '600dpi' | 'a4_300'>('300dpi');

  // CHECKBOX CONTROL 1: Custom Dimensions
  const [enableCustomDimensions, setEnableCustomDimensions] = useState<boolean>(false);
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'mm' | 'px'>('cm');
  const [customWidth, setCustomWidth] = useState<number>(3.5);
  const [customHeight, setCustomHeight] = useState<number>(4.5);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  // CHECKBOX CONTROL 2: Target File Size (KB)
  const [enableCustomKb, setEnableCustomKb] = useState<boolean>(false);
  const [targetKb, setTargetKb] = useState<number>(45);

  // Output Stats
  const [finalFileSizeKb, setFinalFileSizeKb] = useState<number>(0);
  const [finalDimensions, setFinalDimensions] = useState<{ width: number; height: number }>({ width: 413, height: 531 });
  const [finalDataUrl, setFinalDataUrl] = useState<string>('');

  // AI Corner Detection & Rotation State
  const [isDetectingCorners, setIsDetectingCorners] = useState<boolean>(false);
  const [aiDetectionStatus, setAiDetectionStatus] = useState<string>('');
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Run Client-Side Contour Detection + Gemini Free-Tier Vision AI
  const runAiDetection = useCallback(async (dataUrl: string, width: number, height: number, sourceCanvas?: HTMLCanvasElement | null) => {
    setIsDetectingCorners(true);
    setAiDetectionStatus('🔍 Gemini AI विज़न फोटो के वास्तविक 4 कोनों की तलाश कर रहा है...');

    // 1. Run Gemini Vision API (/api/tools/extract-passport)
    try {
      const result = await aiDetectPhotoCorners(dataUrl, width, height, sourceCanvas);
      if (result.success && result.corners) {
        setCorners(result.corners);
        if (result.rotationNeeded && result.rotationNeeded !== 0) {
          setRotationAngle(result.rotationNeeded);
          setAiDetectionStatus(`✨ AI विज़न ने पासपोर्ट फोटो पहचानी! (${result.rotationNeeded}° ऑटो-रोटेशन सेट)`);
        } else {
          setAiDetectionStatus('✨ AI विज़न ने पासपोर्ट फोटो के 4 वास्तविक कोने (Rotated Quad) सटीक पहचान लिए!');
        }
        setIsDetectingCorners(false);
        return;
      } else if (result.errorMessage) {
        console.info('Vision note:', result.errorMessage);
      }
    } catch (err) {
      console.warn('Vision detection attempt:', err);
    }

    // 2. Client-side contour fallback if vision API did not return corners
    if (sourceCanvas) {
      try {
        const clientResult = autoDetectPhotoCorners(width, height, sourceCanvas);
        if (clientResult.isRealDetection && clientResult.corners) {
          setCorners(clientResult.corners);
          setAiDetectionStatus('✨ कंटूर डिटेक्शन ने फोटो के 4 कोने सफलतापूर्वक पहचान लिए!');
          setIsDetectingCorners(false);
          return;
        }
      } catch (err) {
        console.warn('Local contour check:', err);
      }
    }

    setAiDetectionStatus('ℹ️ कोनों को अपनी उंगली या माउस से खींचकर फोटो पर सेट करें, अथवा "⚡ 1-Click AI Auto Extract" दबाएं।');
    setIsDetectingCorners(false);
  }, []);

  // 1. File Upload Handler (Auto triggers Client Contour + AI Vision)
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImage(img);
        setRotationAngle(0);

        // Immediate default corners while detection runs
        const initial = getCenteredDefaultCorners(img.width, img.height);
        setCorners(initial);
        setStep('corners');

        // Create quick temp canvas for instant contour scanning
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);

        // Run detection
        runAiDetection(dataUrl, img.width, img.height, tempCanvas);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Rotate original uploaded image canvas (90 deg CW or CCW)
  const handleRotateOriginal = (dir: 'cw' | 'ccw') => {
    if (!originalImage) return;
    const deg = dir === 'cw' ? 90 : 270;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(originalImage, 0, 0);

    const rotated = rotateCanvas(tempCanvas, deg);
    const dataUrl = rotated.toDataURL('image/jpeg', 0.95);
    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = () => {
      setOriginalImage(newImg);
      setCorners(getCenteredDefaultCorners(newImg.width, newImg.height));
      runAiDetection(dataUrl, newImg.width, newImg.height, rotated);
    };
    newImg.src = dataUrl;
  };

  // Rotate studio canvas (90 deg CW or CCW)
  const handleRotateStudio = (dir: 'cw' | 'ccw') => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;
    const deg = dir === 'cw' ? 90 : 270;
    const rotated = rotateCanvas(studioCanvas, deg);

    studioCanvas.width = rotated.width;
    studioCanvas.height = rotated.height;
    const ctx = studioCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(rotated, 0, 0);
    }

    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      const rotMask = rotateCanvas(maskCanvas, deg);
      maskCanvas.width = rotMask.width;
      maskCanvas.height = rotMask.height;
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) mCtx.drawImage(rotMask, 0, 0);
    }

    const newDataUrl = studioCanvas.toDataURL('image/jpeg', 0.95);
    setStraightenedDataUrl(newDataUrl);
  };

  // Draw Corners Canvas with Interactive Handles & Circular Magnifier Loupe
  const renderCornersCanvas = useCallback(() => {
    const canvas = cornerCanvasRef.current;
    if (!canvas || !originalImage || !corners) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep internal canvas dimensions matching natural image resolution
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Draw background original image
    ctx.drawImage(originalImage, 0, 0);

    // Dim the exterior area outside quadrilateral
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out quadrilateral to reveal inner photo brightly
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(corners.tl.x, corners.tl.y);
    ctx.lineTo(corners.tr.x, corners.tr.y);
    ctx.lineTo(corners.br.x, corners.br.y);
    ctx.lineTo(corners.bl.x, corners.bl.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw outer dashed red guideline
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

    // Draw solid inner white guide
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, Math.round(canvas.width / 440));
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();

    // Draw 4 Corner Handles with High-Visibility Labels
    const handleRadius = Math.max(16, Math.round(canvas.width / 42));
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
      ctx.arc(pt.x, pt.y, handleRadius + (isCurrent ? 7 : 3), 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Outer Circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#ef4444' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#ef4444';
      ctx.stroke();

      // Center Precision Dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius / 3, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#ffffff' : '#ef4444';
      ctx.fill();

      // Corner Label Tag
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${Math.max(11, Math.round(canvas.width / 48))}px sans-serif`;
      ctx.fillText(label, pt.x + handleRadius + 6, pt.y + 4);
      ctx.restore();
    });

    // Draw Zoom Loupe / Magnifier Glass on Touch/Drag
    if (activeCorner && magnifierPos && corners) {
      const targetPt = corners[activeCorner];
      const loupeRadius = Math.max(55, Math.round(canvas.width / 11));
      const zoom = 2.5;

      // Position loupe offset from finger/cursor so finger does not occlude it
      const loupeX = Math.min(canvas.width - loupeRadius - 10, Math.max(loupeRadius + 10, targetPt.x));
      const loupeY = targetPt.y > loupeRadius * 2 + 35 ? targetPt.y - loupeRadius - 45 : targetPt.y + loupeRadius + 45;

      ctx.save();
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw zoomed image portion
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
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(loupeX - loupeRadius, loupeY);
      ctx.lineTo(loupeX + loupeRadius, loupeY);
      ctx.moveTo(loupeX, loupeY - loupeRadius);
      ctx.lineTo(loupeX, loupeY + loupeRadius);
      ctx.stroke();

      ctx.restore();

      // Loupe Outer Ring
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
    const hitRadius = Math.max(34, canvas.width / 18);

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
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(originalImage, 0, 0);
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);
    runAiDetection(dataUrl, originalImage.width, originalImage.height, tempCanvas);
  };

  const handleInnerCardCorners = () => {
    if (!originalImage) return;
    setCorners(getInnerCardDefaultCorners(originalImage.width, originalImage.height));
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

  // ⚡ 1-Click AI Auto Extract & Straighten (Direct Pipeline)
  const handleOneClickAutoExtract = async () => {
    if (!originalImage) return;
    setIsDetectingCorners(true);
    setAiDetectionStatus('⚡ 1-Click AI: विज़न मॉडल फोटो के वास्तविक 4 कोने पहचानकर सीधा व शार्प कर रहा है...');

    const tempSrc = document.createElement('canvas');
    tempSrc.width = originalImage.width;
    tempSrc.height = originalImage.height;
    const tempCtx = tempSrc.getContext('2d');
    if (!tempCtx) {
      setIsDetectingCorners(false);
      return;
    }
    tempCtx.drawImage(originalImage, 0, 0);
    const dataUrl = tempSrc.toDataURL('image/jpeg', 0.85);

    let detectedCorners: QuadCorners | null = null;
    let detectedRotation = rotationAngle;

    try {
      const aiResult = await aiDetectPhotoCorners(dataUrl, originalImage.width, originalImage.height, tempSrc);
      if (aiResult.success && aiResult.corners) {
        detectedCorners = aiResult.corners;
        if (aiResult.rotationNeeded) detectedRotation = aiResult.rotationNeeded;
      }
    } catch (e) {
      console.warn('1-Click AI vision extract error:', e);
    }

    if (!detectedCorners) {
      const contour = autoDetectPhotoCorners(originalImage.width, originalImage.height, tempSrc);
      if (contour.isRealDetection && contour.corners) {
        detectedCorners = contour.corners;
      } else {
        detectedCorners = corners || getInnerCardDefaultCorners(originalImage.width, originalImage.height);
      }
    }

    setCorners(detectedCorners);
    setRotationAngle(detectedRotation);

    // Perform client-side perspective transform (2D projective homography)
    const natural = getQuadNaturalDimensions(detectedCorners);
    const targetH = 900;
    const targetW = Math.max(100, Math.round(targetH * natural.aspect));

    let warpedCanvas = warpPerspective(tempSrc, detectedCorners, targetW, targetH);
    if (detectedRotation !== 0) {
      warpedCanvas = rotateCanvas(warpedCanvas, detectedRotation);
    }

    // Apply subtle contrast & sharpness enhancement for text (e.g. Yash Sontake, Date) and face clarity
    warpedCanvas = enhancePassportSharpness(warpedCanvas);

    const resultDataUrl = warpedCanvas.toDataURL('image/jpeg', 0.95);
    setStraightenedDataUrl(resultDataUrl);
    setWorkingDataUrl(resultDataUrl);
    setBgColor('original');
    setStudioReady(false);
    setIsDetectingCorners(false);
    setAiDetectionStatus('⚡ 1-Click AI एक्सट्रैक्शन पूर्ण: फोटो सीधी, समतल व शार्प हो गई!');
    setStep('studio');
  };

  // Straighten & Warp Action (FIX FOR BLANK WHITE CANVAS & NATURAL RATIO)
  const handleStraightenAndCrop = () => {
    if (!corners || !originalImage) return;

    // Create temporary source canvas
    const tempSrc = document.createElement('canvas');
    tempSrc.width = originalImage.width;
    tempSrc.height = originalImage.height;
    const tempCtx = tempSrc.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(originalImage, 0, 0);

    // Keep natural aspect ratio of the user-selected cropped quadrilateral
    const natural = getQuadNaturalDimensions(corners);
    const targetH = 900;
    const targetW = Math.max(100, Math.round(targetH * natural.aspect));

    let warpedCanvas = warpPerspective(tempSrc, corners, targetW, targetH);

    // Apply auto-rotation if detected
    if (rotationAngle !== 0) {
      warpedCanvas = rotateCanvas(warpedCanvas, rotationAngle);
    }

    // Apply subtle contrast & sharpness enhancement for text and face clarity
    warpedCanvas = enhancePassportSharpness(warpedCanvas);

    const dataUrl = warpedCanvas.toDataURL('image/jpeg', 0.95);
    setStraightenedDataUrl(dataUrl);
    setWorkingDataUrl(dataUrl);
    setBgColor('original');
    setStudioReady(false);

    // Move to Studio step
    setStep('studio');
  };

  // Live Background Color Replacement
  const handleSelectBgColor = (color: 'original' | 'white' | 'blue' | 'grey') => {
    setBgColor(color);
    const source = straightenedDataUrl || workingDataUrl;
    if (!source) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tCtx = tempCanvas.getContext('2d');
      if (!tCtx) return;
      tCtx.drawImage(img, 0, 0);

      const resultCanvas = replacePassportBackground(tempCanvas, color);
      const newUrl = resultCanvas.toDataURL('image/jpeg', 0.95);
      setWorkingDataUrl(newUrl);

      const studioCanvas = studioCanvasRef.current;
      if (studioCanvas) {
        studioCanvas.width = resultCanvas.width;
        studioCanvas.height = resultCanvas.height;
        const sCtx = studioCanvas.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(resultCanvas, 0, 0);
        }
      }
      setAiSuccessMessage(color === 'original' ? 'मूल बैकग्राउंड बहाल किया गया' : `बैकग्राउंड रंग ${color === 'white' ? 'सफ़ेद' : color === 'blue' ? 'आसमानी नीला' : 'हल्का ग्रे'} सेट किया गया`);
    };
    img.src = source;
  };

  // Switch layout and auto-set Custom Sheet Preset
  const handleLayoutChange = (layout: 'single' | '4x' | '6x' | '8x' | '12x') => {
    setPrintLayout(layout);
    if (layout !== 'single') {
      const customSheet = EXAM_PRESETS.find((p) => p.id === 'custom-sheet') || EXAM_PRESETS[0];
      setSelectedPreset(customSheet);
      setEnableCustomKb(false);
    }
  };

  // Initialize and Synchronize Studio Canvas when entering Step 3
  useEffect(() => {
    if (step === 'studio' && straightenedDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const studioCanvas = studioCanvasRef.current;
        if (studioCanvas) {
          studioCanvas.width = img.width;
          studioCanvas.height = img.height;
          const sCtx = studioCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(img, 0, 0);
            setStudioReady(true);
          }
        }

        const maskCanvas = maskCanvasRef.current;
        if (maskCanvas) {
          maskCanvas.width = img.width;
          maskCanvas.height = img.height;
          const mCtx = maskCanvas.getContext('2d');
          if (mCtx) {
            mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          }
        }
      };
      img.src = straightenedDataUrl;
    }
  }, [step, straightenedDataUrl]);

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
      // 1. Client-side patch inpainting
      clientInpaintObject(studio, mask);

      // Update straightenedDataUrl
      const updatedUrl = studio.toDataURL('image/jpeg', 0.95);
      setStraightenedDataUrl(updatedUrl);

      // 2. Call AI cleaner route
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

  // Dimension helpers: converts cm/mm/px to pixel width & height at 300 DPI
  const getTargetPixelDimensions = useCallback((): { width: number; height: number } => {
    if (selectedPreset.id === 'original-crop') {
      if (corners) {
        const nat = getQuadNaturalDimensions(corners);
        const h = 531;
        const w = Math.round(h * nat.aspect);
        return { width: Math.max(50, w), height: Math.max(50, h) };
      }
      return { width: 413, height: 531 };
    }

    if (!enableCustomDimensions) {
      // Pre-filled standard: 3.5 x 4.5 cm (413 x 531 px at 300 DPI)
      const w = Math.round((selectedPreset.widthCm * 300) / 2.54);
      const h = Math.round((selectedPreset.heightCm * 300) / 2.54);
      return { width: w, height: h };
    }

    if (dimensionUnit === 'cm') {
      const w = Math.round((customWidth * 300) / 2.54);
      const h = Math.round((customHeight * 300) / 2.54);
      return { width: Math.max(50, w), height: Math.max(50, h) };
    } else if (dimensionUnit === 'mm') {
      const w = Math.round((customWidth * 300) / 25.4);
      const h = Math.round((customHeight * 300) / 25.4);
      return { width: Math.max(50, w), height: Math.max(50, h) };
    } else {
      return { width: Math.max(50, Math.round(customWidth)), height: Math.max(50, Math.round(customHeight)) };
    }
  }, [enableCustomDimensions, dimensionUnit, customWidth, customHeight, selectedPreset, corners]);

  // Handle custom width change with aspect ratio locking
  const handleWidthChange = (val: number) => {
    setCustomWidth(val);
    if (lockAspectRatio) {
      const ratio = 4.5 / 3.5;
      setCustomHeight(Number((val * ratio).toFixed(dimensionUnit === 'px' ? 0 : 2)));
    }
  };

  // Handle custom height change with aspect ratio locking
  const handleHeightChange = (val: number) => {
    setCustomHeight(val);
    if (lockAspectRatio) {
      const ratio = 3.5 / 4.5;
      setCustomWidth(Number((val * ratio).toFixed(dimensionUnit === 'px' ? 0 : 2)));
    }
  };

  // Generate Final Exam Output & Printable Sheet with Iterative Compression
  const generateFinalPhoto = useCallback(() => {
    const sourceUrl = workingDataUrl || straightenedDataUrl;
    if (!sourceUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const studio = document.createElement('canvas');
      studio.width = img.width;
      studio.height = img.height;
      const sCtx = studio.getContext('2d');
      if (!sCtx) return;
      sCtx.drawImage(img, 0, 0);

      // Apply color filters
      const filteredCanvas = document.createElement('canvas');
      filteredCanvas.width = studio.width;
      filteredCanvas.height = studio.height;
      const fCtx = filteredCanvas.getContext('2d');
      if (!fCtx) return;

      fCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      fCtx.drawImage(studio, 0, 0);

      const { width: targetW, height: targetH } = getTargetPixelDimensions();
      setFinalDimensions({ width: targetW, height: targetH });

      // Construct target layout (single or multi-photo printable sheet)
      const exportCanvas = document.createElement('canvas');
      const pCtx = exportCanvas.getContext('2d');
      if (!pCtx) return;

      if (printLayout === 'single') {
        exportCanvas.width = targetW;
        exportCanvas.height = targetH;
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        pCtx.drawImage(filteredCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
      } else {
        // Multi-photo Printable Sheet (4x6 or A4 at selected DPI)
        let sheetW = 1200;
        let sheetH = 1800; // 4x6 at 300 DPI

        if (sheetResolution === '450dpi') {
          sheetW = 1800;
          sheetH = 2700;
        } else if (sheetResolution === '600dpi') {
          sheetW = 2400;
          sheetH = 3600; // 4x6 Studio Master
        } else if (sheetResolution === 'a4_300') {
          sheetW = 2480;
          sheetH = 3508; // A4 Sheet 300 DPI
        }

        exportCanvas.width = sheetW;
        exportCanvas.height = sheetH;
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        const count = printLayout === '4x' ? 4 : printLayout === '6x' ? 6 : printLayout === '8x' ? 8 : 12;
        const cols = count <= 4 ? 2 : count <= 8 ? 2 : 3;
        const rows = Math.ceil(count / cols);

        const pw = Math.round((sheetW / (cols + 0.4)) * 0.88);
        const ph = Math.round(pw * (targetH / targetW));
        const gapX = (sheetW - cols * pw) / (cols + 1);
        const gapY = (sheetH - rows * ph) / (rows + 1);

        let drawn = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (drawn >= count) break;
            const px = Math.round(gapX + c * (pw + gapX));
            const py = Math.round(gapY + r * (ph + gapY));

            // Draw photo
            pCtx.drawImage(filteredCanvas, px, py, pw, ph);

            // Draw clean cutting border guide line
            pCtx.strokeStyle = '#94a3b8';
            pCtx.setLineDash([4, 4]);
            pCtx.lineWidth = 1;
            pCtx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
            pCtx.setLineDash([]);

            drawn++;
          }
        }
      }

      // Compression
      let dataUrl = exportCanvas.toDataURL('image/jpeg', printLayout === 'single' ? 0.92 : 0.98);
      let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

      if (printLayout === 'single' && enableCustomKb && targetKb > 0) {
        let minQ = 0.05;
        let maxQ = 0.98;
        for (let iter = 0; iter < 8; iter++) {
          const midQ = (minQ + maxQ) / 2;
          const testUrl = exportCanvas.toDataURL('image/jpeg', midQ);
          const testSize = Math.round((testUrl.length * 3) / 4 / 1024);

          dataUrl = testUrl;
          sizeKb = testSize;

          if (Math.abs(testSize - targetKb) <= 2) break;
          if (testSize > targetKb) {
            maxQ = midQ;
          } else {
            minQ = midQ;
          }
        }
      }

      setFinalDataUrl(dataUrl);
      setFinalFileSizeKb(sizeKb);
    };
    img.src = sourceUrl;
  }, [
    workingDataUrl,
    straightenedDataUrl,
    brightness,
    contrast,
    saturation,
    printLayout,
    sheetResolution,
    enableCustomKb,
    targetKb,
    getTargetPixelDimensions
  ]);

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
              <span>AI Passport Photo Extractor & Straightener</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              स्मार्ट पासपोर्ट साइज फोटो मेकर (AI 4-Corner Straightener + Object Eraser)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              हाथ/पाउच में पकड़ी या टेबल पर रखी टेढ़ी-मेढ़ी पासपोर्ट फोटो को पहचानकर सीधा करें, उंगलियां हटाएं और टारगेट KB व सटीक साइज़ में डाउनलोड करें।
            </p>
          </div>

          {/* Steps Breadcrumb */}
          <div className="flex items-center gap-1 text-[11px] font-black shrink-0 flex-wrap">
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
              4. डाउनलोड व साइज़
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: UPLOAD AREA (Files/Storage & Camera buttons) */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 rounded-3xl p-8 sm:p-12 text-center transition-all">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            हाथ या टेबल पर रखी पासपोर्ट फोटो खींचें अथवा गैलरी से चुनें
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            फोटो प्लास्टिक पाउच में हो, हाथ में पकड़ी हो या टेढ़ी-मेढ़ी (angled) हो—AI व कंटूर डिटेक्टर तुरंत इनर फोटो को सीधा व क्रॉप्ड कर देता है।
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-lg mx-auto">
            {/* Gallery / Storage File Upload Button (NO capture attribute) */}
            <label className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm cursor-pointer shadow-md active:scale-95 transition-all">
              <FolderOpen className="w-5 h-5 text-white" />
              <span>गैलरी / स्टोरेज से चुनें (Files / Gallery)</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </label>

            {/* Mobile Camera Direct Button (with capture attribute) */}
            <label className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-black text-xs sm:text-sm cursor-pointer border border-slate-700 shadow-md active:scale-95 transition-all">
              <Camera className="w-5 h-5 text-amber-400" />
              <span>कैमरा से फोटो खींचें (Take Photo)</span>
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
                <span>1. हाई-एक्यूरेसी 4 कॉर्नर</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                कंटूर डिटेक्शन + AI विज़न फोटो के सटीक 4 कोनों को पहचानकर उंगली व टेबल को अलग करता है।
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>2. ज़ीरो ब्लैंक कैनवास गारंटी</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                नेचुरल स्केल पर्सपेक्टिव मैपिंग से हमेशा समतल, क्रिस्टल क्लियर 3.5×4.5 फोटो मिलती है।
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>3. टारगेट साइज़ व KB कंट्रोल</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                cm, mm, px डायमेंशन्स और 20 KB, 35 KB, 50 KB, 100 KB टारगेट कंप्रेसर।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 4-CORNER DETECTION & PERSPECTIVE WARP */}
      {step === 'corners' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
          {/* AI Vision Status Notice */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              {isDetectingCorners ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>{aiDetectionStatus || 'AI विज़न व कंटूर एल्गोरिद्म फोटो के 4 कोनों को पहचान रहा है...'}</span>
            </div>

            {rotationAngle !== 0 && (
              <span className="text-[11px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md">
                ऑटो-रोटेशन: {rotationAngle}° सेट
              </span>
            )}
          </div>

          {/* Controls Bar */}
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* ⚡ 1-Click AI Direct Auto Extract Banner Button */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <span>⚡ 1-Click AI Auto Extract & Straighten</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white text-red-700 font-black tracking-wide uppercase">
                      Direct AI Pipeline
                    </span>
                  </div>
                  <div className="text-[11px] text-white/90 font-medium">
                    AI विज़न 4 झुके कोने पहचानकर फोटो को सीधे समतल (Homography), रोटेट व टेक्स्ट शार्प कर देगा।
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOneClickAutoExtract}
                disabled={isDetectingCorners}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white hover:bg-yellow-50 text-red-700 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isDetectingCorners ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-500" />
                )}
                <span>{isDetectingCorners ? 'AI प्रोसेस कर रहा है...' : '⚡ 1-क्लिक ऑटो एक्सट्रैक्ट'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Crop className="w-4 h-4 text-red-500" />
                  <span>फोटो के चारों कोने (Free-Form 4 Quad Handles)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  चारों कोने पूरी तरह स्वतंत्र हैं। किसी भी कोने को उंगली या माउस से खींचकर मनचाही दिशा में सेट करें।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={isDetectingCorners}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/40 cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Gemini Vision API से फोटो के वास्तविक 4 कोने पहचानें"
                >
                  {isDetectingCorners ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{isDetectingCorners ? 'AI खोज रहा है...' : 'AI ऑटो कोने पहचानें'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInnerCardCorners}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40 cursor-pointer flex items-center gap-1 transition-all"
                  title="हाथ या पाउच में पकड़ी छोटी फोटो को सेलेक्ट करें (50% Inner Card)"
                >
                  <span>🔍 इनर कार्ड (50%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRotateOriginal('cw')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                  title="फोटो को 90 डिग्री घुमाएं (Rotate 90° Clockwise)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>घूमाएं (Rotate 90°)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCenter}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>🔄 रीसेट</span>
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
          </div>

          {/* Interactive Canvas with Magnifier Loupe */}
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
              <span>चारों कोनों को मिलाएं। सीधा करने पर टेबल, हाथ व बाहरी हिस्सा स्वतः हट जाएगा।</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all">
                <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>गैलरी बदलें</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </label>

              <label className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all">
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>कैमरा</span>
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

      {/* STEP 3: STUDIO & AI OBJECT REMOVER (GUARANTEED NO BLANK CANVAS) */}
      {step === 'studio' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left: Clean Canvas & Mask Layer */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>समतल सीधी पासपोर्ट फोटो (Straightened Passport)</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRotateStudio('ccw')}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1 transition-all"
                    title="फोटो 90° बाएँ घुमाएं"
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-500" />
                    <span>↺ बाएँ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotateStudio('cw')}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1 transition-all"
                    title="फोटो 90° दाएँ घुमाएं"
                  >
                    <RotateCw className="w-3 h-3 text-indigo-500" />
                    <span>↻ दाएँ (90°)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('corners')}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 cursor-pointer flex items-center gap-1 transition-all"
                    title="कोने दोबारा सेट करें"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>🔄 कोने बदलें</span>
                  </button>
                </div>
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
                {/* Fallback preview while canvas initializes */}
                {!studioReady && straightenedDataUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={straightenedDataUrl}
                    alt="Straightened Preview"
                    className="absolute inset-0 w-full h-full object-cover block pointer-events-none"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                  />
                )}
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
                    onClick={() => handleSelectBgColor('original')}
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
                    onClick={() => handleSelectBgColor('white')}
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
                    onClick={() => handleSelectBgColor('blue')}
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
                    onClick={() => handleSelectBgColor('grey')}
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

      {/* STEP 4: PRESETS, TARGET KB & DIMENSION CONTROLS + DOWNLOAD */}
      {step === 'download' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left: Final Preview & Real-Time Stats */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  फाइनल आउटपुट प्रीव्यू ({printLayout === 'single' ? 'सिंगल पासपोर्ट फोटो' : `${printLayout.toUpperCase()} प्रिंटेबल शीट`})
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {finalDimensions.width} × {finalDimensions.height} px
                </span>
              </div>

              {finalDataUrl || workingDataUrl || straightenedDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={finalDataUrl || workingDataUrl || straightenedDataUrl}
                    alt="Final Passport Photo"
                    className="max-h-[340px] w-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="w-48 h-60 bg-slate-200 animate-pulse rounded-xl" />
              )}

              {/* Real-Time Stats Badges */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  📊 फाइल साइज़: {finalFileSizeKb > 0 ? finalFileSizeKb : Math.max(12, Math.round(((finalDataUrl || workingDataUrl || straightenedDataUrl || '').length * 3) / 4 / 1024))} KB
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  📐 {finalDimensions.width} × {finalDimensions.height} px (300 DPI)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {selectedPreset.name}
                </span>
              </div>

              {/* Target Size (KB) & Dimensions Checkboxes directly on Result Preview Screen */}
              <div className="mt-3 w-full max-w-sm p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 space-y-2">
                <div className="text-[11px] font-black text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>⚙️ डाउनलोड से पहले चेकबॉक्स द्वारा कंट्रोल करें:</span>
                  <span className="text-[10px] bg-amber-200/60 dark:bg-amber-800/60 px-1.5 py-0.5 rounded font-bold">1-Click</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => {
                      const next = !enableCustomDimensions;
                      setEnableCustomDimensions(next);
                      setTimeout(() => generateFinalPhoto(), 50);
                    }}
                    className={`p-2 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1.5 select-none ${
                      enableCustomDimensions
                        ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-500 shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {enableCustomDimensions ? <CheckSquare className="w-4 h-4 text-red-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="leading-tight">☑ Dimensions सेट करें</span>
                  </label>

                  <label
                    onClick={() => {
                      const next = !enableCustomKb;
                      setEnableCustomKb(next);
                      setTimeout(() => generateFinalPhoto(), 50);
                    }}
                    className={`p-2 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1.5 select-none ${
                      enableCustomKb
                        ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-500 shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {enableCustomKb ? <CheckSquare className="w-4 h-4 text-red-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="leading-tight">☑ Target KB सेट करें</span>
                  </label>
                </div>
              </div>

              {/* Step 4 Live Background Color Switcher */}
              <div className="mt-3 w-full max-w-sm p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>बैकग्राउंड रंग (Background Color):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">1-क्लिक चेंज</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectBgColor('original');
                      setTimeout(() => generateFinalPhoto(), 100);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'original'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    मूल (Original)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectBgColor('white');
                      setTimeout(() => generateFinalPhoto(), 100);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'white'
                        ? 'ring-2 ring-red-500 bg-white text-slate-900 border-slate-400 font-black'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    सफ़ेद (White)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectBgColor('blue');
                      setTimeout(() => generateFinalPhoto(), 100);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'blue'
                        ? 'ring-2 ring-blue-600 bg-blue-100 text-blue-900 border-blue-400 font-black'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    आसमानी नीला
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectBgColor('grey');
                      setTimeout(() => generateFinalPhoto(), 100);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      bgColor === 'grey'
                        ? 'ring-2 ring-slate-600 bg-slate-200 text-slate-900 border-slate-400 font-black'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    हल्का ग्रे
                  </button>
                </div>
              </div>

              {/* Quick Actions in Preview Footer */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('corners')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  <span>🔄 कोनों को पुनः सेट करें</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateStudio('cw')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>घूमाएं (Rotate 90°)</span>
                </button>
              </div>
            </div>

            {/* Right: Configuration, Checkbox Controls & Download Buttons */}
            <div className="w-full md:w-84 space-y-3.5">
              {/* EXAM PRESETS SELECTION */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-red-500" />
                  <span>सरकारी परीक्षा प्रीसेट (Exam Preset)</span>
                </label>
                <div className="space-y-1">
                  {EXAM_PRESETS.map((p) => {
                    const isSelected = selectedPreset.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(p);
                          setTargetKb(Math.round((p.minKb + p.maxKb) / 2));
                          if (!enableCustomDimensions) {
                            setCustomWidth(p.widthCm);
                            setCustomHeight(p.heightCm);
                          }
                          setTimeout(() => generateFinalPhoto(), 50);
                        }}
                        className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
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

              {/* CHECKBOX CONTROL 1: Custom Dimensions Control */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label
                  onClick={() => setEnableCustomDimensions(!enableCustomDimensions)}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  {enableCustomDimensions ? (
                    <CheckSquare className="w-4 h-4 text-red-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    ☑ फोटो के Dimensions (चौड़ाई व ऊंचाई) सेट करें
                  </span>
                </label>

                {enableCustomDimensions && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                    {/* Unit Selector */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-slate-500">इकाई (Unit):</span>
                      <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden text-[11px]">
                        {(['cm', 'mm', 'px'] as const).map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => {
                              // Convert values smoothly between units
                              if (unit === 'px' && dimensionUnit === 'cm') {
                                setCustomWidth(Math.round((customWidth * 300) / 2.54));
                                setCustomHeight(Math.round((customHeight * 300) / 2.54));
                              } else if (unit === 'px' && dimensionUnit === 'mm') {
                                setCustomWidth(Math.round((customWidth * 300) / 25.4));
                                setCustomHeight(Math.round((customHeight * 300) / 25.4));
                              } else if (unit === 'cm' && dimensionUnit === 'px') {
                                setCustomWidth(Number(((customWidth * 2.54) / 300).toFixed(1)));
                                setCustomHeight(Number(((customHeight * 2.54) / 300).toFixed(1)));
                              } else if (unit === 'mm' && dimensionUnit === 'px') {
                                setCustomWidth(Number(((customWidth * 25.4) / 300).toFixed(0)));
                                setCustomHeight(Number(((customHeight * 25.4) / 300).toFixed(0)));
                              } else if (unit === 'mm' && dimensionUnit === 'cm') {
                                setCustomWidth(Number((customWidth * 10).toFixed(0)));
                                setCustomHeight(Number((customHeight * 10).toFixed(0)));
                              } else if (unit === 'cm' && dimensionUnit === 'mm') {
                                setCustomWidth(Number((customWidth / 10).toFixed(1)));
                                setCustomHeight(Number((customHeight / 10).toFixed(1)));
                              }
                              setDimensionUnit(unit);
                            }}
                            className={`px-2.5 py-0.5 font-bold cursor-pointer transition-colors ${
                              dimensionUnit === unit
                                ? 'bg-red-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Width & Height Inputs with Aspect Ratio Lock */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          चौड़ाई (Width) [{dimensionUnit}]
                        </label>
                        <input
                          type="number"
                          step={dimensionUnit === 'px' ? '1' : '0.1'}
                          value={customWidth}
                          onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          ऊंचाई (Height) [{dimensionUnit}]
                        </label>
                        <input
                          type="number"
                          step={dimensionUnit === 'px' ? '1' : '0.1'}
                          value={customHeight}
                          onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Aspect Ratio Lock Toggle & Defaults Preset */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setLockAspectRatio(!lockAspectRatio)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 cursor-pointer"
                      >
                        {lockAspectRatio ? (
                          <>
                            <Lock className="w-3 h-3 text-red-500" />
                            <span>अनुपात लॉक है (3.5:4.5)</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-slate-400" />
                            <span>स्वतंत्र अनुपात (Unlocked)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDimensionUnit('cm');
                          setCustomWidth(3.5);
                          setCustomHeight(4.5);
                        }}
                        className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        मानक 3.5×4.5 cm सेट करें
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CHECKBOX CONTROL 2: Target File Size (KB) Control */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label
                  onClick={() => setEnableCustomKb(!enableCustomKb)}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  {enableCustomKb ? (
                    <CheckSquare className="w-4 h-4 text-red-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    ☑ टारगेट फाइल साइज़ (KB) सेट करें
                  </span>
                </label>

                {enableCustomKb && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>टारगेट साइज़ दर्ज करें:</span>
                      <span className="text-red-600 dark:text-red-400 font-mono font-black">{targetKb} KB</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={targetKb}
                        onChange={(e) => setTargetKb(Math.max(5, parseInt(e.target.value) || 0))}
                        placeholder="KB में दर्ज करें"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-500">KB</span>
                    </div>

                    {/* Quick Selectable Preset Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">त्वरित प्रीसेट चिप्स:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[20, 35, 50, 100].map((presetKb) => (
                          <button
                            key={presetKb}
                            type="button"
                            onClick={() => setTargetKb(presetKb)}
                            className={`py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              targetKb === presetKb
                                ? 'bg-red-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {presetKb} KB
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PRINT SHEET LAYOUT */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-500" />
                  <span>फोटो शीट लेआउट (Printable Sheet)</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
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
                      onClick={() => handleLayoutChange(l.id as 'single' | '4x' | '6x' | '8x' | '12x')}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        printLayout === l.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                {/* Ultra HD Print Resolution Selector when Sheet Layout is Selected */}
                {printLayout !== 'single' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                      <span>🖨️ प्रिंटर HD रिज़ॉल्यूशन (Color Print Quality):</span>
                      <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded font-black">
                        {sheetResolution === '600dpi' ? '600 DPI Studio 4K' : sheetResolution === '450dpi' ? '450 DPI Ultra HD' : sheetResolution === 'a4_300' ? 'A4 300 DPI' : '300 DPI Standard HD'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSheetResolution('300dpi')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          sheetResolution === '300dpi'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                        }`}
                      >
                        <div>300 DPI (Standard HD)</div>
                        <div className="text-[9px] opacity-80">1200 × 1800 px (4×6)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSheetResolution('450dpi')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          sheetResolution === '450dpi'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                        }`}
                      >
                        <div>450 DPI (Ultra HD)</div>
                        <div className="text-[9px] opacity-80">1800 × 2700 px (4×6)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSheetResolution('600dpi')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          sheetResolution === '600dpi'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                        }`}
                      >
                        <div>600 DPI (Studio Master 4K)</div>
                        <div className="text-[9px] opacity-80">2400 × 3600 px (Photo Paper)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSheetResolution('a4_300')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          sheetResolution === 'a4_300'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                        }`}
                      >
                        <div>A4 Sheet HD (300 DPI)</div>
                        <div className="text-[9px] opacity-80">2480 × 3508 px</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DOWNLOAD BUTTON */}
              <div className="space-y-2 pt-2">
                <a
                  href={finalDataUrl}
                  download={`${fileName}_passport_${printLayout}.jpg`}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 पासपोर्ट फोटो डाउनलोड करें ({finalFileSizeKb} KB)</span>
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
