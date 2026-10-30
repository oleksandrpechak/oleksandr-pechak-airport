import { Compass } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you are looking for does not exist or has moved."
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to console</Link>
        </Button>
      }
      className="py-24"
    />
  );
}
