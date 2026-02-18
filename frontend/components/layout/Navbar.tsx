'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { LogOut, BarChart3, CreditCard, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-6">
        <h2 className="text-lg font-semibold">AI Job Monitoring System</h2>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin/analytics">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="ghost" size="sm" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
