
import { Bell, Search, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/pages/Index';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b-2 border-border/50 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="hover:bg-logistics-primary/10 hover:text-logistics-primary transition-colors" />
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-10 bg-background/50 border-2 focus:border-logistics-primary transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative hover:bg-logistics-primary/10 hover:text-logistics-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-logistics-accent rounded-full border-2 border-background"></span>
          </Button>

          <ThemeToggle />

          <div className="flex items-center space-x-3 px-3 py-2 bg-logistics-primary/5 rounded-lg border border-logistics-primary/20">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-r from-logistics-primary to-logistics-accent text-white text-sm font-semibold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium">{user.name}</p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={user.role === 'admin' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {user.role === 'admin' ? 'Admin' : 'Data Entry'}
                </Badge>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-logistics-primary/10 hover:text-logistics-primary transition-colors">
                <UserIcon className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-effect border-2 bg-white/95 dark:bg-gray-900/95">
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
