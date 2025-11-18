// components/ui/label.tsx
'use client';
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { }

export function Label({ className = '', ...props }: LabelProps) {
    return <label {...props} className={`block mb-1 font-medium ${className}`} />;
}
