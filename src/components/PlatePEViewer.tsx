"use client";

import * as React from "react";
import { normalizeNodeId } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { EditorKit } from "@/components/editor-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { discussionPlugin } from "@/components/discussion-kit";

interface PlatePEViewerProps {
  content: string | null;
  complaintId?: number;
  discussions?: any[];
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

function parseContent(content: string | null) {
  if (!content) return [{ type: "p", children: [{ text: "No content available" }] }];
  
  // Try to parse as JSON first (PlateJS native format)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, might be plain text
  }
  
  // If it's HTML, convert to simple paragraphs for backward compatibility
  if (content.includes('<') && content.includes('>')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const text = doc.body.textContent || content;
      const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      return lines.length > 0 
        ? lines.map((line) => ({ type: "p", children: [{ text: line }] }))
        : [{ type: "p", children: [{ text: content }] }];
    } catch (e) {
      // Fall through to plain text handling
    }
  }
  
  // Treat as plain text
  const lines = content.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  return lines.length > 0 
    ? lines.map((line) => ({ type: "p", children: [{ text: line }] }))
    : [{ type: "p", children: [{ text: content }] }];
}

export function PlatePEViewer({ content, complaintId, discussions, user }: PlatePEViewerProps) {
  const value = React.useMemo(() => {
    const nodes = parseContent(content);
    return normalizeNodeId(nodes as any);
  }, [content]);

  const editor = usePlateEditor({ 
    plugins: EditorKit, 
    value,
    readOnly: true // Make it read-only
  });

  // Configure discussion plugin for viewing comments
  const discussionsInitialized = React.useRef(false);
  
  React.useEffect(() => {
    if (editor && !discussionsInitialized.current) {
      try {
        // Set discussion plugin options for viewing
        if (user) {
          editor.setOption(discussionPlugin, 'currentUserId', user.id);
          editor.setOption(discussionPlugin, 'users', {
            ...editor.getOption(discussionPlugin, 'users'),
            [user.id]: {
              id: user.id,
              name: user.name || user.email || 'User',
              avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`,
            },
          });
        }
        // Load discussions
        editor.setOption(discussionPlugin, 'discussions', discussions || []);
        discussionsInitialized.current = true;
      } catch (e) {
        console.log('Error configuring discussion plugin in viewer:', e);
      }
    }
  }, [editor, discussions, user]);

  return (
    <div className="plate-pe-viewer">
      <Plate editor={editor}>
        <EditorContainer>
          <Editor variant="default" readOnly />
        </EditorContainer>
      </Plate>
    </div>
  );
}
