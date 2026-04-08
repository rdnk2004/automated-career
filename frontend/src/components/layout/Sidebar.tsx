import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Linkedin, Github, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Linkedin, label: 'LinkedIn', href: '/linkedin' },
  { icon: Github, label: 'GitHub', href: '/github' },
  { icon: FileText, label: 'Resume', href: '/resume' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tighter">Career OS</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
