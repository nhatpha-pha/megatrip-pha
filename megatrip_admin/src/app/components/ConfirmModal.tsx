import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { useToast } from "./ui/use-toast";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  type?: "danger" | "warning" | "info";
  requireTyping?: boolean;
  typingText?: string;
  requireCheckbox?: boolean;
  checkboxText?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showUndo?: boolean;
  undoTimeout?: number;
  onClose?: () => void;
  isOpen?: boolean;
  description?: string;
  loading?: boolean; // Add loading prop
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  type = "danger",
  requireTyping = false,
  typingText = "DELETE",
  requireCheckbox = false,
  checkboxText = "Tôi đồng ý với hành động này",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  showUndo = false,
  undoTimeout = 5000,
  loading = false,
  isOpen = false,
  onClose,
  description,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setInputValue("");
      setIsChecked(false);
      setIsConfirming(false);
    }
  }, [open]);

  const canConfirm = () => {
    if (requireTyping && inputValue.toLowerCase() !== typingText.toLowerCase()) {
      return false;
    }
    if (requireCheckbox && !isChecked) {
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!canConfirm()) return;

    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
      
      if (showUndo) {
        const undoToast = toast({
          title: "Hành động đã thực hiện",
          description: (
            <div className="flex items-center justify-between">
              <span>Bạn có thể hoàn tác trong {undoTimeout / 1000}s</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle undo logic here
                  undoToast.dismiss();
                  toast({
                    title: "Đã hoàn tác",
                    description: "Hành động đã được hoàn tác thành công"
                  });
                }}
              >
                Hoàn tác
              </Button>
            </div>
          ),
          duration: undoTimeout,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi thực hiện hành động",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case "danger":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "default";
      default:
        return "destructive";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-left mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {requireTyping && (
            <div className="space-y-2">
              <Label htmlFor="confirm-input">
                Để xác nhận, vui lòng nhập{" "}
                <span className="font-mono font-bold text-red-600">
                  &quot;{typingText}&quot;
                </span>
              </Label>
              <Input
                id="confirm-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={typingText}
                className="font-mono"
                autoComplete="off"
              />
            </div>
          )}

          {requireCheckbox && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-checkbox"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked === true)}
              />
              <Label htmlFor="confirm-checkbox" className="text-sm">
                {checkboxText}
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant() as any}
            onClick={handleConfirm}
            disabled={!canConfirm() || isConfirming}
            loading={isConfirming}
          >
            {type === "danger" && <Trash2 className="w-4 h-4 mr-2" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
