import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Administrator access required"
      description="Your account does not have permission to open this area. Ask an administrator if you need access."
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to console</Link>
        </Button>
      }
      className="py-24"
    />
  );
}
