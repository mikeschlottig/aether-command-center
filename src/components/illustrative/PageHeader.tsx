import React from 'react';
import { cn } from '@/lib/utils';
interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-2 mb-8 animate-fade-in", className)}>
      <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground relative inline-block">
        {title}
        <div className="absolute -bottom-2 left-0 h-1.5 w-full bg-primary/20 sketch-border -z-10" />
      </h1>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}