"use client";
import * as React from "react"
import { flip, offset, shift, useMergeRefs } from "@floating-ui/react";
import { Selection } from "@tiptap/pm/state"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useFloatingElement } from "@/hooks/use-floating-element"

// --- Lib ---
import {
  getSelectionBoundingRect,
  isSelectionValid,
} from "@/lib/tiptap-collab-utils"

import { isElementWithinEditor } from "./floating-element-utils"
import { isValidPosition } from "@/lib/tiptap-utils"

/**
 * A floating UI element that positions itself relative to the current selection in a Tiptap editor.
 * Used for floating toolbars, menus, and other UI elements that need to appear near the text cursor.
 */
export const FloatingElement = React.forwardRef((
  {
    editor: providedEditor,
    shouldShow = undefined,
    floatingOptions,
    zIndex = 50,
    onOpenChange,
    onRectChange,
    getBoundingClientRect = getSelectionBoundingRect,
    updateOnScroll = true,
    closeOnEscape = true,
    children,
    style: propStyle,
    ...props
  },
  forwardedRef
) => {
  const [open, setOpen] = React.useState(shouldShow !== undefined ? shouldShow : false)
  const [selectionRect, setSelectionRect] = React.useState(null)

  const floatingElementRef = React.useRef(null)
  const preventHideRef = React.useRef(false)
  const preventShowRef = React.useRef(false)

  const { editor } = useTiptapEditor(providedEditor)

  const handleOpenChange = React.useCallback((newOpen) => {
    onOpenChange?.(newOpen)
    setOpen(newOpen)
  }, [onOpenChange])

  const handleFloatingOpenChange = (open) => {
    if (!open && editor) {
      // When the floating element closes, reset the selection.
      // This lets the user place the cursor again and ensures the drag handle reappears,
      // as it's intentionally hidden during valid text selections.
      const tr = editor.state.tr.setSelection(Selection.near(editor.state.doc.resolve(0)))
      editor.view.dispatch(tr)
    }

    handleOpenChange(open)
  }

  React.useEffect(() => {
    onRectChange?.(selectionRect)
  }, [selectionRect, onRectChange])

  const { isMounted, ref, style, getFloatingProps } = useFloatingElement(open, selectionRect, zIndex, {
    placement: "top",
    middleware: [shift(), flip(), offset(4)],
    onOpenChange: handleFloatingOpenChange,
    dismissOptions: {
      enabled: true,
      escapeKey: true,
      outsidePress(event) {
        const relatedTarget = event.target
        if (!relatedTarget) return false

        return !isElementWithinEditor(editor, relatedTarget);
      },
    },
    ...floatingOptions,
  })

  const updateSelectionState = React.useCallback(() => {
    if (!editor) return

    const newRect = getBoundingClientRect(editor)

    if (newRect && shouldShow !== undefined && !preventShowRef.current) {
      setSelectionRect(newRect)
      handleOpenChange(shouldShow)
      return
    }

    const shouldShowResult = isSelectionValid(editor)

    if (
      newRect &&
      !preventShowRef.current &&
      (shouldShowResult || preventHideRef.current)
    ) {
      setSelectionRect(newRect)
      handleOpenChange(true)
    } else if (
      !preventHideRef.current &&
      (!shouldShowResult || preventShowRef.current || !editor.isEditable)
    ) {
      handleOpenChange(false)
    }
  }, [editor, getBoundingClientRect, handleOpenChange, shouldShow])

  React.useEffect(() => {
    if (!editor || !closeOnEscape) return

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && open) {
        handleOpenChange(false)
        return true
      }
      return false
    }

    editor.view.dom.addEventListener("keydown", handleKeyDown)
    return () => {
      editor.view.dom.removeEventListener("keydown", handleKeyDown)
    };
  }, [editor, open, closeOnEscape, handleOpenChange])

  React.useEffect(() => {
    if (!editor) return

    const handleBlur = (event) => {
      if (preventHideRef.current) {
        preventHideRef.current = false
        return
      }

      const relatedTarget = event.relatedTarget
      if (!relatedTarget) return

      const isWithinEditor = isElementWithinEditor(editor, relatedTarget)

      const floatingElement = floatingElementRef.current
      const isWithinFloatingElement =
        floatingElement &&
        (floatingElement === relatedTarget ||
          floatingElement.contains(relatedTarget))

      if (!isWithinEditor && !isWithinFloatingElement && open) {
        handleOpenChange(false)
      }
    }

    editor.view.dom.addEventListener("blur", handleBlur)
    return () => {
      editor.view.dom.removeEventListener("blur", handleBlur)
    };
  }, [editor, handleOpenChange, open])

  React.useEffect(() => {
    if (!editor) return

    const handleDrag = () => {
      if (open) {
        handleOpenChange(false)
      }
    }

    editor.view.dom.addEventListener("dragstart", handleDrag)
    editor.view.dom.addEventListener("dragover", handleDrag)

    return () => {
      editor.view.dom.removeEventListener("dragstart", handleDrag)
      editor.view.dom.removeEventListener("dragover", handleDrag)
    };
  }, [editor, open, handleOpenChange])

  React.useEffect(() => {
    if (!editor) return

    const handleMouseDown = (event) => {
      if (event.button !== 0) return

      preventShowRef.current = true

      const { state, view } = editor
      const posCoords = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      })

      if (!posCoords || !isValidPosition(posCoords.pos)) return

      const $pos = state.doc.resolve(posCoords.pos)
      const nodeBefore = $pos.nodeBefore

      if (!nodeBefore || nodeBefore.isBlock) return

      const tr = state.tr.setSelection(Selection.near(state.doc.resolve(posCoords.pos)))
      view.dispatch(tr)
    }

    const handleMouseUp = () => {
      if (preventShowRef.current) {
        preventShowRef.current = false
        updateSelectionState()
      }
    }

    editor.view.dom.addEventListener("mousedown", handleMouseDown)
    editor.view.root.addEventListener("mouseup", handleMouseUp)

    return () => {
      editor.view.dom.removeEventListener("mousedown", handleMouseDown)
      editor.view.root.removeEventListener("mouseup", handleMouseUp)
    };
  }, [editor, updateSelectionState])

  React.useEffect(() => {
    if (!editor) return

    const updateIfOpen = () => {
      if (open) updateSelectionState()
    }

    editor.on("selectionUpdate", updateSelectionState)
    window.addEventListener("resize", updateIfOpen)

    if (updateOnScroll) {
      editor.view.root.addEventListener("scroll", updateIfOpen, true)
    }

    return () => {
      editor.off("selectionUpdate", updateSelectionState)
      window.removeEventListener("resize", updateIfOpen)

      if (updateOnScroll) {
        editor.view.root.removeEventListener("scroll", updateIfOpen, true)
      }
    };
  }, [editor, open, updateOnScroll, updateSelectionState])

  React.useEffect(() => {
    if (!editor) return
    updateSelectionState()
  }, [editor, updateSelectionState])

  const finalStyle = React.useMemo(() =>
    propStyle && Object.keys(propStyle).length > 0 ? propStyle : style, [propStyle, style])
  const mergedRef = useMergeRefs([ref, forwardedRef, floatingElementRef])

  if (!editor || !isMounted || !open) return null

  return (
    <div ref={mergedRef} style={finalStyle} {...props} {...getFloatingProps()}>
      {children}
    </div>
  );
})

FloatingElement.displayName = "FloatingElement"
