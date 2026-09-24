import React, { useRef, useMemo, useCallback } from "react";
import JoditEditor from "jodit-react";

interface JoditEditorWrapperProps {
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
}

const JoditEditorWrapper: React.FC<JoditEditorWrapperProps> = ({
    value,
    onChange,
    placeholder,
}) => {
    const editor = useRef<any>(null);

    const config = useMemo(() => ({
        iframe: true,
        readonly: false,
        placeholder: placeholder || "Start typing...",
        height: 400,
        buttons: [
            "bold",
            "italic",
            "underline",
            "|",
            "ul",
            "ol",
            "|",
            "outdent",
            "indent",
            "|",
            "font",
            "fontsize",
            "brush",
            "paragraph",
            "|",
            "image",
            "link",
            "|",
            "align",
            "undo",
            "redo",
            "|",
            "cut",
            "copy",
            "paste",
            "|",
            "hr",
            "symbol",
            "source",
        ],
        toolbarAdaptive: false,
        iframeStyle: `
            body {
                font-family: Inter, sans-serif;
            }
            img {
                display: block;
                margin: 20px auto;
                max-width: 100%;
                height: auto;
            }
        `,
        uploader: {
            insertImageAsBase64URI: true,
            imagesExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
        },
        allowDragAndDropFiles: true,
        convertToXhtml: false,
        // ...existing code...

        // events: {
        //     beforePaste: function (pasteEvent: ClipboardEvent) {
        //         const self = this;
        //         pasteEvent.preventDefault();
        //         pasteEvent.stopPropagation();
        //         const clipboardData = pasteEvent.clipboardData;
        //         if (!clipboardData) return;
        //         const files = Array.from(clipboardData.files || []);
        //         if (files.length) {
        //             files.forEach((file: File) => {
        //                 if (/^image\//.test(file.type)) {
        //                     const reader = new FileReader();
        //                     reader.onload = (loadEvent: ProgressEvent<FileReader>) => {
        //                         const img = self.createInside.element('img') as HTMLImageElement;
        //                         img.src = loadEvent.target?.result as string;
        //                         self.selection.insertImage(img);
        //                     };
        //                     reader.readAsDataURL(file);
        //                 }
        //             });
        //         } else {
        //             let html = clipboardData.getData('text/html');
        //             if (html) {
        //                 const doc = new DOMParser().parseFromString(html, 'text/html');
        //                 html = doc.body.innerHTML;
        //                 self.selection.insertHTML(html);
        //             } else {
        //                 const text = clipboardData.getData('text/plain');
        //                 if (text) {
        //                     self.selection.insertHTML(text.replace(/\n/g, '<br>'));
        //                 }
        //             }
        //         }
        //     },
        // },

        // ...existing code...
    }), [placeholder]);

    const handleChange = useCallback((newContent: string) => {
        onChange(newContent);
    }, [onChange]);

    return (
        <JoditEditor
            ref={editor}
            value={typeof value === "string" ? value : ""}
            config={config}
            onChange={handleChange}
        />
    );
};

export default JoditEditorWrapper;