
// src/components/fiverr-ace/GigResultSection.tsx
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GigResultSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
}

export function GigResultSection({ title, icon: Icon, children, className, contentClassName, titleClassName }: GigResultSectionProps) {
  return (
    <Card className={cn("shadow-xl w-full bg-card border-border overflow-hidden rounded-xl", className)}>
      <CardHeader className="p-0">
        <CardTitle className={cn(
            "flex items-center text-xl font-semibold text-primary-foreground bg-primary p-5 rounded-t-xl",
            titleClassName
          )}>
          <Icon className="mr-3 h-6 w-6 text-primary-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("pt-5 p-5 md:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
