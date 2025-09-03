"use client";

// --- Tiptap UI ---
import { FloatingElement } from "@/components/tiptap-ui-utils/floating-element";
import { MarkButton } from "@/components/tiptap-ui/mark-button";

import StarterKit from "@tiptap/starter-kit";
// --- UI Primitives ---
import { ButtonGroup } from "@/components/tiptap-ui-primitive/button";
import { Toolbar } from "@/components/tiptap-ui-primitive/toolbar";

import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import Ai from "@tiptap-pro/extension-ai";
import React, { useState } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";

// Importing the provider and useEffect
import { useEffect } from "react";
import { TiptapCollabProvider } from "@tiptap-pro/provider";
//
// import { FloatingElement } from '@/components/tiptap-ui-utils/floating-element'

const doc = new Y.Doc();

const Tiptap = () => {
  const [state, setState] = useState({
    isLoading: false,
    errorMessage: null,
    response: null,
  });
  const [streamMode, setStreamMode] = useState(true);
  useEffect(() => {
    const provider = new TiptapCollabProvider({
      name: "code-editor", // Unique document identifier for syncing. This is your document name.
      appId: "rm8dxx1k", // Your Cloud Dashboard AppID or `baseURL` for on-premises
      token:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTY2NDg4ODgsIm5iZiI6MTc1NjY0ODg4OCwiZXhwIjoxNzU2NzM1Mjg4LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJybThkeHgxayJ9.VLzGxApEcfagrVGZ3gJes0remy1uFptd-0GaHm_mLEU", // Your JWT token
      document: doc,

      onSynced() {
        if (!doc.getMap("config").get("initialContentLoaded") && editor) {
          doc.getMap("config").set("initialContentLoaded", true);

          editor.commands.setContent(`
          <p>This is a radically reduced version of Tiptap. It has support for a document, with paragraphs and text. That’s it. It’s probably too much for real minimalists though.</p>
          <p>The paragraph extension is not really required, but you need at least one node. Sure, that node can be something different.</p>
          `);
        }
      },
    });
  }, []);
  const editor = useEditor({
    // immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit,
      Collaboration.configure({
        document: doc,
      }),
      Ai.configure({
        appId: "rm8o2v29",
        token:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTY2NjE5NTcsIm5iZiI6MTc1NjY2MTk1NywiZXhwIjoxNzU2NzQ4MzU3LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJkZmVjOGI1ZC1mNTc3LTQyNDEtYTY2Yy02NTRmNmY3NTFlMDkifQ._nAVLwOuA-uEF3x8nruyoJLQJeXOwM7wjBu9u_tI6x8",
        autocompletion: true,
        onLoading: () => {
          setState({
            isLoading: true,
            errorMessage: null,
            response: "",
          });
        },
        onChunk: ({ response }) => {
          setState({
            isLoading: true,
            errorMessage: null,
            response,
          });
        },
        onSuccess: ({ response }) => {
          setState({
            isLoading: false,
            errorMessage: null,
            response,
          });
        },
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error(error);
          setState({
            isLoading: false,
            errorMessage: error.message,
            response: null,
          });
        },
      }),
    ],
    content: `<p>
        This is a radically reduced version of Tiptap. It has support for a document, with paragraphs and text. That’s it. It’s probably too much for real minimalists though.
      </p>
      <p>
        The paragraph extension is not really required, but you need at least one node. Sure, that node can be something different.
      </p>`,
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  });
  if (!editor) {
    return null;
  }
  const {
    empty: selectionIsEmpty,
    from: selectionFrom,
    to: selectionTo,
  } = editor.state.selection;
  const selectionContainsText = editor.state.doc.textBetween(
    selectionFrom,
    selectionTo,
    " "
  );
  const isDisabled = selectionIsEmpty || !selectionContainsText;

  //  console.log(editor.state.selection)
  // console.log(editor.getText());
  console.log(selectionContainsText);

  return (
    <div className="flex flex-row">
      <div className="control-group">
        <div className="flex-row">
          <div className="hint">💡 Select text to improve</div>
        </div>
        <div className="button-group">
          <button
            onClick={() =>
              editor
                .chain()
                .focus()
                .aiRephrase({ stream: streamMode, modelName: "gpt-4o-mini" })
                .run()
            }
            // disabled={isDisabled}
            disabled={false}
          >
            Rephrase
          </button>
        </div>

        {state.errorMessage && (
          <div className="hint error">{state.errorMessage}</div>
        )}
        {state.isLoading && (
          <div className="hint purple-spinner">AI is generating</div>
        )}

        {/* Editor part */}
        <EditorContext.Provider value={{ editor }}>
          <EditorContent editor={editor} />

          <FloatingElement editor={editor}>
            <Toolbar variant="floating">
              <ButtonGroup orientation="horizontal">
                <MarkButton type="bold" />
                <MarkButton type="italic" />
              </ButtonGroup>
            </Toolbar>
          </FloatingElement>
        </EditorContext.Provider>
      </div>

      <div>
        {/* Ai Agent */}
        <h1>AI Agent</h1>
      </div>
    </div>
  );
};

export default Tiptap;
