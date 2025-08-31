import './styles.scss'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Ai from '@tiptap-pro/extension-ai'
import React, { useState } from 'react'

import { variables } from '../../../variables.js'

export default () => {
  const [state, setState] = useState({
    isLoading: false,
    errorMessage: null,
    response: null,
  })
  const [streamMode, setStreamMode] = useState(true)

  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit,
      Ai.configure({
        appId: 'APP_ID_HERE',
        token: 'TOKEN_HERE',
        // WARNING: Remove this line in your code. It only works in the demo environment.
        baseUrl: variables.tiptapAiBaseUrl,
        autocompletion: true,
        onLoading: () => {
          setState({
            isLoading: true,
            errorMessage: null,
            response: '',
          })
        },
        onChunk: ({ response }) => {
          setState({
            isLoading: true,
            errorMessage: null,
            response,
          })
        },
        onSuccess: ({ response }) => {
          setState({
            isLoading: false,
            errorMessage: null,
            response,
          })
        },
        onError: error => {
          // eslint-disable-next-line no-console
          console.error(error)
          setState({
            isLoading: false,
            errorMessage: error.message,
            response: null,
          })
        },
      }),
    ],
    content: `
      <p>
        Rocking like a mobile?
      </p>
      <p>
        Did you hear about the mobile phone that joined a rock band? Yeah, it was a real smartTONE!
        It rocked the stage with its gigabytes of rhythm and had everyone calling for an encore, but
        it couldn't resist the temptation to drop a few bars and left the audience in absolute silence.
        Turns out, it wasn't quite cut out for the music industry.
      </p>
      <p>
        They say it's now pursuing a career in ringtone composition. Who knows, maybe one day it'll top
        the charts with its catchy melodies!
      </p>
      <p></p>
    `,
  })

  if (!editor) {
    return null
  }

  const { empty: selectionIsEmpty, from: selectionFrom, to: selectionTo } = editor.state.selection
  const selectionContainsText = editor.state.doc.textBetween(selectionFrom, selectionTo, ' ')
  const isDisabled = selectionIsEmpty || !selectionContainsText

  return (
    <>
      <div className="control-group">
        <div className="flex-row">
          <div className="hint">💡 Select text to improve</div>
        </div>
        <div className="button-group">
          
          
          
          <button
            onClick={() => editor.chain().focus().aiRephrase({ stream: streamMode, modelName: 'gpt-4o-mini' }).run()}
            disabled={isDisabled}
          >
            Rephrase
          </button>
          
        </div>

        {state.errorMessage && <div className="hint error">{state.errorMessage}</div>}
        {state.isLoading && <div className="hint purple-spinner">AI is generating</div>}
      </div>

      <EditorContent editor={editor} />
    </>
  )
}
