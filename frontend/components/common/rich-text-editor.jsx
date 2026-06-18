'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Eraser,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RichTextEditor({ value, onChange, placeholder = 'İçerik yazın...' }) {
  const editorRef = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  // Sync initial value once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  // Sync value if updated externally (but avoid cursor jumping)
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      if (editorRef.current.innerHTML !== value) {
        // If empty or new value, update
        if (!value || editorRef.current.innerHTML === '<br>' || editorRef.current.innerHTML === '') {
          editorRef.current.innerHTML = value;
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      onChange(currentHtml === '<br>' ? '' : currentHtml);
      updateActiveStyles();
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const updateActiveStyles = () => {
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  };

  const addLink = () => {
    const url = prompt('URL girin:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/20 border-b border-border shrink-0 select-none">
        <Button
          type="button"
          variant={activeStyles.bold ? 'primary' : 'dim'}
          size="xs"
          onClick={() => executeCommand('bold')}
          className="h-7 w-7 p-0"
          title="Kalın"
        >
          <Bold className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant={activeStyles.italic ? 'primary' : 'dim'}
          size="xs"
          onClick={() => executeCommand('italic')}
          className="h-7 w-7 p-0"
          title="Eğik (İtalik)"
        >
          <Italic className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant={activeStyles.underline ? 'primary' : 'dim'}
          size="xs"
          onClick={() => executeCommand('underline')}
          className="h-7 w-7 p-0"
          title="Altı Çizili"
        >
          <Underline className="size-3.5" />
        </Button>

        <span className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('insertUnorderedList')}
          className="h-7 w-7 p-0"
          title="Madde İşaretli Liste"
        >
          <List className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('insertOrderedList')}
          className="h-7 w-7 p-0"
          title="Numaralı Liste"
        >
          <ListOrdered className="size-3.5" />
        </Button>

        <span className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('formatBlock', '<h1>')}
          className="h-7 w-7 p-0 font-bold text-xs"
          title="Başlık 1"
        >
          <Heading1 className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('formatBlock', '<h2>')}
          className="h-7 w-7 p-0 font-bold text-xs"
          title="Başlık 2"
        >
          <Heading2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('formatBlock', '<h3>')}
          className="h-7 w-7 p-0 font-bold text-xs"
          title="Başlık 3"
        >
          <Heading3 className="size-3.5" />
        </Button>

        <span className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('justifyLeft')}
          className="h-7 w-7 p-0"
          title="Sola Hizala"
        >
          <AlignLeft className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('justifyCenter')}
          className="h-7 w-7 p-0"
          title="Ortala"
        >
          <AlignCenter className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('justifyRight')}
          className="h-7 w-7 p-0"
          title="Sağa Hizala"
        >
          <AlignRight className="size-3.5" />
        </Button>

        <span className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={addLink}
          className="h-7 w-7 p-0"
          title="Bağlantı Ekle"
        >
          <Link className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('formatBlock', '<pre>')}
          className="h-7 w-7 p-0"
          title="Kod Bloğu"
        >
          <Code className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="dim"
          size="xs"
          onClick={() => executeCommand('removeFormat')}
          className="h-7 w-7 p-0"
          title="Biçimlendirmeyi Temizle"
        >
          <Eraser className="size-3.5" />
        </Button>

        <span className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant={htmlMode ? 'primary' : 'dim'}
          size="xs"
          onClick={() => setHtmlMode(!htmlMode)}
          className="h-7 px-2 flex items-center gap-1 text-[10px]"
          title="HTML Kaynağı"
        >
          <FileCode className="size-3.5" /> HTML
        </Button>
      </div>

      {/* Editable Area */}
      <div className="relative flex-1 min-h-[200px] flex flex-col">
        {htmlMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full flex-1 p-4 bg-muted/10 font-mono text-xs focus:outline-hidden resize-y min-h-[200px]"
            placeholder="HTML Kodunu buraya yazın..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyUp={updateActiveStyles}
            onMouseUp={updateActiveStyles}
            className="w-full flex-1 p-4 focus:outline-hidden min-h-[200px] overflow-y-auto text-sm prose dark:prose-invert max-w-none break-words"
            placeholder={placeholder}
            style={{ outline: 'none' }}
          />
        )}
      </div>
    </div>
  );
}
