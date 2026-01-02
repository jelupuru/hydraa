"use client";

import * as React from "react";
import { normalizeNodeId } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { serializeHtml } from "platejs/static";
import { MarkdownPlugin } from "@platejs/markdown";
import { discussionPlugin } from "@/components/discussion-kit";
import { toast } from "sonner";

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
  usersData?: Record<string, { id: string; name: string; email?: string; role?: string }>;
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
  ({ initialHtml, complaintId, readOnly = false, initialDiscussions, usersData, user }, ref) => {
    const value = React.useMemo(() => {
      const nodes = parseInitialContent(initialHtml || "");
      return normalizeNodeId(nodes as any);
    }, [initialHtml]);

    const initialContentSnapshot = React.useRef<string>(JSON.stringify(value));
    const lastSavedContent = React.useRef<string>(initialContentSnapshot.current);
    const lastSavedDiscussions = React.useRef<string>('');
    const autoSaveTimer = React.useRef<NodeJS.Timeout | null>(null);

    const editor = usePlateEditor({ 
      plugins: EditorKit, 
      value,
      readOnly 
    });

    // Configure discussion plugin with current user (only once on mount)
    const discussionsInitialized = React.useRef(false);
    
    React.useEffect(() => {
      if (user && editor && !discussionsInitialized.current) {
        try {
          // Initialize discussions from props or empty array (only once)
          const initialDisc = initialDiscussions || [];
          
          // Start with provided users data or empty object
          const usersMap: Record<string, any> = usersData ? { ...usersData } : {};
          
          // Ensure current user is in the map
          if (!usersMap[user.id]) {
            usersMap[user.id] = {
              id: user.id,
              name: user.name || user.email || 'User',
              avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`,
            };
          }
          
          // Add all users from existing discussions if not provided in usersData
          initialDisc.forEach((discussion: any) => {
            // Add discussion creator if not already present
            if (discussion.userId && !usersMap[discussion.userId]) {
              usersMap[discussion.userId] = {
                id: discussion.userId,
                name: `User ${discussion.userId.substring(0, 6)}`,
                avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${discussion.userId}`,
              };
            }
            
            // Add all commenters
            discussion.comments?.forEach((comment: any) => {
              if (comment.userId && !usersMap[comment.userId]) {
                usersMap[comment.userId] = {
                  id: comment.userId,
                  name: `User ${comment.userId.substring(0, 6)}`,
                  avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${comment.userId}`,
                };
              }
            });
          });
          
          // Set discussion plugin options
          editor.setOption(discussionPlugin, 'currentUserId', user.id);
          editor.setOption(discussionPlugin, 'users', usersMap);
          editor.setOption(discussionPlugin, 'discussions', initialDisc);
          lastSavedDiscussions.current = JSON.stringify(initialDisc);
          discussionsInitialized.current = true;
        } catch (e) {
          console.log('Error configuring discussion plugin:', e);
        }
      }
    }, [user, editor, initialDiscussions, usersData]);

    // Cleanup pending autosave on unmount
    React.useEffect(() => {
      return () => {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      };
    }, []);

    const scheduleAutoSave = React.useCallback(
      (contentJson: string, discussionsJson: string) => {
        if (!complaintId || readOnly) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        autoSaveTimer.current = setTimeout(async () => {
          try {
            await fetch(`/api/complaints/${complaintId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ peReport: contentJson, peDiscussions: discussionsJson }),
            });
            lastSavedContent.current = contentJson;
            lastSavedDiscussions.current = discussionsJson;
            console.log('[PE Editor] auto-saved content/discussions');
            toast.success('Preliminary Enquiry saved', { id: 'pe-save' });
          } catch (e) {
            console.error('Error auto-saving PE content/discussions:', e);
            toast.error('Failed to save PE');
          }
        }, 1200);
      },
      [complaintId, readOnly]
    );

    const handlePlateChange = React.useCallback(
      ({ editor: plateEditor }: { editor: typeof editor }) => {
        if (!plateEditor || readOnly || !complaintId) return;

        const contentJson = JSON.stringify(plateEditor.children);
        const discussionsJson = JSON.stringify(plateEditor.getOption(discussionPlugin, 'discussions') || []);
        const changed =
          contentJson !== lastSavedContent.current || discussionsJson !== lastSavedDiscussions.current;

        if (changed) {
          scheduleAutoSave(contentJson, discussionsJson);
        }
      },
      [complaintId, readOnly, scheduleAutoSave]
    );

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
        <Plate editor={editor} onChange={handlePlateChange}>
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
