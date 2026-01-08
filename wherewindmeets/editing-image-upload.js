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
  let resizeHandle = null;
  let isDragging = false;
  let dragStartPos = { x: 0, y: 0 };
  let hasMoved = false;
  
  // Pinch gesture tracking
  let isPinching = false;
  let initialPinchDistance = 0;
  let initialRadius = 0;
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
    circleRadius: 50,
    circleStrokeWidth: 3,
    minCircleRadius: 20,
    maxCircleRadius: 200,
    handleSize: 32,
    moveHandleSize: 40,
    touchSlopDistance: 4
  };

  // ==========================================
  // MODAL CREATION
  // ==========================================

  function createEditorModal(imageFile, markerKey, callback) {
    const modal = document.createElement('div');
    modal.className = 'image-editor-modal';
    modal.innerHTML = `
      <div class="image-editor-backdrop"></div>
      <div class="image-editor-container">
        <div class="image-editor-header">
          <h3>✏️ Edit Image Before Upload</h3>
          <button class="editor-close-btn" onclick="ImageEditor.cancel()">✕</button>
        </div>

        <div class="image-editor-toolbar">
          <button class="tool-btn" data-tool="none" title="Select/Move">
            <span class="tool-icon">👆</span>
            <span class="tool-label">Select</span>
          </button>
          <button class="tool-btn active" data-tool="brush" title="Draw">
            <span class="tool-icon">🖌️</span>
            <span class="tool-label">Brush</span>
          </button>
          <button class="tool-btn" data-tool="text" title="Add Text">
            <span class="tool-icon">📝</span>
            <span class="tool-label">Text</span>
          </button>
          <button class="tool-btn" data-tool="circle" title="Add Circle">
            <span class="tool-icon">⭕</span>
            <span class="tool-label">Circle</span>
          </button>
          
          <div class="toolbar-divider"></div>
          
          <button class="tool-btn" onclick="ImageEditor.undo()" title="Undo (Ctrl+Z)">
            <span class="tool-icon">↶</span>
            <span class="tool-label">Undo</span>
          </button>
          <button class="tool-btn" onclick="ImageEditor.redo()" title="Redo (Ctrl+Y)">
            <span class="tool-icon">↷</span>
            <span class="tool-label">Redo</span>
          </button>
          
          <div class="toolbar-divider"></div>
          
          <button class="tool-btn danger" onclick="ImageEditor.deleteSelected()" title="Delete Selected">
            <span class="tool-icon">❌</span>
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
    
    console.log(`🖼️ Canvas size: ${width.toFixed(0)}x${height.toFixed(0)} (original: ${img.naturalWidth}x${img.naturalHeight})`);

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
    console.log('🖼️ Canvas dimensions:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      screenWidth: rect.width,
      screenHeight: rect.height,
      scaleX: canvas.width / rect.width,
      scaleY: canvas.height / rect.height
    });
    
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
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
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

  function handleMouseDown(e) {
    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = currentEditor.canvas.width / rect.width;
    const scaleY = currentEditor.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    switch (currentEditor.currentTool) {
      case 'brush':
        startDrawing(x, y);
        break;
      case 'none':
        selectAnnotation(x, y);
        break;
    }
  }

  function handleMouseMove(e) {
    if (!currentEditor) return;
    
    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = currentEditor.canvas.width / rect.width;
    const scaleY = currentEditor.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (currentEditor.currentTool === 'brush' && isDrawing) {
      draw(x, y);
    } else if (isResizing && selectedElement) {
      resizeCircle(x, y);
    } else if (isDragging && selectedElement) {
      if (!hasMoved) {
        const dx = x - dragStartPos.x;
        const dy = y - dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > CONFIG.touchSlopDistance) {
          hasMoved = true;
        }
      }
      
      if (hasMoved) {
        dragAnnotation(x, y);
      }
    }
  }

  function handleMouseUp() {
    if (isDrawing) {
      stopDrawing();
    }
    if (isDragging) {
      stopDragging();
    }
    if (isResizing) {
      stopResizing();
    }
    
    isDragging = false;
    hasMoved = false;
  }

  function handleTouchStart(e) {
    e.preventDefault();
    
    // 🤏 PINCH GESTURE: 2 fingers = resize
    if (e.touches.length === 2 && selectedElement && selectedElement.type === 'circle') {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      initialRadius = selectedElement.radius;
      isPinching = true;
      
      showPinchIndicator();
      console.log(`🤏 Pinch started | distance: ${initialPinchDistance.toFixed(0)}px`);
      return;
    }
    
    // 👆 SINGLE TOUCH
    const touch = e.touches[0];
    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = currentEditor.canvas.width / rect.width;
    const scaleY = currentEditor.canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    createTouchRipple(touch.clientX - rect.left, touch.clientY - rect.top);
    console.log(`👆 Touch: (${x.toFixed(0)}, ${y.toFixed(0)})`);

    // If object is selected, touch anywhere = move
    if (selectedElement && currentEditor.currentTool === 'none') {
      startDragging(x, y, selectedElement);
      return;
    }

    // Try to select annotation
    let touched = false;
    for (let i = currentEditor.annotations.length - 1; i >= 0; i--) {
      const ann = currentEditor.annotations[i];
      if (isPointInAnnotation(x, y, ann)) {
        selectElement(ann);
        startDragging(x, y, ann);
        touched = true;
        break;
      }
    }

    if (!touched && currentEditor.currentTool === 'brush') {
      startDrawing(x, y);
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (!currentEditor) return;

    // 🤏 PINCH RESIZE
    if (e.touches.length === 2 && isPinching && selectedElement && selectedElement.type === 'circle') {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = currentDistance / initialPinchDistance;
      const newRadius = Math.max(
        CONFIG.minCircleRadius,
        Math.min(CONFIG.maxCircleRadius, initialRadius * scale)
      );
      
      selectedElement.radius = newRadius;
      updateCirclePosition(selectedElement);
      updatePinchIndicator(newRadius);
      return;
    }

    // 👆 SINGLE TOUCH MOVE
    const touch = e.touches[0];
    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = currentEditor.canvas.width / rect.width;
    const scaleY = currentEditor.canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    if (currentEditor.currentTool === 'brush' && isDrawing) {
      draw(x, y);
    } else if (isDragging && selectedElement) {
      if (!hasMoved) {
        const dx = x - dragStartPos.x;
        const dy = y - dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > CONFIG.touchSlopDistance) {
          hasMoved = true;
        }
      }
      
      if (hasMoved) {
        dragAnnotation(x, y);
      }
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    
    if (isPinching) {
      isPinching = false;
      hidePinchIndicator();
      saveState();
      console.log(`🤏 Pinch ended | final radius: ${selectedElement?.radius.toFixed(0)}px`);
    }
    
    handleMouseUp();
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
    const text = prompt('Enter text:');
    if (!text) return;

    const { canvas } = currentEditor;
    // 🎯 CANVAS COORDINATES (not screen coordinates)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const annotation = document.createElement('div');
    annotation.className = 'editor-text-annotation';
    annotation.contentEditable = 'true';
    annotation.textContent = text;
    annotation.style.pointerEvents = 'none';
    
    annotation.style.color = '#ffffff';
    // Font size will be set by updateTextPosition()
    annotation.style.textShadow = `
      -1px -1px 0 #000,
       1px -1px 0 #000,
      -1px  1px 0 #000,
       1px  1px 0 #000
    `;

    const annotationData = {
      type: 'text',
      element: annotation,
      x: centerX,  // ✅ Store CANVAS coordinates
      y: centerY,
      text,
      color: CONFIG.textColor,
      size: CONFIG.textSize
    };
    
    // 🔄 Update visual position
    updateTextPosition(annotationData);

    currentEditor.annotations.push(annotationData);
    currentEditor.annotationsLayer.appendChild(annotation);

    annotation.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (currentEditor.currentTool === 'none') {
        selectElement(annotationData);
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        startDragging(x, y, annotationData);
      }
    });

    setTimeout(() => {
      selectElement(annotationData);
    }, 10);

    saveState();
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
    wrapper.style.pointerEvents = 'none';
    
    const circle = document.createElement('div');
    circle.className = 'editor-circle-annotation';
    circle.style.pointerEvents = 'none';
    
    wrapper.appendChild(circle);
    
    let moveHandle = null;
    let handles = [];
    
    // 🖥️ DESKTOP ONLY: Add handles
    if (!isMobile) {
      moveHandle = document.createElement('div');
      moveHandle.className = 'circle-handle handle-move';
      moveHandle.innerHTML = '✥';
      moveHandle.style.width = CONFIG.moveHandleSize + 'px';
      moveHandle.style.height = CONFIG.moveHandleSize + 'px';
      moveHandle.style.fontSize = '24px';
      moveHandle.style.lineHeight = CONFIG.moveHandleSize + 'px';
      moveHandle.style.pointerEvents = 'auto';
      
      handles = ['nw', 'ne', 'sw', 'se'].map(pos => {
        const handle = document.createElement('div');
        handle.className = `circle-handle handle-${pos}`;
        handle.dataset.position = pos;
        handle.style.width = CONFIG.handleSize + 'px';
        handle.style.height = CONFIG.handleSize + 'px';
        handle.style.pointerEvents = 'auto';
        return handle;
      });

      wrapper.appendChild(moveHandle);
      handles.forEach(h => wrapper.appendChild(h));
    }

    const annotationData = {
      type: 'circle',
      element: wrapper,
      circle: circle,
      moveHandle: moveHandle,
      handles: handles,
      x: centerX,
      y: centerY,
      radius: CONFIG.circleRadius,
      color: CONFIG.circleColor,
      strokeWidth: CONFIG.circleStrokeWidth
    };

    updateCirclePosition(annotationData);
    currentEditor.annotations.push(annotationData);
    currentEditor.annotationsLayer.appendChild(wrapper);

    // 🖥️ DESKTOP: Handle events
    if (moveHandle) {
      moveHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectElement(annotationData);
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        startDragging(x, y, annotationData);
      });
    }

    circle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (currentEditor.currentTool === 'none') {
        selectElement(annotationData);
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        console.log(`🖱️ Circle mousedown at canvas: (${x.toFixed(0)}, ${y.toFixed(0)})`);
        startDragging(x, y, annotationData);
      }
    });
circle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentEditor.currentTool === 'none') {
        selectElement(annotationData);
        const touch = e.touches[0];
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        console.log(`👆 Circle touchstart at canvas: (${x.toFixed(0)}, ${y.toFixed(0)})`);
        startDragging(x, y, annotationData);
      }
    });
    // 🖥️ DESKTOP: Resize handles
    if (!isMobile) {
      handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          selectElement(annotationData);
          startResizing(e, annotationData, handle.dataset.position);
        });
      });
    }

    setTimeout(() => {
      selectElement(annotationData);
    }, 10);

    saveState();
  }

function updateCirclePosition(annotation) {
    const { x, y, radius, color, strokeWidth } = annotation;
    const { element, circle } = annotation;
    
    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = rect.width / currentEditor.canvas.width;
    const scaleY = rect.height / currentEditor.canvas.height;
    
    const screenX = x * scaleX;
    const screenY = y * scaleY;
    const screenRadius = radius * scaleX;
    
    element.style.left = (screenX - screenRadius) + 'px';
    element.style.top = (screenY - screenRadius) + 'px';
    element.style.width = (screenRadius * 2) + 'px';
    element.style.height = (screenRadius * 2) + 'px';
    
    circle.style.borderColor = color;
    // 🔥 Scale stroke width to match screen
    circle.style.borderWidth = (strokeWidth * scaleX) + 'px';
  }
// 🎯 NEW: Update text visual position from canvas coordinates
  function updateTextPosition(annotation) {
    const { x, y, size } = annotation;
    const { element } = annotation;
    
    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = rect.width / currentEditor.canvas.width;
    const scaleY = rect.height / currentEditor.canvas.height;
    
    element.style.left = (x * scaleX) + 'px';
    element.style.top = (y * scaleY) + 'px';
    
    // 🔥 Scale font size to match screen
    element.style.fontSize = (size * scaleX) + 'px';
  }
  
  function startResizing(e, annotation, handlePos) {
    isResizing = true;
    resizeHandle = handlePos;
    selectedElement = annotation;

    const handle = annotation.handles.find(h => h.dataset.position === handlePos);
    if (handle) handle.classList.add('is-active');

    const rect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = currentEditor.canvas.width / rect.width;
    const scaleY = currentEditor.canvas.height / rect.height;
    dragOffset.x = (e.clientX - rect.left) * scaleX;
    dragOffset.y = (e.clientY - rect.top) * scaleY;
  }

  function resizeCircle(mouseX, mouseY) {
    if (!selectedElement || !isResizing) return;

    const annotation = selectedElement;
    const { x, y } = annotation;
    
    const dx = mouseX - x;
    const dy = mouseY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const newRadius = Math.max(
      CONFIG.minCircleRadius,
      Math.min(CONFIG.maxCircleRadius, distance)
    );
    
    annotation.radius = newRadius;
    updateCirclePosition(annotation);
  }

  function stopResizing() {
    if (isResizing && selectedElement && selectedElement.handles) {
      selectedElement.handles.forEach(h => h.classList.remove('is-active'));
      saveState();
    }

    isResizing = false;
    resizeHandle = null;
  }

  // ==========================================
  // SELECTION & DRAGGING
  // ==========================================

  function selectAnnotation(x, y) {
    for (let i = currentEditor.annotations.length - 1; i >= 0; i--) {
      const ann = currentEditor.annotations[i];
      
      if (ann.type === 'circle' && !isMobile) {
        const handleClicked = checkHandleClick(x, y, ann);
        if (handleClicked) {
          selectElement(ann);
          return;
        }
      }
      
      if (isPointInAnnotation(x, y, ann)) {
        selectElement(ann);
        startDragging(x, y, ann);
        return;
      }
    }
    
    deselectAll();
  }

  function checkHandleClick(x, y, annotation) {
    if (!annotation.handles || !annotation.handles.length) return false;
    
    const canvasRect = currentEditor.canvas.getBoundingClientRect();
    const scaleX = currentEditor.canvas.width / canvasRect.width;
    const scaleY = currentEditor.canvas.height / canvasRect.height;
    
    if (annotation.moveHandle) {
      const moveRect = annotation.moveHandle.getBoundingClientRect();
      const mx = (moveRect.left - canvasRect.left + moveRect.width / 2) * scaleX;
      const my = (moveRect.top - canvasRect.top + moveRect.height / 2) * scaleY;
      const moveDist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      const moveRadius = (CONFIG.moveHandleSize / 2 + 8) * scaleX;
      
      if (moveDist < moveRadius) {
        startDragging(x, y, annotation);
        return true;
      }
    }
    
    const touchRadius = (CONFIG.handleSize / 2 + 8) * scaleX;
    
    for (let handle of annotation.handles) {
      const rect = handle.getBoundingClientRect();
      const hx = (rect.left - canvasRect.left + rect.width / 2) * scaleX;
      const hy = (rect.top - canvasRect.top + rect.height / 2) * scaleY;
      const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
      
      if (dist < touchRadius) {
        startResizing({ clientX: x / scaleX + canvasRect.left, clientY: y / scaleY + canvasRect.top }, annotation, handle.dataset.position);
        return true;
      }
    }
    
    return false;
  }

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
      
      return x >= annotation.x && 
             x <= annotation.x + textWidth && 
             y >= annotation.y && 
             y <= annotation.y + textHeight;
    }
    
    return false;
  }

  function selectElement(annotation) {
    deselectAll();
    selectedElement = annotation;
    annotation.element.classList.add('selected');
    
    if (annotation.type === 'text') {
      annotation.element.style.pointerEvents = 'auto';
    }
  }

  function deselectAll() {
    if (selectedElement) {
      selectedElement.element.classList.remove('selected');
      
      if (selectedElement.type === 'text') {
        selectedElement.element.style.pointerEvents = 'none';
      }
      
      selectedElement = null;
    }
  }

function startDragging(x, y, annotation) {
    isDragging = true;
    hasMoved = false;
    dragStartPos = { x, y };

    if (annotation.moveHandle) {
      annotation.moveHandle.classList.add('is-active');
    }

    // 🎯 Calculate offset from CANVAS coordinates
    if (annotation.type === 'circle') {
      // For circles, offset from top-left corner
      dragOffset.x = x - (annotation.x - annotation.radius);
      dragOffset.y = y - (annotation.y - annotation.radius);
      
      console.log(`🎯 startDragging CIRCLE:`, {
        touchAt: { x: x.toFixed(0), y: y.toFixed(0) },
        circleCenter: { x: annotation.x.toFixed(0), y: annotation.y.toFixed(0) },
        radius: annotation.radius.toFixed(0),
        offset: { x: dragOffset.x.toFixed(0), y: dragOffset.y.toFixed(0) }
      });
      
    } else if (annotation.type === 'text') {
      // For text, offset from anchor point
      dragOffset.x = x - annotation.x;
      dragOffset.y = y - annotation.y;
      
      console.log(`🎯 startDragging TEXT:`, {
        touchAt: { x: x.toFixed(0), y: y.toFixed(0) },
        textPos: { x: annotation.x.toFixed(0), y: annotation.y.toFixed(0) },
        offset: { x: dragOffset.x.toFixed(0), y: dragOffset.y.toFixed(0) }
      });
    }
  }

function dragAnnotation(x, y) {
    if (!selectedElement) return;
    
    // 🎯 Calculate new CANVAS position
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;
    
    if (selectedElement.type === 'circle') {
      // Circle stores center, so add radius
      selectedElement.x = newX + selectedElement.radius;
      selectedElement.y = newY + selectedElement.radius;
      
      console.log(`🔄 dragAnnotation CIRCLE:`, {
        mouseAt: { x: x.toFixed(0), y: y.toFixed(0) },
        offset: { x: dragOffset.x.toFixed(0), y: dragOffset.y.toFixed(0) },
        newTopLeft: { x: newX.toFixed(0), y: newY.toFixed(0) },
        newCenter: { x: selectedElement.x.toFixed(0), y: selectedElement.y.toFixed(0) }
      });
      
      updateCirclePosition(selectedElement);
    } else if (selectedElement.type === 'text') {
      // ✅ Store CANVAS coordinates
      selectedElement.x = newX;
      selectedElement.y = newY;
      
      console.log(`🔄 dragAnnotation TEXT:`, {
        mouseAt: { x: x.toFixed(0), y: y.toFixed(0) },
        offset: { x: dragOffset.x.toFixed(0), y: dragOffset.y.toFixed(0) },
        newPos: { x: newX.toFixed(0), y: newY.toFixed(0) }
      });
      
      // 🔄 Update visual position
      updateTextPosition(selectedElement);
    }
  }

  function stopDragging() {
    if (selectedElement?.moveHandle) {
      selectedElement.moveHandle.classList.remove('is-active');
    }

    if (isDragging && hasMoved && !isResizing && !isDrawing) {
      saveState();
    }

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
        text: a.element.textContent || '',
        color: a.color,
        size: a.size,
        radius: a.radius,
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
    el.contentEditable = 'true';
    el.textContent = data.text;
    el.style.pointerEvents = 'none';
    
    el.style.color = data.color;
    // Font size will be set by updateTextPosition()
    el.style.textShadow = `
      -1px -1px 0 #000,
       1px -1px 0 #000,
      -1px  1px 0 #000,
       1px  1px 0 #000
    `;

    const ann = { ...data, element: el };
    
    // 🔄 Update visual position from canvas coordinates
    updateTextPosition(ann);
    
    currentEditor.annotations.push(ann);
    currentEditor.annotationsLayer.appendChild(el);
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      if (currentEditor.currentTool === 'none') {
        selectElement(ann);
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        startDragging(x, y, ann);
      }
    });
  }

  function addCircleFromState(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-circle-wrapper';
    wrapper.style.pointerEvents = 'none';
    
    const circle = document.createElement('div');
    circle.className = 'editor-circle-annotation';
    circle.style.pointerEvents = 'none';
    
    wrapper.appendChild(circle);
    
    let moveHandle = null;
    let handles = [];
    
    if (!isMobile) {
      moveHandle = document.createElement('div');
      moveHandle.className = 'circle-handle handle-move';
      moveHandle.innerHTML = '✥';
      moveHandle.style.width = CONFIG.moveHandleSize + 'px';
      moveHandle.style.height = CONFIG.moveHandleSize + 'px';
      moveHandle.style.fontSize = '24px';
      moveHandle.style.lineHeight = CONFIG.moveHandleSize + 'px';
      moveHandle.style.pointerEvents = 'auto';
      
      handles = ['nw', 'ne', 'sw', 'se'].map(pos => {
        const handle = document.createElement('div');
        handle.className = `circle-handle handle-${pos}`;
        handle.dataset.position = pos;
        handle.style.width = CONFIG.handleSize + 'px';
        handle.style.height = CONFIG.handleSize + 'px';
        handle.style.pointerEvents = 'auto';
        return handle;
      });

      wrapper.appendChild(moveHandle);
      handles.forEach(h => wrapper.appendChild(h));
    }

    const ann = {
      ...data,
      element: wrapper,
      circle: circle,
      moveHandle: moveHandle,
      handles: handles
    };

    updateCirclePosition(ann);
    currentEditor.annotations.push(ann);
    currentEditor.annotationsLayer.appendChild(wrapper);

    if (moveHandle) {
      moveHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectElement(ann);
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        startDragging(x, y, ann);
      });
    }

    circle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (currentEditor.currentTool === 'none') {
        selectElement(ann);
        const rect = currentEditor.canvas.getBoundingClientRect();
        const scaleX = currentEditor.canvas.width / rect.width;
        const scaleY = currentEditor.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        startDragging(x, y, ann);
      }
    });

    if (!isMobile) {
      handles.forEach(handle => {
        handle.addEventListener('mousedown', e => {
          e.stopPropagation();
          selectElement(ann);
          startResizing(e, ann, handle.dataset.position);
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

    // 🔍 DEBUG: Log annotations before export
    console.log('🔍 Exporting annotations:', annotations.map(a => ({
      type: a.type,
      x: a.x,
      y: a.y,
      text: a.type === 'text' ? a.element.textContent : undefined,
      radius: a.radius
    })));

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
        // ✅ Text coordinates stored as TOP position
        // Canvas fillText uses BASELINE position, so we need to add font size
        const textX = ann.x;
        const textY = ann.y + ann.size; // Convert TOP → BASELINE
        
        console.log(`📝 Drawing text: TOP (${ann.x.toFixed(0)}, ${ann.y.toFixed(0)}) → BASELINE (${textX.toFixed(0)}, ${textY.toFixed(0)})`);
        
        finalCtx.font = `bold ${ann.size}px Arial`;
        finalCtx.lineWidth = Math.max(2, ann.size * 0.15);
        
        // Draw text outline (black)
        finalCtx.strokeStyle = '#000000';
        finalCtx.strokeText(ann.element.textContent, textX, textY);
        
        // Draw text fill (white)
        finalCtx.fillStyle = '#ffffff';
        finalCtx.fillText(ann.element.textContent, textX, textY);
        
      } else if (ann.type === 'circle') {
        // ✅ Circle coordinates are already in canvas space
        console.log(`⭕ Drawing circle at canvas coords: (${ann.x.toFixed(0)}, ${ann.y.toFixed(0)}) radius: ${ann.radius.toFixed(0)}`);
        
        finalCtx.strokeStyle = ann.color;
        finalCtx.lineWidth = ann.strokeWidth;
        finalCtx.beginPath();
        finalCtx.arc(ann.x, ann.y, ann.radius, 0, Math.PI * 2);
        finalCtx.stroke();
      }
    });

    console.log('✅ Export complete, creating blob...');

    finalCanvas.toBlob((blob) => {
      if (currentEditor.callback) {
        currentEditor.callback({
          status: 'confirm',
          blob
        });
      }
      close();
    }, 'image/png', 1.0);
  }

  function cancel() {
    if (currentEditor.paths.length > 0 || currentEditor.annotations.length > 0) {
      if (!confirm('Discard all changes?')) return;
    }

    if (currentEditor.callback) {
      currentEditor.callback({ status: 'cancel' });
    }

    close();
  }

  function close() {
    if (currentEditor && currentEditor.modal) {
      removeKeyboardShortcuts();
      currentEditor.modal.classList.remove('active');
      setTimeout(() => {
        currentEditor.modal.remove();
        currentEditor = null;
        selectedElement = null;
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
console.log('✅ ImageEditor v3.1 - FIXED Coordinate System');
console.log('📍 All coordinates now use CANVAS space, not SCREEN space');
console.log('🎯 Export will match editor preview exactly');