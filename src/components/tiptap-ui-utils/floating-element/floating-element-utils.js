export const isElementWithinEditor = (
  editor,
  element
) => {
  if (!element || !editor) {
    return false
  }

  const editorWrapper = editor.view.dom.parentElement
  const editorDom = editor.view.dom

  if (!editorWrapper) {
    return false
  }

  return (editorWrapper === element ||
  editorDom === element || editorWrapper.contains(element));
}
