import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  PlusSquare,
  QrCode,
  FileText,
  Settings,
  Tractor,
  Users,
  LogOut,
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Menu items with access control
  const menuItems = [
    {
      title: "Tableau de Bord",
      icon: <Home className="h-5 w-5 mr-2" />,
      path: "/",
      access: ["admin", "operator", "client"]
    },
    {
      title: "Nouvelle Entrée",
      icon: <PlusSquare className="h-5 w-5 mr-2" />,
      path: "/new-entry",
      access: ["admin", "operator"]
    },
    {
      title: "Scanner Code",
      icon: <QrCode className="h-5 w-5 mr-2" />,
      path: "/scan",
      access: ["admin", "operator", "client"]
    },
    {
      title: "Rapports",
      icon: <FileText className="h-5 w-5 mr-2" />,
      path: "/reports",
      access: ["admin", "operator"]
    },
    {
      title: "Paramètres",
      icon: <Settings className="h-5 w-5 mr-2" />,
      path: "/settings",
      access: ["admin"]
    }
  ];
  
  const adminItems = [
    {
      title: "Gérer Fermes",
      icon: <Tractor className="h-5 w-5 mr-2" />,
      path: "/farms",
      access: ["admin"]
    },
    {
      title: "Utilisateurs",
      icon: <Users className="h-5 w-5 mr-2" />,
      path: "/users",
      access: ["admin"]
    }
  ];
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.access.includes(user?.role || '')
  );
  
  const filteredAdminItems = adminItems.filter(item => 
    item.access.includes(user?.role || '')
  );
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="bg-neutral-800 text-white w-64 flex-shrink-0 h-screen flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center space-x-2">
          <Leaf className="h-6 w-6 text-primary" />
          <h1 className="font-bold text-xl">Convo Bio</h1>
        </div>
        <p className="text-neutral-400 text-sm">Traçabilité d'Avocat</p>
      </div>
      
      {/* Navigation */}
      <nav className="p-2 flex-grow">
        <div className="py-2 px-4 text-xs text-neutral-500 uppercase">Menu Principal</div>
        <ul>
          {filteredMenuItems.map((item, index) => (
            <li key={index}>
              <Link href={item.path}>
                <a className={cn(
                  "flex items-center p-3 rounded",
                  isActive(item.path) 
                    ? "bg-primary-700 text-white" 
                    : "hover:bg-neutral-700 text-neutral-300"
                )}>
                  {item.icon}
                  <span>{item.title}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
        
        {filteredAdminItems.length > 0 && (
          <>
            <div className="mt-6 py-2 px-4 text-xs text-neutral-500 uppercase">Administration</div>
            <ul>
              {filteredAdminItems.map((item, index) => (
                <li key={index}>
                  <Link href={item.path}>
                    <a className={cn(
                      "flex items-center p-3 rounded",
                      isActive(item.path) 
                        ? "bg-primary-700 text-white" 
                        : "hover:bg-neutral-700 text-neutral-300"
                    )}>
                      {item.icon}
                      <span>{item.title}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
      
      {/* User Menu */}
      <div className="p-4 border-t border-neutral-700">
        <div className="flex items-center space-x-3">
          <Avatar className="bg-primary-500 h-10 w-10">
            <AvatarFallback>{user && getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="font-medium">{user?.fullName}</div>
            <div className="text-sm text-neutral-400">
              {user?.role === 'admin' && 'Administrateur'}
              {user?.role === 'operator' && 'Opérateur'}
              {user?.role === 'client' && 'Client'}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-400 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
