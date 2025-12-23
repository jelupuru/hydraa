"use client";

import * as React from "react";
import { normalizeNodeId } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { serializeHtml } from "platejs/static";
import { MarkdownPlugin } from "@platejs/markdown";

import { EditorKit } from "@/components/editor-kit";
import { EditorContainer, Editor } from "@/components/ui/editor";

export type PlatePEEditorHandle = {
  getHtml: () => Promise<string>;
  getMarkdown: () => string;
};

function htmlToPlainParagraphs(html: string) {
  if (!html) return [];
  // Quick DOM parse to extract text paragraphs
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const container = doc.body;
    const blocks: string[] = [];

    // consider direct children paragraphs/divs as blocks
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.textContent?.trim();
        if (txt) blocks.push(txt);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const text = el.textContent?.trim();
        if (text) blocks.push(text);
      }
    });

    if (blocks.length === 0) {
      const txt = container.textContent?.trim();
      if (txt) return txt.split(/\n+/).map((t) => t.trim()).filter(Boolean);
    }

    return blocks;
  } catch (e) {
    return html.replace(/<[^>]*>/g, "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
}

const PlatePEEditor = React.forwardRef<PlatePEEditorHandle, { initialHtml?: string }>(
  ({ initialHtml }, ref) => {
    const paragraphs = React.useMemo(() => htmlToPlainParagraphs(initialHtml || ""), [initialHtml]);

    const value = React.useMemo(() => {
      const nodes = paragraphs.length
        ? paragraphs.map((p) => ({ type: "p", children: [{ text: p }] }))
        : [{ type: "p", children: [{ text: "" }] }];

      return normalizeNodeId(nodes as any);
    }, [paragraphs]);

    const editor = usePlateEditor({ plugins: EditorKit, value });

    React.useImperativeHandle(ref, () => ({
      getHtml: async () => {
        try {
          const html = await serializeHtml(editor, { editorComponent: (Editor as any), props: {} as any });
          return html;
        } catch (e) {
          return editor.getApi(MarkdownPlugin).markdown.serialize();
        }
      },
      getMarkdown: () => {
        try {
          return editor.getApi(MarkdownPlugin).markdown.serialize();
        } catch (e) {
          return editor.children.map((n: any) => (n.children || []).map((c: any) => c.text || "").join(" ")).join("\n\n");
        }
      },
    }));

    return (
      <Plate editor={editor}>
        <EditorContainer>
          <Editor variant="demo" />
        </EditorContainer>
      </Plate>
    );
  }
);

PlatePEEditor.displayName = "PlatePEEditor";

export default PlatePEEditor;
