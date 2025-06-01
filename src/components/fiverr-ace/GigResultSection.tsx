
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
  // titleClassName prop is removed as styling is now more specific
}

export function GigResultSection({ title, icon: Icon, children, className, contentClassName }: GigResultSectionProps) {
  return (
    <Card className={cn("shadow-xl w-full bg-card border-border overflow-hidden rounded-xl", className)}>
      <CardHeader className={cn(
          "p-4 flex flex-row items-center space-x-3 rounded-t-xl border-b bg-card" // Header has card background
        )}>
        <div className="bg-primary text-primary-foreground p-2.5 rounded-full flex items-center justify-center shadow-md"> {/* Icon wrapper with green background */}
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-semibold text-primary"> {/* Title text is primary color */}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("pt-5 p-5 md:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
