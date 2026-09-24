import { useState, useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link, Code, Image, Video, Type } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text: string) => void;
}

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt: string) => void;
}

function LinkDialog({ isOpen, onClose, onInsert }: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleInsert = () => {
    if (url.trim()) {
      onInsert(url.trim(), text.trim() || url.trim());
      setUrl("");
      setText("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm liên kết</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label htmlFor="text">Văn bản hiển thị</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Văn bản liên kết"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleInsert}>
              Chèn liên kết
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImageDialog({ isOpen, onClose, onInsert }: ImageDialogProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleInsert = () => {
    if (url.trim()) {
      onInsert(url.trim(), alt.trim() || "Hình ảnh");
      setUrl("");
      setAlt("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm hình ảnh</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="imageUrl">URL hình ảnh</Label>
            <Input
              id="imageUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label htmlFor="alt">Văn bản thay thế</Label>
            <Input
              id="alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Mô tả hình ảnh"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleInsert}>
              Chèn hình ảnh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Nhập nội dung...", 
  className,
  disabled = false 
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [headingLevel, setHeadingLevel] = useState("p");

  // Track selection for formatting
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  const insertText = (before: string, after: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const formatBold = () => insertText("**", "**");
  const formatItalic = () => insertText("*", "*");
  const formatUnderline = () => insertText("<u>", "</u>");
  const formatCode = () => insertText("`", "`");

  const formatList = () => {
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const lineIndex = value.substring(0, start).split('\n').length - 1;
    
    if (lines[lineIndex] && !lines[lineIndex].startsWith('- ')) {
      lines[lineIndex] = '- ' + lines[lineIndex];
      onChange(lines.join('\n'));
    }
  };

  const formatOrderedList = () => {
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const lineIndex = value.substring(0, start).split('\n').length - 1;
    
    if (lines[lineIndex] && !lines[lineIndex].match(/^\d+\. /)) {
      lines[lineIndex] = '1. ' + lines[lineIndex];
      onChange(lines.join('\n'));
    }
  };

  const formatHeading = (level: string) => {
    if (level === "p") return;
    
    const hashes = "#".repeat(parseInt(level));
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const lineIndex = value.substring(0, start).split('\n').length - 1;
    
    if (lines[lineIndex]) {
      // Remove existing heading markers
      lines[lineIndex] = lines[lineIndex].replace(/^#+\s*/, '');
      // Add new heading
      lines[lineIndex] = `${hashes} ${lines[lineIndex]}`;
      onChange(lines.join('\n'));
    }
  };

  const insertLink = (url: string, text: string) => {
    insertText(`[${text}](${url})`);
  };

  const insertImage = (url: string, alt: string) => {
    insertText(`![${alt}](${url})`);
  };

  const insertVideo = () => {
    const url = prompt("Nhập URL video (YouTube/Vimeo):");
    if (url) {
      insertText(`\n<video src="${url}" controls></video>\n`);
    }
  };

  // Simple HTML sanitization for preview
  const sanitizeHtml = (html: string): string => {
    // Convert Markdown-like syntax to HTML
    return html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex items-center space-x-1 flex-wrap">
        <Select value={headingLevel} onValueChange={(value) => {
          setHeadingLevel(value);
          formatHeading(value);
        }}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Đoạn văn</SelectItem>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 border-l mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatBold}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatItalic}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatUnderline}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="h-6 border-l mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatList}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatOrderedList}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="h-6 border-l mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setLinkDialogOpen(true)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setImageDialogOpen(true)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Image className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertVideo}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Video className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatCode}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-2 divide-x min-h-[200px]">
        {/* Input side */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleSelectionChange}
            placeholder={placeholder}
            disabled={disabled}
            className="border-0 resize-none rounded-none focus:ring-0 focus:border-transparent min-h-[200px] font-mono text-sm"
            style={{ minHeight: '200px' }}
          />
        </div>

        {/* Preview side */}
        <div className="p-3 bg-gray-50 overflow-auto min-h-[200px]">
          <div className="prose prose-sm max-w-none">
            {value ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(value) 
                }} 
              />
            ) : (
              <p className="text-gray-400 italic">Xem trước sẽ hiển thị ở đây</p>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <LinkDialog
        isOpen={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onInsert={insertLink}
      />

      <ImageDialog
        isOpen={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={insertImage}
      />
    </div>
  );
}

export default RichTextEditor;
