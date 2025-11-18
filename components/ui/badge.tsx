// components/ui/badge.tsx
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-sm font-medium text-white bg-blue-500 rounded">
      {children}
    </span>
  );
}
