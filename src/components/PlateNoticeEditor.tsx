'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { serializeHtml } from 'platejs/static';
import { discussionPlugin } from '@/components/discussion-kit';
import { EditorKit } from './editor-kit';
import { EditorContainer, Editor } from './ui/editor';

interface PlateNoticeEditorProps {
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role?: string;
  };
  complaintId?: number;
  initialValue?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  initialDiscussions?: any[];
  usersData?: Record<string, { id: string; name: string; email?: string; role?: string }>;
}

export interface PlateNoticeEditorRef {
  getJson: () => Promise<string>;
  getHtml: () => Promise<string>;
  getDiscussions: () => any[];
}

export const PlateNoticeEditor = forwardRef<PlateNoticeEditorRef, PlateNoticeEditorProps>(
  ({ user, complaintId, initialValue, onChange, readOnly = false, initialDiscussions, usersData }, ref) => {
    const value = useRef(
      normalizeNodeId(
        initialValue
          ? (() => {
              try {
                const parsed = JSON.parse(initialValue);
                return Array.isArray(parsed) ? parsed : [{ type: 'p', children: [{ text: '' }] }];
              } catch {
                return [{ type: 'p', children: [{ text: initialValue }] }];
              }
            })()
          : [{ type: 'p', children: [{ text: '' }] }]
      ) as any
    ).current;

    const editor = usePlateEditor({
      plugins: EditorKit,
      value,
      readOnly,
      onChange: (newValue) => {
        if (onChange && !readOnly) {
          try {
            const json = JSON.stringify(newValue.value);
            onChange(json);
          } catch (e) {
            console.error('Error stringifying value:', e);
          }
        }
      },
    });

    // Configure discussion plugin
    const discussionsInitialized = useRef(false);

    useEffect(() => {
      if (user && editor && !discussionsInitialized.current) {
        try {
          const initialDisc = initialDiscussions || [];
          const usersMap: Record<string, any> = usersData ? { ...usersData } : {};

          // Ensure current user is in the map
          if (!usersMap[user.id]) {
            usersMap[user.id] = {
              id: user.id,
              name: user.name || user.email || 'User',
              avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`,
            };
          }

          // Add all users from existing discussions
          initialDisc.forEach((discussion: any) => {
            if (discussion.userId && !usersMap[discussion.userId]) {
              usersMap[discussion.userId] = {
                id: discussion.userId,
                name: `User ${discussion.userId.substring(0, 6)}`,
                avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${discussion.userId}`,
              };
            }

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
          discussionsInitialized.current = true;
        } catch (e) {
          console.log('Error configuring discussion plugin:', e);
        }
      }
    }, [user, editor, initialDiscussions, usersData]);

    useImperativeHandle(ref, () => ({
      getJson: async () => {
        return JSON.stringify(editor.children);
      },
      getHtml: async () => {
        try {
          const html = await serializeHtml(editor, { nodes: editor.children });
          return html;
        } catch (e) {
          console.error('Error getting HTML:', e);
          return '';
        }
      },
      getDiscussions: () => {
        try {
          const discussions = editor.getOption(discussionPlugin, 'discussions') || [];
          return discussions;
        } catch (e) {
          console.error('Error getting discussions:', e);
          return [];
        }
      },
    }));

    return (
      <div className="w-full">
        <Plate editor={editor}>
          <EditorContainer>
            <Editor placeholder={readOnly ? "" : "Type your notice content here..."} readOnly={readOnly} />
          </EditorContainer>
        </Plate>
      </div>
    );
  }
);

PlateNoticeEditor.displayName = 'PlateNoticeEditor';
