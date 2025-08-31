'use client'

import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'
import React from 'react'

import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'

// Importing the provider and useEffect
import { useEffect } from 'react'
import { TiptapCollabProvider } from '@tiptap-pro/provider'

const doc = new Y.Doc()

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Collaboration.configure({
        document: doc,
      }),
    ],
    content: '<p>Hello World! 🌎️</p>',
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })
useEffect(() => {
    const provider = new TiptapCollabProvider({
      name: 'document.name', // Unique document identifier for syncing. This is your document name.
      appId: '7j9y6m10', // Your Cloud Dashboard AppID or `baseURL` for on-premises
      token: 'notoken', // Your JWT token
      document: doc,
    })
  }, [])
  return <EditorContent editor={editor} />
}

export default Tiptap