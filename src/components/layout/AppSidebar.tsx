import {
  LayoutDashboard,
  Users,
  Calculator,
  FileText,
  CreditCard,
  Truck,
  Database,
  Settings,
  ChevronRight,
  Map,
  Receipt,
  BarChart3,
  UserCog,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { User } from '@/pages/Index';
import { ActiveView } from '@/components/dashboard/Dashboard';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  user: User;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const adminMenuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    id: 'overview' as ActiveView,
  },
  {
    title: 'Clients',
    icon: Users,
    id: 'clients' as ActiveView,
  },
  {
    title: 'Vendors',
    icon: Users,
    id: 'vendors' as ActiveView,
  },
  {
    title: 'User Management',
    icon: UserCog,
    id: 'user-management' as ActiveView,
  },
  {
    title: 'Zone Master',
    icon: Map,
    id: 'zone-master' as ActiveView,
  },
  {
    title: 'Rate Master',
    icon: Calculator,
    id: 'rate-master' as ActiveView,
  },
  {
    title: 'Data Entry',
    icon: Database,
    id: 'data-entry' as ActiveView,
  },
  {
    title: 'All Shipments',
    icon: Database,
    id: 'all-shipments' as ActiveView,
  },
  {
    title: 'Billing',
    icon: CreditCard,
    id: 'billing' as ActiveView,
  },
  {
    title: 'Reports',
    icon: BarChart3,
    id: 'reports' as ActiveView,
  },
  {
    title: 'Rate Calculator',
    icon: FileText,
    id: 'rate-calculator' as ActiveView,
  },
  {
    title: 'Settings',
    icon: SettingsIcon,
    id: 'settings' as ActiveView,
  },
];

const dataEntryMenuItems = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    id: 'overview' as ActiveView,
  },
  {
    title: 'Data Entry',
    icon: Database,
    id: 'data-entry' as ActiveView,
  },
  {
    title: 'My Entries',
    icon: FileText,
    id: 'my-entries' as ActiveView,
  },
  {
    title: 'Rate Calculator',
    icon: Calculator,
    id: 'rate-calculator' as ActiveView,
  },
];

export function AppSidebar({ user, activeView, onViewChange }: AppSidebarProps) {
  const menuItems = user.role === 'admin' ? adminMenuItems : dataEntryMenuItems;

  return (
    <Sidebar className="border-r-2 border-border/50 sidebar-gradient">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-logistics-primary to-logistics-accent rounded-xl flex items-center justify-center shadow-logistics">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold font-poppins bg-gradient-to-r from-logistics-primary to-logistics-accent bg-clip-text text-transparent">
              WFL PVT LTD
            </h2>
            <p className="text-xs text-muted-foreground">Advanced Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={activeView === item.id}
                    className={`w-full justify-start transition-all duration-200 hover:bg-logistics-primary/10 hover:text-logistics-primary group ${
                      activeView === item.id 
                        ? 'bg-logistics-primary/15 text-logistics-primary border-r-2 border-logistics-primary' 
                        : ''
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="bg-logistics-primary/10 rounded-xl p-4 border border-logistics-primary/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-logistics-primary to-logistics-accent rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={user.role === 'admin' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {user.role === 'admin' ? 'Admin' : 'Data Entry'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
