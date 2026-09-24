import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";
import { X, Save, Eye } from "lucide-react";

interface ExtraAction {
  text: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  icon?: ReactNode;
}

interface ModalFormProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  mode?: "create" | "edit" | "view";
  size?: "small" | "medium" | "large" | "full";
  tabs?: Array<{ key: string; label: string; content: ReactNode }>;
  onSubmit?: () => void;
  onSaveAndClose?: () => void;
  submitDisabled?: boolean;
  submitText?: string;
  cancelText?: string;
  extraActions?: ExtraAction[];
  className?: string;
}

const modalSizes = {
  small: "max-w-[50%] w-full",
  medium: "max-w-[70%] w-full",
  large: "max-w-[95%] max-h-[90vh] w-full h-full",
  full: "max-w-[95%] max-h-[90vh] w-full h-full",
};

export function ModalForm({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  mode = "create",
  size = "medium",
  tabs,
  onSubmit,
  onSaveAndClose,
  submitDisabled = false,
  submitText,
  cancelText = "Hủy",
  extraActions = [],
  className,
}: ModalFormProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.key || "");

  const isReadOnly = mode === "view";

  const getButtonText = () => {
    switch (mode) {
      case "create":
        return "Tạo mới";
      case "edit":
        return "Cập nhật";
      case "view":
        return "Đóng";
      default:
        return "Lưu";
    }
  };

  const handleSubmit = () => {
    if (isReadOnly) {
      onOpenChange?.(false);
    } else {
      onSubmit?.();
    }
  };

  // Determine if footer actions should be hidden (for view-only mode)
  const hideFooterActions = mode === "view" && !onSubmit && !onSaveAndClose && (!extraActions || extraActions.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={cn(
          modalSizes[size],
          size === "large" && "p-0 gap-0",
          className
        )}
        hideCloseButton={size === "large" || size === "full"}
      >
        {size === "large" || size === "full" ? (
          <div className="flex flex-col h-full">
            {/* Custom header for large modals */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange?.(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {tabs ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {tabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key} className="mt-0">
                      {tab.content}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                children
              )}
            </div>

            {/* Footer for large modals */}
            {!hideFooterActions && !isReadOnly && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange?.(false)}
                    disabled={submitDisabled}
                  >
                    {cancelText}
                  </Button>
                  {extraActions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      onClick={action.onClick}
                      disabled={submitDisabled}
                    >
                      {action.icon}
                      {action.text}
                    </Button>
                  ))}
                  {!isReadOnly && (
                    <>
                      {onSaveAndClose && (
                        <Button
                          variant="outline"
                          onClick={onSaveAndClose}
                          disabled={submitDisabled}
                        >
                          Lưu nháp
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmit}
                        disabled={submitDisabled}
                        loading={submitDisabled}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {submitText || getButtonText()}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>

            <div className="py-4">
              {tabs ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {tabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key} className="mt-0">
                      {tab.content}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                children
              )}
            </div>

            {/* Footer for small/medium modals */}
            {!hideFooterActions && (
              <DialogFooter>
                <div className="flex items-center justify-end space-x-3 w-full">
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange?.(false)}
                      disabled={submitDisabled}
                    >
                      {isReadOnly ? "Đóng" : cancelText}
                    </Button>
                  )}
                  {extraActions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      onClick={action.onClick}
                      disabled={submitDisabled}
                    >
                      {action.icon}
                      {action.text}
                    </Button>
                  ))}
                  {!isReadOnly && (
                    <>
                      {onSaveAndClose && mode === "create" && (
                        <Button
                          variant="outline"
                          onClick={onSaveAndClose}
                          disabled={submitDisabled}
                        >
                          Lưu nháp
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmit}
                        disabled={submitDisabled}
                        loading={submitDisabled}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {submitText || getButtonText()}
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
