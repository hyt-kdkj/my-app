// components/ui/card.tsx
'use client';
import React from 'react';

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`border rounded-lg shadow-sm bg-white dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`p-4 border-b ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 {...props} className={`text-lg font-bold ${className}`}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={`text-sm text-gray-500 dark:text-gray-300 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`p-4 ${className}`}>
      {children}
    </div>
  );
}
