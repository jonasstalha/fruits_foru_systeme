import { Link, useLocation } from "wouter";
import {
  Home,
  PlusSquare,
  QrCode,
  FileText,
  ChartBar,
  Tractor,
  Users,
  PackageCheck,
  Leaf,
  FileBarChart,
  BarChart3,
  Warehouse,
  Map
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  // All menu items with icons
  const menuItems = [
    {
      title: "Tableau de Bord",
      icon: <Home className="h-5 w-5 mr-2" />,
      path: "/",
    },
    {
      title: "Nouvelle Entrée",
      icon: <PlusSquare className="h-5 w-5 mr-2" />,
      path: "/new-entry",
    },
    {
      title: "Scanner Code",
      icon: <QrCode className="h-5 w-5 mr-2" />,
      path: "/scan",
    }
  ];
  
  const traceabilityItems = [
    {
      title: "Gestion Lots",
      icon: <PackageCheck className="h-5 w-5 mr-2" />,
      path: "/lots",
    },
    {
      title: "Rapports PDF",
      icon: <FileText className="h-5 w-5 mr-2" />,
      path: "/reports",
    },
    {
      title: "Statistiques",
      icon: <BarChart3 className="h-5 w-5 mr-2" />,
      path: "/statistics",
    }
  ];
  
  const adminItems = [
    {
      title: "Gérer Fermes",
      icon: <Tractor className="h-5 w-5 mr-2" />,
      path: "/farms",
    },
    {
      title: "Utilisateurs",
      icon: <Users className="h-5 w-5 mr-2" />,
      path: "/users",
    },
    {
      title: "Entrepôts",
      icon: <Warehouse className="h-5 w-5 mr-2" />,
      path: "/warehouses",
    },
    {
      title: "Cartographie",
      icon: <Map className="h-5 w-5 mr-2" />,
      path: "/map",
    }
  ];
  
  return (
    <aside className="bg-neutral-800 text-white w-64 flex-shrink-0 h-screen flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center space-x-2">
          <Leaf className="h-6 w-6 text-green-400" />
          <h1 className="font-bold text-xl">Convo Bio</h1>
        </div>
        <p className="text-neutral-400 text-sm">Traçabilité d'Avocat</p>
      </div>
      
      {/* Navigation */}
      <nav className="p-2 flex-grow overflow-y-auto">
        <div className="py-2 px-4 text-xs text-neutral-500 uppercase">Menu Principal</div>
        <ul>
          {menuItems.map((item, index) => (
            <li key={index} className="mb-1">
              <Link href={item.path}>
                <div className={cn(
                  "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                  isActive(item.path) 
                    ? "bg-green-700 text-white" 
                    : "hover:bg-neutral-700 text-neutral-300"
                )}>
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 py-2 px-4 text-xs text-neutral-500 uppercase">Traçabilité</div>
        <ul>
          {traceabilityItems.map((item, index) => (
            <li key={index} className="mb-1">
              <Link href={item.path}>
                <div className={cn(
                  "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                  isActive(item.path) 
                    ? "bg-green-700 text-white" 
                    : "hover:bg-neutral-700 text-neutral-300"
                )}>
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 py-2 px-4 text-xs text-neutral-500 uppercase">Administration</div>
        <ul>
          {adminItems.map((item, index) => (
            <li key={index} className="mb-1">
              <Link href={item.path}>
                <div className={cn(
                  "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                  isActive(item.path) 
                    ? "bg-green-700 text-white" 
                    : "hover:bg-neutral-700 text-neutral-300"
                )}>
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Bottom Section with Version and Info */}
      <div className="p-4 border-t border-neutral-700">
        <div className="text-center">
          <div className="text-sm text-neutral-400">Version 1.0</div>
          <div className="text-xs text-neutral-500 mt-1">© 2025 Convo Bio Compliance</div>
        </div>
      </div>
    </aside>
  );
}
