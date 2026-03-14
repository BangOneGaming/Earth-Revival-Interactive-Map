/**
 * Image Editor for Upload Preview
 * Version 3.0 - Mobile Touch Optimized
 * 
 * FEATURES:
 * - Mobile: NO handles, pinch to resize, touch anywhere to move
 * - Desktop: Full handles for move & resize
 * - Clean console (only touch gesture logs)
 */

const ImageEditor = (function() {
  'use strict';

  let currentEditor = null;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let selectedElement = null;
  let dragOffset = { x: 0, y: 0 };
  let isResizing = false;
  let isDragging = false;
  let dragStartPos = { x: 0, y: 0 };
  let hasMoved = false;

  // Global active drag (fires even when cursor leaves element)
  let activeDragAnnotation = null;
  let activeResizeAnnotation = null;
  let activeResizeHandle = null;   // 'nw'|'ne'|'sw'|'se' for circle, null for text
  let resizeStartClientX = 0;
  let resizeStartClientY = 0;
  let resizeStartValue = 0;  // fontSize for text
  let resizeStartRx = 0;
  let resizeStartRy = 0;
  let resizeStartX = 0;
  let resizeStartY = 0;

  // Pinch gesture tracking
  let isPinching = false;
  let initialPinchDistance = 0;
  let initialRadius = 0;
  let initialFontSize = 0;
  let pinchIndicator = null;
  
  // Device detection
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Undo/Redo stacks
  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 50;

  const CONFIG = {
    brushColor: '#FF3B30',
    brushWidth: 3,
    textColor: '#ffffff',
    textSize: 20,
    circleColor: '#FF3B30',
    circleRadius: 50,   // initial half-size
    circleStrokeWidth: 3,
    minCircleRadius: 15,
    maxCircleRadius: 400,
    minFontSize: 8,
    maxFontSize: 120,
    resizeHandleSize: 14,
    touchSlopDistance: 4
  };

  // ==========================================
  // MODAL CREATION
  // ==========================================

  function createEditorModal(imageFile, markerKey, callback) {
    const modal = document.createElement('div');
    modal.className = 'image-editor-modal';
    modal.innerHTML = `
      <div class="image-editor-backdrop" onclick="ImageEditor.cancel()"></div>
      <div class="image-editor-container">
        <div class="image-editor-header">
          <h3>✏️ Edit Image Before Upload</h3>
          <button class="editor-close-btn" onclick="ImageEditor.cancel()">✕</button>
        </div>

        <div class="image-editor-toolbar">
          <button class="tool-btn" data-tool="none" title="Select/Move">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v9.5l2.5-2.5 1.5 3.5 1.5-.6-1.5-3.4H11L4 2z"/></svg>
            <span class="tool-label">Select</span>
          </button>
          <button class="tool-btn active" data-tool="brush" title="Draw">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13c1-1 2.5-1 3.5 0s2.5 1 3-.5L12 4l-2-2-4.5 4.5C4 7.5 3 8 2 9s-1 3 0 4z"/><path d="M10 4l2 2"/></svg>
            <span class="tool-label">Brush</span>
          </button>
          <button class="tool-btn" data-tool="text" title="Add Text">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M8 4v9M6 13h4"/></svg>
            <span class="tool-label">Text</span>
          </button>
          <button class="tool-btn" data-tool="circle" title="Add Circle">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="8" cy="8" rx="5.5" ry="5.5"/></svg>
            <span class="tool-label">Circle</span>
          </button>

          <div class="toolbar-divider"></div>

          <button class="tool-btn" onclick="ImageEditor.undo()" title="Undo (Ctrl+Z)">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7H10a3 3 0 0 1 0 6H8"/><path d="M3 7l3-3M3 7l3 3"/></svg>
            <span class="tool-label">Undo</span>
          </button>
          <button class="tool-btn" onclick="ImageEditor.redo()" title="Redo (Ctrl+Y)">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 7H6a3 3 0 0 0 0 6h2"/><path d="M13 7l-3-3M13 7l-3 3"/></svg>
            <span class="tool-label">Redo</span>
          </button>

          <div class="toolbar-divider"></div>

          <button class="tool-btn danger" onclick="ImageEditor.deleteSelected()" title="Delete Selected">
            <svg class="tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4"/><path d="M7 7v4M9 7v4"/></svg>
            <span class="tool-label">Delete</span>
          </button>
        </div>

        <div class="image-editor-canvas-wrapper">
          <canvas class="image-editor-canvas"></canvas>
          <div class="editor-annotations"></div>
        </div>

        <div class="image-editor-footer">
          <button class="editor-btn cancel-btn" onclick="ImageEditor.cancel()">
            Cancel
          </button>
          <button class="editor-btn confirm-btn" onclick="ImageEditor.confirm()">
            ✅ Confirm & Upload
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    currentEditor = {
      modal,
      imageFile,
      markerKey,
      callback,
      canvas: modal.querySelector('.image-editor-canvas'),
      ctx: null,
      annotationsLayer: modal.querySelector('.editor-annotations'),
      confirmBtn: modal.querySelector('.confirm-btn'),
      originalImage: null,
      currentTool: 'brush',
      annotations: [],
      paths: []
    };

    undoStack = [];
    redoStack = [];

    initializeCanvas();
    attachToolbarEvents();
    attachKeyboardShortcuts();
    
    setTimeout(() => modal.classList.add('active'), 10);
  }

  // ==========================================
  // CANVAS INITIALIZATION
  // ==========================================

function initializeCanvas() {
  const { canvas, imageFile } = currentEditor;
  const ctx = canvas.getContext('2d');
  currentEditor.ctx = ctx;

  const img = new Image();
  const objectUrl = URL.createObjectURL(imageFile);

  img.onload = () => {
    URL.revokeObjectURL(objectUrl);

    currentEditor.originalImage = img;

    // 🎯 FIXED CANVAS SIZE for consistent coordinates across devices
    const maxWidth = 1000;
    const maxHeight = 600;
    const minWidth = 800; // 🔥 NEW: Minimum canvas width
    
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }
    
    // 🔥 Scale UP if too small (mobile images)
    if (width < minWidth) {
      const ratio = minWidth / width;
      width *= ratio;
      height *= ratio;
    }
    
    // Cap at maxHeight after upscaling
    if (height > maxHeight) {
      const ratio = maxHeight / height;
      width *= ratio;
      height *= ratio;
    }

    canvas.width = width;
canvas.height = height;

// 🔥 TAMBAHKAN INI - Store canvas scale
currentEditor.canvasScale = {
  x: width / img.naturalWidth,
  y: height / img.naturalHeight
};

    // 🛡️ ANDROID SAFE DRAW
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();

    attachCanvasEvents();
    
    // 🖼️ Log canvas dimensions AFTER canvas is attached to DOM
    const rect = canvas.getBoundingClientRect();
    
    saveState();
  };

  img.onerror = (e) => {
    console.error('❌ Image load failed', e);
    URL.revokeObjectURL(objectUrl);
  };

  img.src = objectUrl;
}

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================

  function attachKeyboardShortcuts() {
    const handler = (e) => {
      if (!currentEditor) return;

      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      else if (e.key === 'Delete' && selectedElement) {
        e.preventDefault();
        deleteSelected();
      }
    };

    document.addEventListener('keydown', handler);
    currentEditor.keyboardHandler = handler;
  }

  function removeKeyboardShortcuts() {
    if (currentEditor && currentEditor.keyboardHandler) {
      document.removeEventListener('keydown', currentEditor.keyboardHandler);
    }
  }

  // ==========================================
  // TOOLBAR EVENTS
  // ==========================================

  function attachToolbarEvents() {
    const toolButtons = currentEditor.modal.querySelectorAll('.tool-btn[data-tool]');
    
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        
        if (tool === 'circle') {
          addCircle();
          setTool('none');
          toolButtons.forEach(b => b.classList.remove('active'));
          toolButtons[0].classList.add('active');
        } else if (tool === 'text') {
          addText();
          setTool('none');
          toolButtons.forEach(b => b.classList.remove('active'));
          toolButtons[0].classList.add('active');
        } else {
          setTool(tool);
          toolButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  function setTool(tool) {
    currentEditor.currentTool = tool;
    const { canvas } = currentEditor;
    
    const cursors = {
      'none': 'default',
      'brush': 'crosshair',
      'text': 'text',
      'circle': 'crosshair'
    };
    canvas.style.cursor = cursors[tool] || 'default';
    
    deselectAll();
  }

  // ==========================================
  // CANVAS EVENTS
  // ==========================================

  function attachCanvasEvents() {
    const { canvas } = currentEditor;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Global: drag/resize continue even when cursor leaves element
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    // Wrapper mousedown: drag selected element from anywhere inside wrapper
    const wrapper = canvas.closest('.image-editor-canvas-wrapper');
    if (wrapper) {
      wrapper.addEventListener('mousedown', handleWrapperMouseDown);
      currentEditor._wrapper = wrapper;
    }
  }

  function detachCanvasEvents() {
    if (!currentEditor) return;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    if (currentEditor._wrapper) {
      currentEditor._wrapper.removeEventListener('mousedown', handleWrapperMouseDown);
    }
  }

  // Click anywhere inside wrapper while element selected -> drag that element
  function handleWrapperMouseDown(e) {
    if (!selectedElement) return;
    if (e.target.classList.contains('editor-resize-handle')) return;
    if (selectedElement.element.contains(e.target) || e.target === selectedElement.element) return;
    if (currentEditor.currentTool !== 'none') return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    startAnnotationDrag(coords.x, coords.y, selectedElement);
  }

  // 👆 VISUAL: Touch ripple effect
  function createTouchRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border: 3px solid rgba(33, 150, 243, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999998;
      transform: translate(-50%, -50%);
      animation: ripple-expand 0.6s ease-out;
    `;
    
    if (!document.querySelector('#ripple-animation')) {
      const style = document.createElement('style');
      style.id = 'ripple-animation';
      style.textContent = `
        @keyframes ripple-expand {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 60px;
            height: 60px;
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    currentEditor.annotationsLayer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
  
  // 🤏 PINCH INDICATOR
  function showPinchIndicator() {
    if (!selectedElement) return;
    
    pinchIndicator = document.createElement('div');
    pinchIndicator.className = 'pinch-indicator';
    pinchIndicator.textContent = '🤏 Pinch to Resize';
    selectedElement.element.appendChild(pinchIndicator);
  }
  
  function updatePinchIndicator(radius) {
    if (pinchIndicator) {
      pinchIndicator.textContent = `🤏 ${Math.round(radius)}px`;
    }
  }
  
  function hidePinchIndicator() {
    if (pinchIndicator) {
      pinchIndicator.remove();
      pinchIndicator = null;
    }
  }
// 🎯 Helper: Convert screen coordinates to canvas coordinates
function getCanvasCoordinates(clientX, clientY) {
  const rect = currentEditor.canvas.getBoundingClientRect();
  const scaleX = currentEditor.canvas.width / rect.width;
  const scaleY = currentEditor.canvas.height / rect.height;
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
    scaleX,
    scaleY
  };
}

function handleMouseDown(e) {
  const coords = getCanvasCoordinates(e.clientX, e.clientY);

  switch (currentEditor.currentTool) {
    case 'brush':
      startDrawing(coords.x, coords.y);
      break;
    case 'none':
      selectAnnotation(coords.x, coords.y);
      break;
  }
}

function handleGlobalMouseMove(e) {
  if (!currentEditor) return;

  // Active resize
  if (activeResizeAnnotation) {
    const ann = activeResizeAnnotation;
    const dx = e.clientX - resizeStartClientX;
    const dy = e.clientY - resizeStartClientY;

    if (ann.type === 'circle') {
      const canvasEl = currentEditor.canvas;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;
      // SE handle: drag right/down expands, drag left/up shrinks
      const cdx = dx * scaleX;
      const cdy = dy * scaleY;
      ann.rx = Math.max(CONFIG.minCircleRadius, Math.min(CONFIG.maxCircleRadius, resizeStartRx + cdx / 2));
      ann.ry = Math.max(CONFIG.minCircleRadius, Math.min(CONFIG.maxCircleRadius, resizeStartRy + cdy / 2));
      ann.radius = Math.max(ann.rx, ann.ry);
      updateCirclePosition(ann);

    } else if (ann.type === 'text') {
      const delta = dx;
      const newSize = Math.max(CONFIG.minFontSize, Math.min(CONFIG.maxFontSize, Math.round(resizeStartValue + delta * 0.3)));
      ann.size = newSize;
      updateTextPosition(ann);
    }
    return;
  }

  // Active drag
  if (activeDragAnnotation) {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!hasMoved) {
      const dx = coords.x - dragStartPos.x;
      const dy = coords.y - dragStartPos.y;
      if (Math.sqrt(dx*dx + dy*dy) > CONFIG.touchSlopDistance) hasMoved = true;
    }
    if (hasMoved) {
      dragAnnotation(coords.x, coords.y);
    }
    return;
  }

  // Brush drawing
  if (currentEditor.currentTool === 'brush' && isDrawing) {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    draw(coords.x, coords.y);
  }
}

function handleGlobalMouseUp() {
  if (activeResizeAnnotation) {
    saveState();
    activeResizeAnnotation = null;
    activeResizeHandle = null;
  }
  if (activeDragAnnotation) {
    stopDragging();
    activeDragAnnotation = null;
  }
  if (isDrawing) stopDrawing();
  isDragging = false;
  hasMoved = false;
}

  function handleMouseUp() {
    // kept for compatibility — actual cleanup in handleGlobalMouseUp
  }

  function handleTouchStart(e) {
    e.preventDefault();
    
    // 🤏 PINCH GESTURE: 2 fingers = resize (circle & text)
    if (e.touches.length === 2 && selectedElement) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      if (selectedElement.type === 'circle') {
        initialRadius = selectedElement.radius;
        // store initial rx/ry for proportional pinch
        selectedElement._pinchRx = selectedElement.rx || selectedElement.radius;
        selectedElement._pinchRy = selectedElement.ry || selectedElement.radius;
      } else if (selectedElement.type === 'text') {
        initialFontSize = selectedElement.size;
      }
      isPinching = true;
      showPinchIndicator();
      return;
    }
    
// 👆 SINGLE TOUCH
const touch = e.touches[0];
const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

createTouchRipple(touch.clientX - currentEditor.canvas.getBoundingClientRect().left, 
                  touch.clientY - currentEditor.canvas.getBoundingClientRect().top);

// If object is selected, touch anywhere = move
if (selectedElement && currentEditor.currentTool === 'none') {
  startAnnotationDrag(coords.x, coords.y, selectedElement);
  return;
}

// Try to select annotation
let touched = false;
for (let i = currentEditor.annotations.length - 1; i >= 0; i--) {
  const ann = currentEditor.annotations[i];
  if (isPointInAnnotation(coords.x, coords.y, ann)) {
    selectElement(ann);
    startAnnotationDrag(coords.x, coords.y, ann);
    touched = true;
    break;
  }
}

if (!touched && currentEditor.currentTool === 'brush') {
  startDrawing(coords.x, coords.y);
}
}  

  function handleTouchMove(e) {
    e.preventDefault();
    if (!currentEditor) return;

    // 🤏 PINCH RESIZE (circle & text)
    if (e.touches.length === 2 && isPinching && selectedElement) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = currentDistance / initialPinchDistance;

      if (selectedElement.type === 'circle') {
        // Pinch = locked ratio: scale both rx and ry proportionally
        const newRx = Math.max(CONFIG.minCircleRadius, Math.min(CONFIG.maxCircleRadius, (selectedElement._pinchRx || initialRadius) * scale));
        const newRy = Math.max(CONFIG.minCircleRadius, Math.min(CONFIG.maxCircleRadius, (selectedElement._pinchRy || initialRadius) * scale));
        selectedElement.rx = newRx;
        selectedElement.ry = newRy;
        selectedElement.radius = Math.max(newRx, newRy);
        updateCirclePosition(selectedElement);
        updatePinchIndicator(Math.round((newRx + newRy) / 2));
      } else if (selectedElement.type === 'text') {
        const newSize = Math.max(CONFIG.minFontSize, Math.min(CONFIG.maxFontSize, Math.round(initialFontSize * scale)));
        selectedElement.size = newSize;
        updateTextPosition(selectedElement);
        updatePinchIndicator(newSize);
      }
      return;
    }

// 👆 SINGLE TOUCH MOVE
const touch = e.touches[0];
const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

if (currentEditor.currentTool === 'brush' && isDrawing) {
  draw(coords.x, coords.y);
} else if (activeDragAnnotation) {
  if (!hasMoved) {
    const dx = coords.x - dragStartPos.x;
    const dy = coords.y - dragStartPos.y;
    if (Math.sqrt(dx*dx + dy*dy) > CONFIG.touchSlopDistance) hasMoved = true;
  }
  if (hasMoved) dragAnnotation(coords.x, coords.y);
}
}  

  function handleTouchEnd(e) {
    e.preventDefault();
    
    if (isPinching) {
      isPinching = false;
      hidePinchIndicator();
      saveState();
    }

    if (activeDragAnnotation) {
      stopDragging();
      activeDragAnnotation = null;
    }
    if (isDrawing) stopDrawing();
    isDragging = false;
    hasMoved = false;
  }

  // ==========================================
  // DRAWING FUNCTIONS
  // ==========================================

  function startDrawing(x, y) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    
    currentEditor.paths.push({
      type: 'path',
      points: [{ x, y }],
      color: CONFIG.brushColor,
      width: CONFIG.brushWidth
    });
  }

  function draw(x, y) {
    const { ctx } = currentEditor;
    const currentPath = currentEditor.paths[currentEditor.paths.length - 1];
    
    currentPath.points.push({ x, y });
    
    ctx.strokeStyle = CONFIG.brushColor;
    ctx.lineWidth = CONFIG.brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    isDrawing = false;
    saveState();
  }

  // ==========================================
  // TEXT ANNOTATIONS
  // ==========================================

function addText() {
    const { canvas } = currentEditor;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const el = document.createElement('div');
    el.className = 'editor-text-annotation';
    // Mobile: start non-editable to prevent keyboard on drag; enable on double-tap
    el.contentEditable = isMobile ? 'false' : 'true';
    el.dataset.placeholder = 'Enter text...';
    el.textContent = 'Enter text...';
    el.style.pointerEvents = 'auto';
    el.style.textAlign = 'center';
    el.style.color = CONFIG.textColor;
    el.style.whiteSpace = 'nowrap';
    el.style.wordBreak = 'normal';
    el.style.lineHeight = '1.4';
    el.style.padding = '0'; // no padding — keeps visual position = wrapper position
    el.style.opacity = '0.5'; // dimmed while placeholder
    el.style.textShadow = `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`;

    // Resize handle (desktop only — mobile uses pinch)
    let resizeHandle = null;
    if (!isMobile) {
      resizeHandle = document.createElement('div');
      resizeHandle.className = 'editor-resize-handle';
      resizeHandle.style.cssText = `display:none;position:absolute;bottom:-7px;right:-7px;width:${CONFIG.resizeHandleSize}px;height:${CONFIG.resizeHandleSize}px;background:#378ADD;border:2px solid #fff;border-radius:3px;cursor:se-resize;z-index:15;pointer-events:auto;`;
    }

    // Wrap text + handle in a container
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-text-wrapper';
    wrapper.style.cssText = 'position:absolute;pointer-events:none;';
    wrapper.appendChild(el);
    if (resizeHandle) wrapper.appendChild(resizeHandle);

    const ann = {
      type: 'text',
      element: wrapper,
      textEl: el,
      resizeHandle: resizeHandle,
      x: centerX,
      y: centerY,
      text: 'Enter text...',
      color: CONFIG.textColor,
      size: CONFIG.textSize,
      isPlaceholder: true
    };

    // ── Placeholder logic ──────────────────────────────────
    function applyPlaceholderStyle(active) {
      el.style.opacity = active ? '0.5' : '1';
    }

    el.addEventListener('focus', () => {
      // Only allow focus when contentEditable is truly enabled
      if (el.contentEditable !== 'true') { el.blur(); return; }
      if (ann.isPlaceholder) {
        el.textContent = '';
        ann.isPlaceholder = false;
        applyPlaceholderStyle(false);
      }
      activeDragAnnotation = null;
    });

    el.addEventListener('blur', () => {
      const val = el.textContent.trim();
      if (!val) {
        el.textContent = 'Enter text...';
        ann.isPlaceholder = true;
        applyPlaceholderStyle(true);
      }
      // Lock editing again on mobile after done
      if (isMobile) el.contentEditable = 'false';
      updateTextPosition(ann);
      saveState();
    });

    el.addEventListener('input', () => {
      ann.isPlaceholder = false;
      applyPlaceholderStyle(false);
      updateTextPosition(ann);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { el.blur(); }
      // Allow Enter for newline — do not prevent
    });
    // ────────────────────────────────────────────────────────

    // Desktop click: first click = select+drag, second click = edit cursor inside text
    let lastTap = 0;
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (selectedElement === ann) {
        // Already selected: allow browser to position cursor for editing
        // Don't start drag so user can click inside text normally
        return;
      }
      // First click: select and drag
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    });

    // Touch: single tap = select+drag, double-tap = enter edit mode (keyboard)
    el.addEventListener('touchstart', (e) => {
      e.preventDefault(); // ALWAYS prevent default — blocks unwanted focus/keyboard
      e.stopPropagation();
      const now = Date.now();
      const isDoubleTap = (now - lastTap) < 300;
      lastTap = now;

      if (isDoubleTap && selectedElement === ann) {
        // Double-tap: unlock editing + open keyboard
        el.contentEditable = 'true';
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(range); }
        return;
      }

      // Single tap: ensure editing locked, then select+drag
      if (isMobile) el.contentEditable = 'false';
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const touch = e.touches[0];
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    }, { passive: false });

    // Resize handle (desktop only)
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        selectElement(ann);
        activeResizeAnnotation = ann;
        resizeStartClientX = e.clientX;
        resizeStartValue = ann.size;
      });
    }

    updateTextPosition(ann);
    currentEditor.annotations.push(ann);
    currentEditor.annotationsLayer.appendChild(wrapper);

    // Auto-focus for immediate typing on desktop
    setTimeout(() => {
      selectElement(ann);
      if (!isMobile) {
        el.focus();
        // Select placeholder text so first keystroke replaces it
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(range); }
      }
    }, 30);
  }

  // ==========================================
  // CIRCLE ANNOTATIONS
  // ==========================================

  function addCircle() {
    const { canvas } = currentEditor;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const wrapper = document.createElement('div');
    wrapper.className = 'editor-circle-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.pointerEvents = 'none';

    const circle = document.createElement('div');
    circle.className = 'editor-circle-annotation';
    circle.style.pointerEvents = 'auto';
    wrapper.appendChild(circle);

    // Single SE handle (desktop only)
    let handles = {};
    if (!isMobile) {
      const h = document.createElement('div');
      h.className = 'editor-circle-handle editor-circle-handle-se';
      h.dataset.pos = 'se';
      h.style.cssText = `display:none;position:absolute;bottom:-7px;right:-7px;width:${CONFIG.resizeHandleSize}px;height:${CONFIG.resizeHandleSize}px;background:#c8962a;border:2px solid #f0c060;border-radius:2px;z-index:15;pointer-events:auto;cursor:se-resize;`;
      wrapper.appendChild(h);
      handles['se'] = h;
    }

    const ann = {
      type: 'circle',
      element: wrapper,
      circle: circle,
      handles: handles,
      resizeHandle: null,  // compat
      moveHandle: null,
      x: centerX,
      y: centerY,
      rx: CONFIG.circleRadius,  // independent x-radius
      ry: CONFIG.circleRadius,  // independent y-radius
      radius: CONFIG.circleRadius, // kept for pinch compat
      color: CONFIG.circleColor,
      strokeWidth: CONFIG.circleStrokeWidth
    };

    updateCirclePosition(ann);
    currentEditor.annotations.push(ann);
    currentEditor.annotationsLayer.appendChild(wrapper);

    // Click on circle = select + drag
    circle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    });

    // Touch on circle
    circle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const touch = e.touches[0];
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    }, { passive: false });

    // 4-corner resize (desktop only)
    if (!isMobile) {
      Object.entries(handles).forEach(([pos, h]) => {
        h.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e.preventDefault();
          selectElement(ann);
          activeResizeAnnotation = ann;
          activeResizeHandle = pos;
          resizeStartClientX = e.clientX;
          resizeStartClientY = e.clientY;
          resizeStartRx = ann.rx;
          resizeStartRy = ann.ry;
          resizeStartX = ann.x;
          resizeStartY = ann.y;
        });
      });
    }

    setTimeout(() => selectElement(ann), 10);
    saveState();
  }

function updateCirclePosition(annotation) {
    const { x, y, color, strokeWidth } = annotation;
    const rx = annotation.rx || annotation.radius || CONFIG.circleRadius;
    const ry = annotation.ry || annotation.radius || CONFIG.circleRadius;
    const { element, circle, handles } = annotation;

    const canvasEl = currentEditor.canvas;
    const rect = canvasEl.getBoundingClientRect();
    const wrapperRect = currentEditor.annotationsLayer.getBoundingClientRect();

    const scaleX = rect.width / canvasEl.width;
    const scaleY = rect.height / canvasEl.height;

    const offsetX = rect.left - wrapperRect.left;
    const offsetY = rect.top - wrapperRect.top;

    const screenX = x * scaleX + offsetX;
    const screenY = y * scaleY + offsetY;
    const screenRx = rx * scaleX;
    const screenRy = ry * scaleY;

    element.style.left   = (screenX - screenRx) + 'px';
    element.style.top    = (screenY - screenRy) + 'px';
    element.style.width  = (screenRx * 2) + 'px';
    element.style.height = (screenRy * 2) + 'px';

    circle.style.borderColor = color;
    circle.style.borderWidth = (strokeWidth * Math.min(scaleX, scaleY)) + 'px';

    // Show/hide 4 corner handles
    const show = (annotation === selectedElement);
    if (handles && typeof handles === 'object') {
      Object.values(handles).forEach(h => { if (h) h.style.display = show ? 'block' : 'none'; });
    }
    // compat: single resizeHandle
    if (annotation.resizeHandle) annotation.resizeHandle.style.display = show ? 'block' : 'none';
}
// Update text visual position from canvas coordinates
  function updateTextPosition(annotation) {
    const { x, y, size } = annotation;
    const { element, textEl, resizeHandle } = annotation;

    const canvasEl = currentEditor.canvas;
    const rect = canvasEl.getBoundingClientRect();
    const wrapperRect = currentEditor.annotationsLayer.getBoundingClientRect();

    const scaleX = rect.width / canvasEl.width;
    const scaleY = rect.height / canvasEl.height;

    // Offset: canvas top-left relative to annotationsLayer top-left
    const offsetX = rect.left - wrapperRect.left;
    const offsetY = rect.top - wrapperRect.top;

    // Screen position inside annotationsLayer
    const screenX = x * scaleX + offsetX;
    const screenY = y * scaleY + offsetY;
    const screenFontSize = Math.max(8, size * Math.min(scaleX, scaleY));

    const displayEl = textEl || element;
    displayEl.style.fontSize = screenFontSize + 'px';
    displayEl.style.whiteSpace = 'nowrap';
    displayEl.style.display = 'inline-block';
    displayEl.style.width = 'auto';
    displayEl.style.maxWidth = 'none';

    element.style.position = 'absolute';
    element.style.width = 'max-content';
    element.style.maxWidth = 'none';
    element.style.left = screenX + 'px';
    element.style.top  = screenY + 'px';
    element.style.transform = 'translateX(-50%)';

    if (resizeHandle) {
      resizeHandle.style.display = (annotation === selectedElement) ? 'block' : 'none';
    }

    // Store canvas-space export coords — derived purely from ann.x/y,
    // so they're always consistent regardless of scroll or viewport state.
    // exportX = ann.x (center), exportY = ann.y (top) — already in canvas pixels.
    annotation.exportX = x;
    annotation.exportY = y;
}
  
  function startAnnotationDrag(x, y, annotation) {
    isDragging = true;
    hasMoved = false;
    dragStartPos = { x, y };
    activeDragAnnotation = annotation;
    dragOffset.x = x - annotation.x;
    dragOffset.y = y - annotation.y;
  }

  function resizeCircle(mouseX, mouseY) {
    // Legacy stub — pinch is handled in handleTouchMove directly
  }

  function stopResizing() {
    isResizing = false;
  }

  // ==========================================
  // SELECTION & DRAGGING
  // ==========================================

  function selectAnnotation(x, y) {
    for (let i = currentEditor.annotations.length - 1; i >= 0; i--) {
      const ann = currentEditor.annotations[i];
      if (isPointInAnnotation(x, y, ann)) {
        selectElement(ann);
        startAnnotationDrag(x, y, ann);
        return;
      }
    }
    deselectAll();
  }

  function checkHandleClick() { return false; }

  function isPointInAnnotation(x, y, annotation) {
    // 🎯 Check if point (in canvas coordinates) is inside annotation
    
    if (annotation.type === 'circle') {
      // Circle: check distance from center
      const dx = x - annotation.x;
      const dy = y - annotation.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= annotation.radius;
      
    } else if (annotation.type === 'text') {
      // Text: approximate bounding box
      const textWidth = annotation.size * annotation.element.textContent.length * 0.6;
      const textHeight = annotation.size * 1.2;
      
      const topY = annotation.y - annotation.size * 0.8; // Konversi BASELINE → TOP
return x >= annotation.x && 
       x <= annotation.x + textWidth && 
       y >= topY &&  // Cek dari TOP
       y <= topY + textHeight;
    }
    
    return false;
  }

  function selectElement(annotation) {
    deselectAll();
    selectedElement = annotation;
    annotation.element.classList.add('selected');
    // Wrapper pointer-events auto so resize handle is clickable/touchable
    annotation.element.style.pointerEvents = 'auto';
    if (annotation.resizeHandle) annotation.resizeHandle.style.display = 'block';
    if (annotation.type === 'circle') updateCirclePosition(annotation);
    if (annotation.type === 'text') updateTextPosition(annotation);
  }

  function deselectAll() {
    if (selectedElement) {
      selectedElement.element.classList.remove('selected');
      selectedElement.element.style.pointerEvents = 'none';
      if (selectedElement.resizeHandle) selectedElement.resizeHandle.style.display = 'none';
      // Lock text editing and dismiss keyboard
      if (selectedElement.type === 'text' && selectedElement.textEl) {
        const tel = selectedElement.textEl;
        if (document.activeElement === tel) tel.blur();
        if (isMobile) tel.contentEditable = 'false';
        // Restore placeholder if empty
        const val = tel.textContent.trim();
        if (!val || val === '') {
          tel.textContent = 'Enter text...';
          selectedElement.isPlaceholder = true;
          tel.style.opacity = '0.5';
        }
      }
      selectedElement = null;
    }
  }

function startDragging(x, y, annotation) {
    startAnnotationDrag(x, y, annotation);
  }

function dragAnnotation(x, y) {
    const ann = activeDragAnnotation || selectedElement;
    if (!ann) return;
    ann.x = x - dragOffset.x;
    ann.y = y - dragOffset.y;
    if (ann.type === 'circle') updateCirclePosition(ann);
    else if (ann.type === 'text') updateTextPosition(ann);
  }

  function stopDragging() {
    if (isDragging && hasMoved && !isResizing && !isDrawing) {
      // If a text was in edit mode during drag, lock it and dismiss keyboard
      if (selectedElement && selectedElement.type === 'text' && selectedElement.textEl) {
        const tel = selectedElement.textEl;
        if (document.activeElement === tel) tel.blur();
        if (isMobile) tel.contentEditable = 'false';
      }
      saveState();
    }
    activeDragAnnotation = null;
    isDragging = false;
    hasMoved = false;
  }

  // ==========================================
  // UNDO/REDO SYSTEM
  // ==========================================

  function saveState() {
    if (!currentEditor) return;

    const state = {
      paths: JSON.parse(JSON.stringify(currentEditor.paths)),
      annotations: currentEditor.annotations.map(a => ({
        type: a.type,
        x: a.x,
        y: a.y,
        text: a.isPlaceholder ? '' : (a.textEl ? a.textEl.textContent.trim() : (a.element.textContent || a.text || '').trim()),
        color: a.color,
        size: a.size,
        radius: a.radius,
        rx: a.rx,
        ry: a.ry,
        strokeWidth: a.strokeWidth
      }))
    };

    undoStack.push(state);
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    
    redoStack = [];
  }

  function undo() {
    if (undoStack.length <= 1) return;

    const currentState = undoStack.pop();
    redoStack.push(currentState);
    
    const previousState = undoStack[undoStack.length - 1];
    restoreState(previousState);
  }

  function redo() {
    if (redoStack.length === 0) return;

    const state = redoStack.pop();
    undoStack.push(state);
    restoreState(state);
  }

  function restoreState(state) {
    if (!currentEditor) return;

    const { ctx, canvas, originalImage } = currentEditor;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

// 🔥 FIX ANDROID SCREENSHOT
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    currentEditor.annotations.forEach(a => a.element.remove());
    currentEditor.annotations = [];

    currentEditor.paths = JSON.parse(JSON.stringify(state.paths));

    currentEditor.paths.forEach(path => {
      if (path.points.length < 2) return;
      
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    state.annotations.forEach(a => {
      if (a.type === 'text') {
        addTextFromState(a);
      } else if (a.type === 'circle') {
        addCircleFromState(a);
      }
    });

    deselectAll();
  }

function addTextFromState(data) {
    const el = document.createElement('div');
    el.className = 'editor-text-annotation';
    el.contentEditable = 'false';
    el.textContent = data.text;
    el.style.pointerEvents = 'auto';
    el.style.textAlign = 'center';
    el.style.whiteSpace = 'nowrap';
    el.style.wordBreak = 'normal';
    el.style.lineHeight = '1.4';
    el.style.color = data.color;
    el.style.textShadow = `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`;

    let resizeHandle = null;
    if (!isMobile) {
      resizeHandle = document.createElement('div');
      resizeHandle.className = 'editor-resize-handle';
      resizeHandle.style.cssText = `display:none;position:absolute;bottom:-7px;right:-7px;width:${CONFIG.resizeHandleSize}px;height:${CONFIG.resizeHandleSize}px;background:#378ADD;border:2px solid #fff;border-radius:3px;cursor:se-resize;z-index:15;pointer-events:auto;`;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'editor-text-wrapper';
    wrapper.style.cssText = 'position:absolute;pointer-events:none;';
    wrapper.appendChild(el);
    if (resizeHandle) wrapper.appendChild(resizeHandle);

    const ann = { ...data, element: wrapper, textEl: el, resizeHandle };
    updateTextPosition(ann);
    currentEditor.annotations.push(ann);
    currentEditor.annotationsLayer.appendChild(wrapper);

    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    });

    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation(); e.preventDefault();
        selectElement(ann);
        activeResizeAnnotation = ann;
        resizeStartClientX = e.clientX;
        resizeStartValue = ann.size;
      });
    }
  }

  function addCircleFromState(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-circle-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.pointerEvents = 'none';

    const circle = document.createElement('div');
    circle.className = 'editor-circle-annotation';
    circle.style.pointerEvents = 'auto';
    wrapper.appendChild(circle);

    let handles = {};
    if (!isMobile) {
      const h = document.createElement('div');
      h.className = 'editor-circle-handle editor-circle-handle-se';
      h.dataset.pos = 'se';
      h.style.cssText = `display:none;position:absolute;bottom:-7px;right:-7px;width:${CONFIG.resizeHandleSize}px;height:${CONFIG.resizeHandleSize}px;background:#c8962a;border:2px solid #f0c060;border-radius:2px;z-index:15;pointer-events:auto;cursor:se-resize;`;
      wrapper.appendChild(h);
      handles['se'] = h;
    }

    const ann = {
      ...data,
      element: wrapper,
      circle,
      handles,
      resizeHandle: null,
      moveHandle: null,
      rx: data.rx || data.radius || CONFIG.circleRadius,
      ry: data.ry || data.radius || CONFIG.circleRadius
    };

    updateCirclePosition(ann);
    currentEditor.annotations.push(ann);
    currentEditor.annotationsLayer.appendChild(wrapper);

    circle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    });

    circle.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      selectElement(ann);
      if (currentEditor.currentTool === 'none') {
        const touch = e.touches[0];
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
        startAnnotationDrag(coords.x, coords.y, ann);
      }
    }, { passive: false });

    if (!isMobile) {
      Object.entries(handles).forEach(([pos, h]) => {
        h.addEventListener('mousedown', (e) => {
          e.stopPropagation(); e.preventDefault();
          selectElement(ann);
          activeResizeAnnotation = ann;
          activeResizeHandle = pos;
          resizeStartClientX = e.clientX;
          resizeStartClientY = e.clientY;
          resizeStartRx = ann.rx;
          resizeStartRy = ann.ry;
          resizeStartX = ann.x;
          resizeStartY = ann.y;
        });
      });
    }
  }

  // ==========================================
  // DELETE
  // ==========================================

  function deleteSelected() {
    if (!selectedElement) {
      alert('No element selected');
      return;
    }

    const index = currentEditor.annotations.indexOf(selectedElement);
    if (index > -1) {
      selectedElement.element.remove();
      currentEditor.annotations.splice(index, 1);
      selectedElement = null;
      saveState();
    }
  }

  // ==========================================
  // EXPORT & FINALIZE
  // ==========================================

function confirm() {
    const { canvas, ctx, annotations, paths, originalImage } = currentEditor;

    // Show loading state on confirm button
    const btn = currentEditor.confirmBtn;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="editor-btn-spinner"></span> Processing...';
      btn.style.opacity = '0.75';
      btn.style.cursor = 'not-allowed';
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');


    // 🛡️ ANDROID SAFE: Draw white background first
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Draw paths
    paths.forEach(path => {
      if (path.points.length < 2) return;
      
      finalCtx.strokeStyle = path.color;
      finalCtx.lineWidth = path.width;
      finalCtx.lineCap = 'round';
      finalCtx.lineJoin = 'round';
      
      finalCtx.beginPath();
      finalCtx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        finalCtx.lineTo(path.points[i].x, path.points[i].y);
      }
      
      finalCtx.stroke();
    });

    // 🎯 Draw annotations using CANVAS coordinates
    annotations.forEach(ann => {
  if (ann.type === 'text') {
    const textContent = ann.isPlaceholder ? '' : ((ann.textEl ? ann.textEl.textContent : ann.element.textContent) || ann.text || '').trim();
    if (!textContent) return;

    // ann.exportX/Y are pure canvas-pixel coords set by updateTextPosition.
    // ann.x = horizontal center, ann.y = top edge of text — no getBoundingClientRect needed.
    const exportX = ann.exportX !== undefined ? ann.exportX : ann.x;
    const exportY = ann.exportY !== undefined ? ann.exportY : ann.y;

    const lines = textContent.split('\n');
    const lineH = ann.size * 1.4;
    finalCtx.font = `bold ${ann.size}px Arial`;
    finalCtx.lineWidth = Math.max(2, ann.size * 0.15);
    finalCtx.textAlign = 'center';
    finalCtx.textBaseline = 'top';
    lines.forEach((line, idx) => {
      const ly = exportY + idx * lineH;
      finalCtx.strokeStyle = '#000000';
      finalCtx.strokeText(line, exportX, ly);
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillText(line, exportX, ly);
    });
    
  } else if (ann.type === 'circle') {
    const rx = ann.rx || ann.radius || CONFIG.circleRadius;
    const ry = ann.ry || ann.radius || CONFIG.circleRadius;
    finalCtx.strokeStyle = ann.color;
    finalCtx.lineWidth = ann.strokeWidth;
    finalCtx.beginPath();
    finalCtx.ellipse(ann.x, ann.y, rx, ry, 0, 0, Math.PI * 2);
    finalCtx.stroke();
  }
});


    finalCanvas.toBlob((blob) => {
      // Restore button in case close() doesn't fire immediately
      if (currentEditor && currentEditor.confirmBtn) {
        currentEditor.confirmBtn.disabled = false;
        currentEditor.confirmBtn.innerHTML = '✅ Confirm & Upload';
        currentEditor.confirmBtn.style.opacity = '';
        currentEditor.confirmBtn.style.cursor = '';
      }

      if (MarkerImageHandler.CONFIG.debugMode) {
        showDebugPreview(finalCanvas, annotations);
      }

      if (currentEditor.callback) {
        currentEditor.callback({
          status: 'confirm',
          blob
        });
      }
      close();
    }, 'image/png', 1.0);
}


// ✅ NEW: Debug preview function
function showDebugPreview(canvas, annotations) {
    const debugModal = document.createElement('div');
    debugModal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 10001;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
    `;
    
    const info = document.createElement('div');
    info.style.cssText = `
      margin-bottom: 16px;
      font-family: monospace;
      font-size: 12px;
      color: #333;
    `;
    
    info.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #2196F3;">🔍 Debug Preview</h3>
      <strong>Device:</strong> ${isMobile ? 'Mobile' : 'Desktop'}<br>
      <strong>Canvas:</strong> ${canvas.width}x${canvas.height}<br>
      <strong>Annotations:</strong> ${annotations.length}<br>
      <hr style="margin: 12px 0;">
      ${annotations.map((a, i) => `
        <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
          <strong>#${i+1} ${a.type.toUpperCase()}</strong><br>
          Position: (${a.x.toFixed(0)}, ${a.y.toFixed(0)})<br>
          ${a.type === 'circle' ? `Radius: ${a.radius.toFixed(0)}px` : ''}
          ${a.type === 'text' ? `Text: "${a.element.textContent}"` : ''}
        </div>
      `).join('')}
    `;
    
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.style.cssText = `
      display: block;
      max-width: 100%;
      border: 2px solid #2196F3;
      border-radius: 8px;
      margin-top: 12px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
      margin-top: 12px;
      padding: 10px 20px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    `;
    closeBtn.onclick = () => debugModal.remove();
    
    debugModal.appendChild(info);
    debugModal.appendChild(img);
    debugModal.appendChild(closeBtn);
    document.body.appendChild(debugModal);
}


  function cancel() {
    // Clear all annotations & paths so nothing leaks to caller
    if (currentEditor) {
      currentEditor.annotations.forEach(a => { try { a.element.remove(); } catch(e){} });
      currentEditor.annotations = [];
      currentEditor.paths = [];
    }

    if (currentEditor && currentEditor.callback) {
      currentEditor.callback({ status: 'cancel' });
    }

    close();
  }

  function close() {
    if (currentEditor && currentEditor.modal) {
      removeKeyboardShortcuts();
      detachCanvasEvents();

      // Safety: clear all annotation DOM elements before closing
      if (currentEditor.annotations) {
        currentEditor.annotations.forEach(a => { try { a.element.remove(); } catch(e){} });
        currentEditor.annotations = [];
      }
      if (currentEditor.paths) currentEditor.paths = [];

      currentEditor.modal.classList.remove('active');
      setTimeout(() => {
        if (currentEditor && currentEditor.modal) currentEditor.modal.remove();
        currentEditor = null;
        selectedElement = null;
        activeDragAnnotation = null;
        activeResizeAnnotation = null;
        isDrawing = false;
        isResizing = false;
        isDragging = false;
        hasMoved = false;
        undoStack = [];
        redoStack = [];
      }, 300);
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  return {
    open: createEditorModal,
    confirm,
    cancel,
    deleteSelected,
    undo,
    redo,
    get currentEditor() { return currentEditor; }
  };

})();

window.ImageEditor = ImageEditor;