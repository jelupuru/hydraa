'use client';

import { useMemo } from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { EditorKit } from './editor-kit';
import { EditorContainer, Editor } from './ui/editor';

interface PlateNoticeViewerProps {
  content: string | null;
}

export function PlateNoticeViewer({ content }: PlateNoticeViewerProps) {
  const parsedContent = useMemo(() => {
    if (!content) {
      return [{ type: 'p', children: [{ text: 'No content available' }] }];
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      // If not JSON, treat as plain text
      return [{ type: 'p', children: [{ text: content }] }];
    }

    return [{ type: 'p', children: [{ text: 'Invalid content format' }] }];
  }, [content]);

  const editor = usePlateEditor({
    plugins: [...EditorKit],
    value: parsedContent,
    readOnly: true,
  });

  return (
    <div className="w-full">
      <Plate editor={editor}>
        <EditorContainer>
          <Editor readOnly />
        </EditorContainer>
      </Plate>
    </div>
  );
}
