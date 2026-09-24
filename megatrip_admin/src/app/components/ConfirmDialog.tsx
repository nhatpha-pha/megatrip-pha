import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive";
  requireConfirmation?: boolean;
  confirmationText?: string;
  requireCheckbox?: boolean;
  checkboxText?: string;
}

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  variant = "default",
  requireConfirmation = false,
  confirmationText = "DELETE",
  requireCheckbox = false,
  checkboxText = "Tôi hiểu hành động này không thể hoàn tác",
}: ConfirmDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const isConfirmDisabled = () => {
    if (requireConfirmation && confirmInput !== confirmationText) return true;
    if (requireCheckbox && !isChecked) return true;
    return false;
  };

  const handleConfirm = () => {
    if (!isConfirmDisabled()) {
      onConfirm();
      setConfirmInput("");
      setIsChecked(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    setConfirmInput("");
    setIsChecked(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            {variant === "destructive" && (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {(requireConfirmation || requireCheckbox) && (
          <div className="space-y-4">
            {requireConfirmation && (
              <div className="space-y-2">
                <Label htmlFor="confirm-input">
                  Để xác nhận, vui lòng nhập &quot;{confirmationText}&quot;
                </Label>
                <Input
                  id="confirm-input"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={confirmationText}
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
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}