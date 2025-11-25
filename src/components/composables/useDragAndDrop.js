/**
 * Unified Drag and Drop Composable - REFINED VERSION
 * Improvements:
 * - Ghost element shows actual item content
 * - Subtle insertion line indicator for drop position
 * - Fixed: Items no longer stay hidden after click without drag
 */

import { ref, computed, onUnmounted } from 'vue';

function useDragAndDrop(options = {}) {
  // Configuration with defaults
  const config = {
    dragThreshold: options.dragThreshold || 10,
    edgeScrollThreshold: options.edgeScrollThreshold || 50,
    pageChangeDelay: options.pageChangeDelay || 500,
    ghostOpacity: options.ghostOpacity || 0.85,
    previewOpacity: options.previewOpacity || 0.3,
    containerSelector: options.containerSelector || '.grid-container',
    itemSelector: options.itemSelector || '.grid-item',
    pageSelector: options.pageSelector || '.grid-page',
    onDragStart: options.onDragStart || (() => {}),
    onDragMove: options.onDragMove || (() => {}),
    onDragEnd: options.onDragEnd || (() => {}),
    onPageChange: options.onPageChange || (() => {})
  };

  // Drag state
  const isDragging = ref(false);
  const draggedItem = ref(null);
  const draggedElement = ref(null);
  const ghostElement = ref(null);
  const previewElement = ref(null);
  const dragStartPos = ref({ x: 0, y: 0 });
  const dragOffset = ref({ x: 0, y: 0 });
  const currentDropTarget = ref(null);
  const dragMetadata = ref({});

  // Page navigation state
  const pageChangeTimer = ref(null);

  // Touch/Mouse tracking
  const isPointerDown = ref(false);
  const pointerStartTime = ref(0);

  /**
   * Initialize drag operation
   */
  function initDrag(event, item, metadata = {}) {
    const target = event.target.closest(config.itemSelector);
    if (!target) return;

    const isTouch = event.type.includes('touch');
    const clientX = isTouch ? event.touches[0].clientX : event.clientX;
    const clientY = isTouch ? event.touches[0].clientY : event.clientY;

    // Store initial state
    isPointerDown.value = true;
    pointerStartTime.value = Date.now();
    dragStartPos.value = { x: clientX, y: clientY };
    draggedItem.value = item;
    draggedElement.value = target;
    dragMetadata.value = metadata;

    // Calculate offset from cursor to element center
    const rect = target.getBoundingClientRect();
    dragOffset.value = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    // Add event listeners
    if (isTouch) {
      document.addEventListener('touchmove', handlePointerMove, { passive: false });
      document.addEventListener('touchend', handlePointerEnd);
      document.addEventListener('touchcancel', handlePointerEnd);
    } else {
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerEnd);
    }

    event.preventDefault();
  }

  /**
   * Handle pointer movement
   */
  function handlePointerMove(event) {
    if (!isPointerDown.value) return;

    const isTouch = event.type.includes('touch');
    const clientX = isTouch ? event.touches[0].clientX : event.clientX;
    const clientY = isTouch ? event.touches[0].clientY : event.clientY;

    // Check if we've moved enough to start dragging
    if (!isDragging.value) {
      const distance = Math.sqrt(
        Math.pow(clientX - dragStartPos.value.x, 2) +
        Math.pow(clientY - dragStartPos.value.y, 2)
      );
      const timeDiff = Date.now() - pointerStartTime.value;

      if (distance > config.dragThreshold || timeDiff > 300) {
        startDrag();
      }
    }

    if (isDragging.value) {
      updateDragPosition(clientX, clientY);
      updateDropPreview(clientX, clientY);
      checkEdgeScroll(clientX);

      // Call custom move handler
      config.onDragMove({
        item: draggedItem.value,
        position: { x: clientX, y: clientY },
        metadata: dragMetadata.value
      });
    }

    if (isTouch) {
      event.preventDefault();
    }
  }

  /**
   * Handle pointer release
   */
  function handlePointerEnd(event) {
    if (isDragging.value) {
      endDrag(event);
    }

    // IMPORTANT: Always reset draggedItem, even if we didn't start dragging
    // This fixes the bug where items stay hidden after a click
    resetDragState();

    // Cleanup event listeners
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerEnd);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', handlePointerEnd);
    document.removeEventListener('touchcancel', handlePointerEnd);
  }

  /**
   * Start the drag operation
   */
  function startDrag() {
    isDragging.value = true;

    // Create ghost element with actual content
    createGhostElement();

    // Create preview element (placeholder)
    createPreviewElement();

    // Completely remove dragged element from flow (not just visually hidden)
    if (draggedElement.value) {
      draggedElement.value.classList.add('is-dragging');
      draggedElement.value.style.display = 'none';
    }

    // Call custom start handler
    config.onDragStart({
      item: draggedItem.value,
      metadata: dragMetadata.value
    });
  }

  /**
   * Create ghost element - Shows only the icon-wrapper content (compact square)
   */
  function createGhostElement() {
    if (!draggedElement.value) {
      console.warn('[DragDrop] No dragged element to create ghost from');
      return;
    }

    // Find the icon-wrapper inside the dragged element
    const iconWrapper = draggedElement.value.querySelector('.icon-wrapper');
    if (!iconWrapper) {
      console.warn('[DragDrop] No icon-wrapper found, falling back to full element');
      createFallbackGhost();
      return;
    }

    // Clone only the icon-wrapper for a compact ghost
    const clone = iconWrapper.cloneNode(true);

    // Get the icon-wrapper's dimensions
    const rect = iconWrapper.getBoundingClientRect();

    // Create wrapper for the ghost
    ghostElement.value = document.createElement('div');
    ghostElement.value.classList.add('drag-ghost');

    // Style the ghost wrapper to match icon-wrapper size
    ghostElement.value.style.cssText = `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      width: ${rect.width}px !important;
      height: ${rect.height}px !important;
      opacity: ${config.ghostOpacity} !important;
      left: -9999px !important;
      top: -9999px !important;
      transform: scale(1.08) !important;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25)) !important;
      will-change: left, top !important;
      border-radius: 12px !important;
      color: rgb(255, 86, 56) !important;
    `;

    // Style the cloned icon-wrapper
    clone.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: none !important;
      position: relative !important;
    `;

    // Remove delete button from ghost if present
    const deleteBtn = clone.querySelector('.delete-button-container');
    if (deleteBtn) {
      deleteBtn.remove();
    }

    // Ensure all child elements are visible
    const allChildren = clone.querySelectorAll('*');
    allChildren.forEach(child => {
      child.style.visibility = 'visible';
      child.style.opacity = '1';
    });

    // Ensure SVG icons have proper color
    const svgs = clone.querySelectorAll('svg');
    svgs.forEach(svg => {
      svg.style.stroke = 'rgb(255, 86, 56)';
      svg.style.fill = 'none';
      svg.style.width = '100%';
      svg.style.height = '100%';
    });

    // Ensure custom-icon and unified-icon classes have color
    const customIcons = clone.querySelectorAll('.custom-icon, .unified-icon');
    customIcons.forEach(icon => {
      icon.style.color = 'rgb(255, 86, 56)';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
      icon.style.width = '100%';
      icon.style.height = '100%';
    });

    // Ensure icon-display-container is visible
    const iconDisplay = clone.querySelector('.icon-display-container');
    if (iconDisplay) {
      iconDisplay.style.width = '100%';
      iconDisplay.style.height = '100%';
    }

    // Ensure content-wrapper is visible
    const contentWrapper = clone.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.style.width = '100%';
      contentWrapper.style.height = '100%';
      contentWrapper.style.display = 'flex';
      contentWrapper.style.alignItems = 'center';
      contentWrapper.style.justifyContent = 'center';
    }

    // Append clone to ghost wrapper
    ghostElement.value.appendChild(clone);

    // Update drag offset to center on the icon-wrapper
    dragOffset.value = {
      x: rect.width / 2,
      y: rect.height / 2
    };

    // Append to body
    document.body.appendChild(ghostElement.value);

    console.log('[DragDrop] Ghost element created from icon-wrapper with icon');
  }

  /**
   * Fallback ghost creation if no icon-wrapper found
   */
  function createFallbackGhost() {
    const size = 60;
    ghostElement.value = document.createElement('div');
    ghostElement.value.classList.add('drag-ghost');

    ghostElement.value.style.cssText = `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      width: ${size}px !important;
      height: ${size}px !important;
      opacity: ${config.ghostOpacity} !important;
      left: -9999px !important;
      top: -9999px !important;
      background: rgba(99, 102, 241, 0.4) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
    `;

    dragOffset.value = { x: size / 2, y: size / 2 };
    document.body.appendChild(ghostElement.value);
    console.log('[DragDrop] Fallback ghost element created');
  }

  /**
   * Create preview element - Visible placeholder showing drop position
   */
  function createPreviewElement() {
    if (!draggedElement.value) return;

    // Create a visible placeholder
    previewElement.value = document.createElement('div');
    previewElement.value.className = 'drag-preview';

    // Match dimensions
    const rect = draggedElement.value.getBoundingClientRect();
    previewElement.value.style.cssText = `
      width: ${rect.width}px !important;
      height: ${rect.height}px !important;
      pointer-events: none !important;
      background: rgba(99, 102, 241, 0.15) !important;
      border: 2.5px dashed rgba(99, 102, 241, 0.6) !important;
      border-radius: 12px !important;
      box-sizing: border-box !important;
      transition: transform 0.2s ease, opacity 0.2s ease !important;
      box-shadow: inset 0 0 12px rgba(99, 102, 241, 0.1) !important;
    `;

    // Insert preview right after the original element
    draggedElement.value.parentNode.insertBefore(
      previewElement.value,
      draggedElement.value.nextSibling
    );

    console.log('[DragDrop] Preview element created');
  }

  /**
   * Update ghost element position
   */
  function updateDragPosition(clientX, clientY) {
    if (!ghostElement.value) return;

    const newLeft = clientX - dragOffset.value.x;
    const newTop = clientY - dragOffset.value.y;

    ghostElement.value.style.left = `${newLeft}px`;
    ghostElement.value.style.top = `${newTop}px`;
  }

  /**
   * Update drop preview position
   */
  function updateDropPreview(clientX, clientY) {
    if (!previewElement.value || !ghostElement.value) return;

    // Temporarily hide ghost to get element underneath
    ghostElement.value.style.display = 'none';
    const elementUnder = document.elementFromPoint(clientX, clientY);
    ghostElement.value.style.display = '';

    if (!elementUnder) return;

    // Find the closest valid drop target (but not the dragged element or preview)
    let dropTarget = elementUnder.closest(config.itemSelector);

    // Skip if it's the dragged element or preview
    if (dropTarget === draggedElement.value || dropTarget === previewElement.value) {
      dropTarget = null;
    }

    if (dropTarget) {
      const rect = dropTarget.getBoundingClientRect();
      const parent = dropTarget.parentNode;

      if (!parent) return;

      // Calculate if cursor is in the first half or second half of the target
      const midPoint = rect.left + rect.width / 2;
      const insertBefore = clientX < midPoint;

      // Insert preview before or after the drop target
      try {
        if (insertBefore) {
          parent.insertBefore(previewElement.value, dropTarget);
        } else {
          const nextSibling = dropTarget.nextSibling;
          if (nextSibling) {
            parent.insertBefore(previewElement.value, nextSibling);
          } else {
            parent.appendChild(previewElement.value);
          }
        }

        currentDropTarget.value = dropTarget;

      } catch (error) {
        console.warn('[DragDrop] Error moving preview:', error);
      }
    }
  }

  /**
   * Check if near edge for page change
   */
  function checkEdgeScroll(clientX) {
    const threshold = config.edgeScrollThreshold;
    const windowWidth = window.innerWidth;

    if (clientX < threshold) {
      startPageChangeTimer('prev');
    } else if (clientX > windowWidth - threshold) {
      startPageChangeTimer('next');
    } else {
      cancelPageChangeTimer();
    }
  }

  /**
   * Start page change timer
   */
  function startPageChangeTimer(direction) {
    if (pageChangeTimer.value) return;

    pageChangeTimer.value = setTimeout(() => {
      config.onPageChange(direction);
      pageChangeTimer.value = null;
    }, config.pageChangeDelay);
  }

  /**
   * Cancel page change timer
   */
  function cancelPageChangeTimer() {
    if (pageChangeTimer.value) {
      clearTimeout(pageChangeTimer.value);
      pageChangeTimer.value = null;
    }
  }

  /**
   * End drag operation
   */
  function endDrag() {
    if (!isDragging.value) return;

    console.log('[DragDrop] Ending drag');

    // Calculate final drop position
    const result = calculateDropPosition();

    // Cleanup visual elements
    cleanupDragElements();

    // Call custom end handler
    config.onDragEnd({
      item: draggedItem.value,
      metadata: dragMetadata.value,
      dropResult: result
    });
  }

  /**
   * Calculate where the item should be dropped
   */
  function calculateDropPosition() {
    if (!previewElement.value || !previewElement.value.parentNode) {
      console.warn('[DragDrop] No preview element parent');
      return null;
    }

    const parent = previewElement.value.parentNode;

    // Get all valid items in the parent (excluding dragged and preview)
    const itemClass = config.itemSelector.replace('.', '');
    const allChildren = Array.from(parent.children);

    const validItems = allChildren.filter(el => {
      return el.classList.contains(itemClass) &&
             el !== draggedElement.value &&
             !el.classList.contains('drag-preview') &&
             !el.classList.contains('is-dragging');
    });

    // Find the index where preview currently is
    let newIndex = 0;
    for (let i = 0; i < allChildren.length; i++) {
      const child = allChildren[i];
      if (child === previewElement.value) {
        // Count how many valid items came before the preview
        newIndex = allChildren.slice(0, i).filter(el => {
          return el.classList.contains(itemClass) &&
                 el !== draggedElement.value &&
                 !el.classList.contains('drag-preview') &&
                 !el.classList.contains('is-dragging');
        }).length;
        break;
      }
    }

    const oldIndex = dragMetadata.value.originalIndex !== undefined
      ? dragMetadata.value.originalIndex
      : -1;

    const pageIndex = dragMetadata.value.pageIndex !== undefined
      ? dragMetadata.value.pageIndex
      : 0;

    // Find which page the preview is in
    const pageElement = previewElement.value.closest(config.pageSelector);
    const allPages = document.querySelectorAll(config.pageSelector);
    const newPageIndex = Array.from(allPages).indexOf(pageElement);

    console.log('[DragDrop] Drop position calculated:', {
      fromIndex: oldIndex,
      toIndex: newIndex,
      fromPage: pageIndex,
      toPage: newPageIndex >= 0 ? newPageIndex : pageIndex,
      validItemsCount: validItems.length
    });

    return {
      fromIndex: oldIndex,
      toIndex: newIndex,
      fromPage: pageIndex,
      toPage: newPageIndex >= 0 ? newPageIndex : pageIndex,
      dropTarget: currentDropTarget.value
    };
  }

  /**
   * Cleanup drag elements
   */
  function cleanupDragElements() {
    // Remove ghost
    if (ghostElement.value && ghostElement.value.parentNode) {
      ghostElement.value.parentNode.removeChild(ghostElement.value);
      console.log('[DragDrop] Ghost element removed');
    }

    // Remove preview
    if (previewElement.value && previewElement.value.parentNode) {
      previewElement.value.parentNode.removeChild(previewElement.value);
      console.log('[DragDrop] Preview element removed');
    }

    // Restore dragged element visibility
    if (draggedElement.value) {
      draggedElement.value.classList.remove('is-dragging');
      draggedElement.value.style.display = '';
    }

    ghostElement.value = null;
    previewElement.value = null;
  }

  /**
   * Reset drag state - Called after EVERY pointer release
   */
  function resetDragState() {
    isDragging.value = false;
    draggedItem.value = null;
    draggedElement.value = null;
    currentDropTarget.value = null;
    dragMetadata.value = {};
    isPointerDown.value = false;
    cancelPageChangeTimer();
  }

  /**
   * Manual cleanup (call in onUnmounted)
   */
  function cleanup() {
    if (isDragging.value) {
      cleanupDragElements();
    }
    resetDragState();

    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerEnd);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', handlePointerEnd);
    document.removeEventListener('touchcancel', handlePointerEnd);
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  // Public API
  return {
    // State
    isDragging: computed(() => isDragging.value),
    draggedItem: computed(() => draggedItem.value),

    // Methods
    initDrag,
    cleanup
  };
}

// Export as both default and named export
export default useDragAndDrop;
export { useDragAndDrop };
