import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, RotateCcw, Move } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { cn } from "../lib/utils";
import { useToast } from "./ui/use-toast";

// ...existing code...
interface ImageFile {
  id: string;

  file?: File | null | undefined;
  url: string;
  alt?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface ImageUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  accept?: string;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

export function ImageUploader({
  value = [],
  onChange,
  maxFiles = 10,
  maxSizePerFile = 5,
  accept = "image/*",
  className,
  disabled = false,
  hint,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // stable ref for onChange to avoid triggering effects when parent passes new function identity
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // base API for upload (adjust via NEXT_PUBLIC_API_BASE_URL)
  // const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "http://localhost:8080";
  // base API for upload (use NEXT_PUBLIC_API_BASE if set, fallback to 7700)
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) || (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "http://localhost:8080";
  // sync incoming value (array of URLs) into internal preview state
  // sync incoming value (array of URLs) into internal preview state
  useEffect(() => {
    const urls = Array.isArray(value) ? value : [];
    setImages(prev => {
      const prevUrls = prev.map(p => p.url);
      if (urls.length === prevUrls.length && urls.every((u, i) => u === prevUrls[i])) return prev;
      return urls.map((url, idx) => ({
        id: `init_${idx}_${url}`,
        file: null,
        url,
        uploading: false,
        progress: 100,
      }));
    });
    // intentionally NOT depending on onChange to avoid re-running when parent handler identity changes
  }, [value]);
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return "Chỉ cho phép tải lên file hình ảnh";
    }
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `File quá lớn. Kích thước tối đa: ${maxSizePerFile}MB`;
    }
    return null;
  };

  // upload single file to server with XHR to get progress events
  const uploadImage = async (file: File, id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const formData = new FormData();
        // server expects field name "images" (upload.array('images'))
        formData.append("images", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/api/upload`, true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setImages(prev =>
              prev.map(img => img.id === id ? { ...img, progress: percent } : img)
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const body = JSON.parse(xhr.responseText);
              console.debug('[ImageUploader] upload response:', body);
              let url: string | undefined;
              if (body && body.success && Array.isArray(body.data) && body.data.length > 0) {
                url = body.data[0].secure_url || body.data[0].url || body.data[0];
                if (typeof url !== "string" && typeof body.data[0] === "string") url = body.data[0];
              } else if (body && (body.secure_url || body.url)) {
                url = body.secure_url || body.url;
              } else if (typeof body === "string") {
                url = body;
              }
              if (body && body.success && Array.isArray(body.data) && body.data.length > 0) {
                // const url = body.data[0].url || body.data[0].secure_url;
                // setImages(prev =>
                //   prev.map(img => img.id === id ? { ...img, uploading: false, progress: 100, url } : img)
                // );
                // // call onChange with current uploaded URLs
                // setTimeout(() => {
                //   setImages(curr => {
                //     onChange?.(curr.filter(i => !i.error).map(i => i.url));
                //     return curr;
                //   });
                // }, 0);
                // resolve(url);
                if (!url) {
                  const errMsg = body?.message || "Upload failed (no url returned)";
                  setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: errMsg } : img));
                  reject(new Error(errMsg));
                  return;
                }

                // Update uploaded image entry
                setImages(prev =>
                  prev.map(img => img.id === id ? { ...img, uploading: false, progress: 100, url } : img)
                );
                // notify parent with current uploaded URLs (use ref to avoid dependency loops)
                setTimeout(() => {
                  const urls = (images /* closure snapshot */ || []).map(i => i).concat([]); // noop to satisfy types
                  // compute fresh urls from latest state
                  setImages(curr => {
                    const uploaded = curr.filter(i => !i.error && !i.uploading).map(i => i.url);
                    try { onChangeRef.current?.(uploaded); } catch { /* ignore */ }
                    return curr;
                  });
                }, 0);
                resolve(url);
              } else {
                const errMsg = body?.message || "Upload failed";
                setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: errMsg } : img));
                reject(new Error(errMsg));
              }
            } catch (err) {
              setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: "Invalid server response" } : img));
              reject(err);
            }
          } else {
            const errText = `Upload failed (${xhr.status})`;
            setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: errText } : img));
            reject(new Error(errText));
          }
        };

        xhr.onerror = () => {
          const errText = "Network error during upload";
          setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: errText } : img));
          reject(new Error(errText));
        };

        xhr.send(formData);
      } catch (err) {
        setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: "Upload exception" } : img));
        reject(err);
      }
    });
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - images.length;

    if (fileArray.length > remainingSlots) {
      toast({
        title: "Quá nhiều file",
        description: `Chỉ có thể tải lên tối đa ${maxFiles} hình ảnh. Còn lại ${remainingSlots} vị trí.`,
        variant: "destructive"
      });
      return;
    }

    const newImages: ImageFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "File không hợp lệ",
          description: error,
          variant: "destructive"
        });
        continue;
      }

      const imageId = file.name + Date.now() + Math.random();
      const imageFile: ImageFile = {
        id: imageId,
        file,
        url: URL.createObjectURL(file), // preview until uploaded
        uploading: true,
        progress: 0,
      };

      newImages.push(imageFile);
    }

    // append previews; do NOT call onChange yet (we will notify after upload completes)
    setImages(prev => [...prev, ...newImages]);

    // Upload files sequentially (you can parallelize if desired)
    for (const imageFile of newImages) {
      if (imageFile.file) {
        try {
          await uploadImage(imageFile.file, imageFile.id);
        } catch (error) {
          toast({
            title: "Upload thất bại",
            description: `Không thể upload ${imageFile.file.name}`,
            variant: "destructive"
          });
        }
      }
    }
  }, [images.length, maxFiles, disabled, toast, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // const removeImage = (id: string) => {
  //   setImages(prev => {
  //     const updated = prev.filter(img => img.id !== id);
  //     // emit after state applied
  //     setTimeout(() => {
  //       const urls = updated.filter(i => !i.error && !i.uploading).map(i => i.url);
  //       try { onChangeRef.current?.(urls); } catch { }
  //     }, 0);
  //     return updated;
  //   });
  // };
  const removeImage = (id: string) => {
    const img = images.find(i => i.id === id);
    const label = img?.url ? "ảnh này" : "file này";
    if (!confirm(`Bạn có chắc chắn muốn xóa ${label}?`)) return;
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      // emit after state applied
      setTimeout(() => {
        const urls = updated.filter(i => !i.error && !i.uploading).map(i => i.url);
        try { onChangeRef.current?.(urls); } catch { }
      }, 0);
      return updated;
    });
  };
  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      setTimeout(() => {
        const urls = updated.filter(i => !i.error && !i.uploading).map(i => i.url);
        try { onChangeRef.current?.(urls); } catch { }
      }, 0);
      return updated;
    });
  };

  const retryUpload = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image && image.file) {
      setImages(prev =>
        prev.map(img =>
          img.id === id
            ? { ...img, uploading: true, error: undefined, progress: 0 }
            : img
        )
      );
      uploadImage(image.file, id).catch(() => {
        toast({
          title: "Upload thất bại",
          description: `Không thể upload `,
          variant: "destructive"
        });
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Kéo thả hình ảnh vào đây
          </p>
          <p className="text-sm text-gray-500">
            hoặc{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              chọn file
            </button>
          </p>
          <p className="text-xs text-gray-400">
            Tối đa {maxFiles} file, mỗi file &lt; {maxSizePerFile}MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group bg-gray-50 rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={image.url}
                alt={image.alt || `Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Upload Progress */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Progress
                      value={image.progress || 0}
                      className="w-20 mx-auto mb-2"
                    />
                    <p className="text-xs">{image.progress || 0}%</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {image.error && (
                <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-xs mb-2">{image.error}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryUpload(image.id)}
                      className="text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!image.uploading && !image.error && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                    {index > 0 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        onClick={() => moveImage(index, index - 1)}
                      >
                        <Move className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Index Number */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có hình ảnh nào</p>
        </div>
      )}
    </div>
  );
}
