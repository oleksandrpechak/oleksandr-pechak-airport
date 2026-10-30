import { Construction } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/states/empty-state';
import { Card } from '@/components/ui/card';
import type { NavItem } from '@/config/navigation';

export function PlaceholderPage({ item }: { item: NavItem }) {
  return (
    <div className="space-y-4">
      <PageHeader title={item.title} description={item.description} />
      <Card className="py-0">
        <EmptyState
          icon={Construction}
          title={`${item.title} is on the way`}
          description={
            item.plannedPhase
              ? `This module ships in phase ${item.plannedPhase} of the console rollout.`
              : 'This module is not built yet.'
          }
        />
      </Card>
    </div>
  );
}
