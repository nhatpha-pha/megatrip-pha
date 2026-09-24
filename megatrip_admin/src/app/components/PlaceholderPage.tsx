import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface PlaceholderPageProps {
  title: string;
  description: string;
  moduleName: string;
}

export function PlaceholderPage({ title, description, moduleName }: PlaceholderPageProps) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Module <strong>{moduleName}</strong> đang được phát triển.
            Vui lòng tiếp tục tương tác để yêu cầu triển khai chi tiết cho trang này.
          </p>
          <Button variant="outline" className="w-full">
            Yêu cầu phát triển module này
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
