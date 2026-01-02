'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { getCommentKey } from '@platejs/comment';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { serializeHtml } from 'platejs/static';
import { discussionPlugin } from '@/components/discussion-kit';
import { EditorKit } from './editor-kit';
import { EditorContainer, Editor } from './ui/editor';
import { toast } from 'sonner';

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
  onDiscussionsChange?: (discussions: any[]) => void;
}

export interface PlateNoticeEditorRef {
  getJson: () => Promise<string>;
  getHtml: () => Promise<string>;
  getDiscussions: () => any[];
}

export const PlateNoticeEditor = forwardRef<PlateNoticeEditorRef, PlateNoticeEditorProps>(
  ({ user, complaintId, initialValue, onChange, readOnly = false, initialDiscussions, usersData, onDiscussionsChange }, ref) => {
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

    const discussionsInitialized = useRef(false);
    const lastDiscussionsRef = useRef<string>('[]');
    const discussionsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (discussionsDebounce.current) clearTimeout(discussionsDebounce.current);
      };
    }, []);

    const editor = usePlateEditor({
      plugins: EditorKit,
      value,
      readOnly,
    });

    const enrichDiscussions = (discussions: any[]) => {
      try {
        const usersMap = editor.getOption(discussionPlugin, 'users') || {};
        return (discussions || []).map((d) => ({
          ...d,
          userName: d.userName || usersMap?.[d.userId]?.name || d.name,
          userEmail: d.userEmail || usersMap?.[d.userId]?.email,
          user: d.user || usersMap?.[d.userId] || d.user,
          comments: (d.comments || []).map((c: any) => ({
            ...c,
            userName: c.userName || usersMap?.[c.userId]?.name || c.name,
            userEmail: c.userEmail || usersMap?.[c.userId]?.email,
            user: c.user || usersMap?.[c.userId] || c.user,
          })),
        }));
      } catch {
        return discussions || [];
      }
    };

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

          const resolveName = (entry: any, fallbackId: string) => {
            return (
              entry?.user?.name ||
              entry?.userName ||
              entry?.name ||
              entry?.user?.fullName ||
              entry?.user?.email ||
              entry?.email ||
              `User ${fallbackId.substring(0, 6)}`
            );
          };

          // Add all users from existing discussions
          initialDisc.forEach((discussion: any) => {
            if (discussion.userId) {
              const uid = discussion.userId;
              if (!usersMap[uid]) {
                usersMap[uid] = {
                  id: uid,
                  name: resolveName(discussion, uid),
                  avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${uid}`,
                };
              }
            }

            discussion.comments?.forEach((comment: any) => {
              if (comment.userId) {
                const uid = comment.userId;
                if (!usersMap[uid]) {
                  usersMap[uid] = {
                    id: uid,
                    name: resolveName(comment, uid),
                    avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${uid}`,
                  };
                }
              }
            });
          });

          // Set discussion plugin options
          editor.setOption(discussionPlugin, 'currentUserId', user.id);
          editor.setOption(discussionPlugin, 'users', usersMap);
          editor.setOption(discussionPlugin, 'discussions', initialDisc);
          // restore marks so existing discussions render
          initialDisc.forEach((discussion: any) => {
            if (!discussion?.id || !discussion.documentContent) return;
            const targets: number[][] = [];
            const scan = (nodes: any[], path: number[] = []) => {
              nodes.forEach((n, idx) => {
                const p = [...path, idx];
                if (n.text && n.text.trim() === discussion.documentContent.trim()) {
                  targets.push(p);
                }
                if (n.children) scan(n.children, p);
              });
            };
            scan(editor.children);
            targets.forEach((p) => {
              try {
                editor.tf.setNodes({ [getCommentKey(discussion.id)]: true }, { at: p });
              } catch (err) {
                console.warn('mark restore failed', err);
              }
            });
          });

          discussionsInitialized.current = true;
          lastDiscussionsRef.current = JSON.stringify(enrichDiscussions(initialDisc));
        } catch (e) {
          console.log('Error configuring discussion plugin:', e);
        }
      }
    }, [user, editor, initialDiscussions, usersData]);

    // Async auto-save for discussions
    useEffect(() => {
      let debounceId: ReturnType<typeof setTimeout> | null = null;

      const check = () => {
        try {
          if (!onDiscussionsChange || readOnly || !discussionsInitialized.current) return;
          const current = editor.getOption(discussionPlugin, 'discussions') || [];
          const enriched = enrichDiscussions(current);
          const currentJson = JSON.stringify(enriched);
          const changed = currentJson !== lastDiscussionsRef.current;
          if (changed) {
            lastDiscussionsRef.current = currentJson;
            if (debounceId) clearTimeout(debounceId);
            debounceId = setTimeout(() => {
              try {
                onDiscussionsChange(enriched);
                toast.success('Notice discussions saved', { id: 'notice-discussions-save' });
              } catch (err2) {
                console.error('[NoticeEditor] discussions auto-save callback failed', err2);
                toast.error('Failed to save discussions');
              }
            }, 800);
          }
        } catch (err) {
          console.error('Error checking discussions', err);
        }
      };

      const intervalId = setInterval(check, 600);
      return () => {
        clearInterval(intervalId);
        if (debounceId) clearTimeout(debounceId);
      };
    }, [editor, onDiscussionsChange, readOnly]);

    useImperativeHandle(ref, () => ({
      getJson: async () => {
        return JSON.stringify(editor.children);
      },
      getHtml: async () => {
        try {
          const html = await serializeHtml(editor);
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

    const handlePlateChange = useCallback(
      ({ editor: plateEditor }: { editor: typeof editor }) => {
        if (!plateEditor) return;

        if (onChange && !readOnly) {
          try {
            const json = JSON.stringify(plateEditor.children);
            onChange(json);
          } catch (e) {
            console.error('Error stringifying value:', e);
          }
        }

        if (onDiscussionsChange && !readOnly && discussionsInitialized.current) {
          try {
            const current = plateEditor.getOption(discussionPlugin, 'discussions') || [];
            const enriched = enrichDiscussions(current);
            const currentJson = JSON.stringify(enriched);
            const changed = currentJson !== lastDiscussionsRef.current;
            if (changed) {
              lastDiscussionsRef.current = currentJson;
              if (discussionsDebounce.current) clearTimeout(discussionsDebounce.current);
              discussionsDebounce.current = setTimeout(() => {
                try {
                  onDiscussionsChange(enriched);
                  toast.success('Notice discussions saved', { id: 'notice-discussions-save' });
                } catch (err2) {
                  console.error('[NoticeEditor] discussions auto-save callback failed', err2);
                  toast.error('Failed to save discussions');
                }
              }, 800);
            }
          } catch (err) {
            console.error('Error checking discussions (onChange)', err);
          }
        }
      },
      [onChange, onDiscussionsChange, readOnly]
    );

    return (
      <div className="w-full">
        <Plate editor={editor} onChange={handlePlateChange}>
          <EditorContainer>
            <Editor placeholder={readOnly ? "" : "Type your notice content here..."} readOnly={readOnly} />
          </EditorContainer>
        </Plate>
      </div>
    );
  }
);

PlateNoticeEditor.displayName = 'PlateNoticeEditor';
