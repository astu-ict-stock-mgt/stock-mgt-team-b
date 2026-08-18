import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        <Construction className="h-10 w-10 text-blue-400" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-gray-800">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-400">
        This page is under construction. It will be implemented in a future sprint.
      </p>
    </div>
  );
}
