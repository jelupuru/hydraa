"use client";

import * as React from "react";
import { normalizeNodeId } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { serializeHtml } from "platejs/static";
import { MarkdownPlugin } from "@platejs/markdown";
import { discussionPlugin } from "@/components/discussion-kit";

import { EditorKit } from "@/components/editor-kit";
import { EditorContainer, Editor } from "@/components/ui/editor";

export type PlatePEEditorHandle = {
  getHtml: () => Promise<string>;
  getMarkdown: () => string;
  getJson: () => string;
  getDiscussions: () => any[];
};

interface PlatePEEditorProps {
  initialHtml?: string;
  complaintId?: number;
  readOnly?: boolean;
  initialDiscussions?: any[];
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

function parseInitialContent(content: string) {
  if (!content) return [{ type: "p", children: [{ text: "" }] }];
  
  // Try to parse as JSON first (PlateJS native format)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, might be HTML - keep it for backward compatibility
  }
  
  // If it's HTML, convert to simple paragraphs for backward compatibility
  if (content.includes('<') && content.includes('>')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const container = doc.body;
      const blocks: string[] = [];

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
        if (txt) {
          return txt.split(/\n+/).map((t) => ({ type: "p", children: [{ text: t.trim() }] })).filter((n: any) => n.children[0].text);
        }
      }

      return blocks.length > 0 ? blocks.map((p) => ({ type: "p", children: [{ text: p }] })) : [{ type: "p", children: [{ text: "" }] }];
    } catch (e) {
      // Fall through to plain text handling
    }
  }
  
  // Treat as plain text
  const lines = content.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  return lines.length > 0 
    ? lines.map((line) => ({ type: "p", children: [{ text: line }] }))
    : [{ type: "p", children: [{ text: "" }] }];
}

const PlatePEEditor = React.forwardRef<PlatePEEditorHandle, PlatePEEditorProps>(
  ({ initialHtml, complaintId, readOnly = false, initialDiscussions, user }, ref) => {
    const value = React.useMemo(() => {
      const nodes = parseInitialContent(initialHtml || "");
      return normalizeNodeId(nodes as any);
    }, [initialHtml]);

    const editor = usePlateEditor({ 
      plugins: EditorKit, 
      value,
      readOnly 
    });

    // Configure discussion plugin with current user (only once on mount)
    const discussionsInitialized = React.useRef(false);
    const lastSavedDiscussions = React.useRef<string>('');
    
    React.useEffect(() => {
      if (user && editor && !discussionsInitialized.current) {
        try {
          // Set discussion plugin options
          editor.setOption(discussionPlugin, 'currentUserId', user.id);
          editor.setOption(discussionPlugin, 'users', {
            ...editor.getOption(discussionPlugin, 'users'),
            [user.id]: {
              id: user.id,
              name: user.name || user.email || 'User',
              avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`,
            },
          });
          // Initialize discussions from props or empty array (only once)
          const initialDisc = initialDiscussions || [];
          editor.setOption(discussionPlugin, 'discussions', initialDisc);
          lastSavedDiscussions.current = JSON.stringify(initialDisc);
          discussionsInitialized.current = true;
        } catch (e) {
          console.log('Error configuring discussion plugin:', e);
        }
      }
    }, [user, editor, initialDiscussions]);

    // Auto-save discussions when they change
    React.useEffect(() => {
      if (!editor || !complaintId || readOnly || !discussionsInitialized.current) return;

      const checkAndSaveDiscussions = async () => {
        try {
          const discussions = editor.getOption(discussionPlugin, 'discussions') || [];
          const currentDiscussions = JSON.stringify(discussions);
          
          // Only save if discussions actually changed
          if (currentDiscussions !== lastSavedDiscussions.current) {
            lastSavedDiscussions.current = currentDiscussions;
            
            const content = JSON.stringify(editor.children);
            
            await fetch(`/api/complaints/${complaintId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                peReport: content,
                peDiscussions: currentDiscussions
              }),
            });
            
            console.log('Auto-saved discussions');
          }
        } catch (e) {
          console.error('Error auto-saving discussions:', e);
        }
      };

      // Debounce to avoid too many saves - check every 3 seconds
      const intervalId = setInterval(checkAndSaveDiscussions, 3000);
      return () => clearInterval(intervalId);
    }, [editor, complaintId, readOnly]);

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
      getJson: () => {
        // Return the editor content as JSON string (includes embedded comments)
        try {
          return JSON.stringify(editor.children);
        } catch (e) {
          return JSON.stringify([{ type: "p", children: [{ text: "" }] }]);
        }
      },
      getDiscussions: () => {
        // Return the discussions array for persisting comments
        try {
          return editor.getOption(discussionPlugin, 'discussions') || [];
        } catch (e) {
          return [];
        }
      },
    }));

    return (
      <div className="relative">
        {!readOnly && (
          <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
            <span>💬 Select text and press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Ctrl+Shift+M</kbd> to add comments</span>
          </div>
        )}
        <Plate editor={editor}>
          <EditorContainer>
            <Editor variant="demo" readOnly={readOnly} />
          </EditorContainer>
        </Plate>
      </div>
    );
  }
);

PlatePEEditor.displayName = "PlatePEEditor";

export default PlatePEEditor;
