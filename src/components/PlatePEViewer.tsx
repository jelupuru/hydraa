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
        const discussionsList = discussions || [];
        
        // Build users object from current user and all users in discussions
        const usersMap: Record<string, any> = {};
        
        if (user) {
          usersMap[user.id] = {
            id: user.id,
            name: user.name || user.email || 'User',
            avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`,
          };
          editor.setOption(discussionPlugin, 'currentUserId', user.id);
        }
        
        // Add all users from discussions
        discussionsList.forEach((discussion: any) => {
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
        
        // Set users and discussions
        editor.setOption(discussionPlugin, 'users', usersMap);
        editor.setOption(discussionPlugin, 'discussions', discussionsList);
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
