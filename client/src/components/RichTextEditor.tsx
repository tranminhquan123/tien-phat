import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';
import {
  isRichTextEmpty,
  prepareRichTextForEditor,
  sanitizeRichTextHtml,
} from '@/utils/richText';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

type ToolbarButtonProps = {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập mô tả sản phẩm...',
  minHeight = 240,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(isRichTextEmpty(value));

  useEffect(() => {
    const prepared = prepareRichTextForEditor(value);
    const editor = editorRef.current;
    if (!editor) return;

    if (editor.innerHTML !== prepared) {
      editor.innerHTML = prepared;
    }

    setEmpty(isRichTextEmpty(prepared));

    if (value !== prepared) {
      onChange(prepared);
    }
  }, [value, onChange]);

  function emitChange() {
    const html = editorRef.current?.innerHTML ?? '';
    setEmpty(isRichTextEmpty(html));
    onChange(html);
  }

  function execute(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function createLink() {
    const selection = window.getSelection();
    if (!selection?.toString().trim()) {
      window.alert('Hãy bôi đen đoạn chữ cần gắn liên kết trước.');
      return;
    }

    const input = window.prompt('Nhập đường dẫn liên kết:');
    if (!input?.trim()) return;

    const url = /^(https?:|mailto:|tel:|\/)/i.test(input.trim())
      ? input.trim()
      : `https://${input.trim()}`;

    execute('createLink', url);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emitChange();
  }

  function handleBlur() {
    const editor = editorRef.current;
    if (!editor) return;

    const sanitized = sanitizeRichTextHtml(editor.innerHTML);
    if (editor.innerHTML !== sanitized) {
      editor.innerHTML = sanitized;
    }

    setEmpty(isRichTextEmpty(sanitized));
    onChange(sanitized);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2">
        <ToolbarButton title="Đoạn văn" onClick={() => execute('formatBlock', 'p')}>
          <span className="text-xs font-bold">P</span>
        </ToolbarButton>
        <ToolbarButton title="Tiêu đề lớn" onClick={() => execute('formatBlock', 'h2')}>
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton title="Tiêu đề nhỏ" onClick={() => execute('formatBlock', 'h3')}>
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="In đậm" onClick={() => execute('bold')}><Bold size={16} /></ToolbarButton>
        <ToolbarButton title="In nghiêng" onClick={() => execute('italic')}><Italic size={16} /></ToolbarButton>
        <ToolbarButton title="Gạch chân" onClick={() => execute('underline')}><Underline size={16} /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Danh sách dấu chấm" onClick={() => execute('insertUnorderedList')}><List size={16} /></ToolbarButton>
        <ToolbarButton title="Danh sách đánh số" onClick={() => execute('insertOrderedList')}><ListOrdered size={16} /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Căn trái" onClick={() => execute('justifyLeft')}><AlignLeft size={16} /></ToolbarButton>
        <ToolbarButton title="Căn giữa" onClick={() => execute('justifyCenter')}><AlignCenter size={16} /></ToolbarButton>
        <ToolbarButton title="Căn phải" onClick={() => execute('justifyRight')}><AlignRight size={16} /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Gắn liên kết" onClick={createLink}><Link2 size={16} /></ToolbarButton>
        <ToolbarButton title="Xóa định dạng" onClick={() => execute('removeFormat')}><Eraser size={16} /></ToolbarButton>
        <ToolbarButton title="Hoàn tác" onClick={() => execute('undo')}><Undo2 size={16} /></ToolbarButton>
        <ToolbarButton title="Làm lại" onClick={() => execute('redo')}><Redo2 size={16} /></ToolbarButton>
      </div>

      <div className="relative">
        {empty && (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-gray-400">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          className="rich-text-editor-content overflow-y-auto px-4 py-3 text-sm text-gray-700 outline-none"
          style={{ minHeight }}
          onInput={emitChange}
          onBlur={handleBlur}
          onPaste={handlePaste}
        />
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-400">
        Bôi đen nội dung rồi chọn công cụ định dạng. Khi dán văn bản, hệ thống giữ lại nội dung và loại bỏ định dạng rác.
      </div>
    </div>
  );
}

function ToolbarButton({ title, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-gray-600 transition-colors hover:bg-white hover:text-brand-600 hover:shadow-sm"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-gray-200" />;
}
