import Layout from './Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function PlaceholderPage({ 
  title, 
  description, 
  icon: Icon = Construction 
}: PlaceholderPageProps) {
  return (
    <>
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{description}</p>
              <p className="text-sm text-muted-foreground">
                Trang này đang được phát triển. Bạn có thể tiếp tục khám phá các tính năng khác hoặc quay lại trang chủ.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link prefetch={false}  href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Về trang chủ
                  </Link>
                </Button>
                <Button>
                  Yêu cầu phát triển
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
