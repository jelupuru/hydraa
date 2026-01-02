'use client';

import * as React from 'react';

import { MessageSquareTextIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { commentPlugin } from '@/components/comment-kit';

import { ToolbarButton } from './toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      onMouseDown={(e) => {
        e.preventDefault(); // keep selection
        editor.tf.focus();
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip="Comment"
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  );
}
