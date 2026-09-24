import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { X } from "lucide-react";

interface DrawerFormProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function DrawerForm({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: DrawerFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className={`${sizeClasses[size]} p-0 flex flex-col`} side="right">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
              {description && (
                <SheetDescription className="mt-1">{description}</SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          {children}
        </ScrollArea>
        
        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface FormFooterProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function FormFooter({
  onCancel,
  onSubmit,
  submitLabel = "Lưu",
  cancelLabel = "Hủy",
  loading = false,
  disabled = false,
}: FormFooterProps) {
  return (
    <div className="flex items-center justify-end space-x-3">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={disabled || loading}
        loading={loading}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
