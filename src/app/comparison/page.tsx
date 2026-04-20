import { ComparisonView } from '@/components/comparison/ComparisonView';

export default function ComparisonPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <ComparisonView />
    </div>
  );
}
