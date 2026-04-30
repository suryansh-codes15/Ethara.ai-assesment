import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Quote, Code 
} from 'lucide-react';

const MenuButton = ({ onClick, active, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-colors ${
      active 
        ? 'bg-indigo-500/20 text-indigo-400' 
        : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)]'
    }`}
  >
    {children}
  </button>
);

export default function RichTextEditor({ content, onChange, placeholder = 'Write something...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="w-full border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--brand-primary)] transition-all bg-white/[0.02]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 border-b border-[var(--border)] bg-white/[0.01]">
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={16} />
        </MenuButton>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="H1"
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="H2"
        >
          <Heading2 size={16} />
        </MenuButton>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </MenuButton>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code size={16} />
        </MenuButton>
      </div>

      {/* Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-invert max-w-none p-4 min-h-[150px] outline-none"
      />

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--brand-primary);
          padding-left: 1rem;
          font-style: italic;
          color: var(--text-secondary);
        }
        .ProseMirror code {
          background: rgba(255,255,255,0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #0d0d0d;
          color: #fff;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
