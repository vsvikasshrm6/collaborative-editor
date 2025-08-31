"use client";
import * as React from "react"
import {
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from "@floating-ui/react"

/**
 * Custom hook for creating and managing floating elements relative to a reference position
 *
 * @param show - Boolean controlling visibility of the floating element
 * @param referencePos - DOMRect representing the position to anchor the floating element to
 * @param zIndex - Z-index value for the floating element
 * @param options - Additional options to pass to the underlying useFloating hook
 * @returns Object containing properties and methods to control the floating element
 */
export function useFloatingElement(show, referencePos, zIndex, options) {
  const { dismissOptions, ...floatingOptions } = options || {}

  const { refs, update, context, floatingStyles } = useFloating({
    open: show,
    ...floatingOptions,
  })

  const { isMounted, styles } = useTransitionStyles(context)

  const dismiss = useDismiss(context, dismissOptions)

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss])

  React.useEffect(() => {
    update()
  }, [referencePos, update])

  React.useEffect(() => {
    if (referencePos === null) {
      return
    }

    refs.setReference({
      getBoundingClientRect: () => referencePos,
    })
  }, [referencePos, refs])

  return React.useMemo(() => ({
    isMounted,
    ref: refs.setFloating,
    style: {
      ...styles,
      ...floatingStyles,
      zIndex,
    },
    update,
    getFloatingProps,
    getReferenceProps,
  }), [
    floatingStyles,
    isMounted,
    refs.setFloating,
    styles,
    update,
    zIndex,
    getFloatingProps,
    getReferenceProps,
  ]);
}
