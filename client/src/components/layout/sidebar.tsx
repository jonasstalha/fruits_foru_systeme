import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Home,
  PlusSquare,
  QrCode,
  FileText,
  ChartBar,
  Calculator,
  Layers,
  History,
  Tractor,
  Users,
  PackageCheck,
  Leaf,
  FileBarChart,
  BarChart3,
  Warehouse,
  ChevronDown,
  ChevronRight,
  Truck,
  Package,
  ClipboardList,
  UserCog,
  Calendar,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"; // Import Tooltip components


export default function Sidebar() {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const renderSection = (title: string, items: any[], sectionKey: string) => (
    <div>
<div
  className="mt-6 py-2 px-4 text-xs text-neutral-500 uppercase flex items-center cursor-pointer hover:bg-neutral-700 rounded-md transition-all duration-300 ease-in-out"
  onMouseEnter={() => toggleSection(sectionKey)}
  onMouseLeave={() => toggleSection(null)} // Or another function like closeSection()
>
        {expandedSections.includes(sectionKey) ? (
          <ChevronDown className="h-4 w-4 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2" />
        )}
        {isSidebarOpen && <span>{title}</span>}
      </div>
      {expandedSections.includes(sectionKey) && (
        <ul>
          {items.map((item, index) => (
            <li key={index} className="mb-1">
              <Link href={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                        isActive(item.path)
                          ? "bg-green-700 text-white shadow-md"
                          : "hover:bg-neutral-700 text-neutral-300"
                      )}
                    >
                      {item.icon}
                      {isSidebarOpen && <span className="ml-2">{item.title}</span>}
                    </div>
                  </TooltipTrigger>
                  {!isSidebarOpen && (
                    <TooltipContent>{item.title}</TooltipContent>
                  )}
                </Tooltip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

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
    },
  ];

  const traceabilityItems = [
    {
      title: "Rapports PDF",
      icon: <FileText className="h-5 w-5 mr-2" />,
      path: "/reports",
    },
    {
      title: "Statistiques",
      icon: <BarChart3 className="h-5 w-5 mr-2" />,
      path: "/statistics",
    },
  ];

  const adminItems = [
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
      title: "Gestion Lots",
      icon: <PackageCheck className="h-5 w-5 mr-2" />,
      path: "/lots",
    },
    {
      title: "Gérer Fermes",
      icon: <Tractor className="h-5 w-5 mr-2" />,
      path: "/farms",
    },
  ];

  const logisticsItems = [
    {
      title: "rapport generating",
      icon: <Truck className="h-5 w-5 mr-2" />,
      path: "/rapport-generating",
    },
    {
      title: "factures-templates ",
      icon: <Package className="h-5 w-5 mr-2" />,
      path: "/factures-templates",
    },
    {
      title: "Inventaire",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "/inventory",
    },
  ];

  const quality = [
    {
      title: "Contrôle Qualité",
      icon: <ShieldCheck className="h-5 w-5 mr-2" />,
      path: "/qualitycontrol",
    }
  ];
  const ReceptionItems = [
    {
      title: "Réception",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      path: "/reception",
    },
  ];
  const personnelItems = [
    {
      title: "Gestion Personnel",
      icon: <UserCog className="h-5 w-5 mr-2" />,
      path: "/personnelmanagement",
    },
    {
      title: "Horaires",
      icon: <Calendar className="h-5 w-5 mr-2" />,
      path: "/schedules",
    },
  ];
  const production = [
    {
      title: "calcule de consomation ",
      icon: <Calculator className="h-5 w-5 mr-2" />,
      path: "/calculedeconsomation",
    },
    {
      title: "historique de consomation ",
      icon: <History className="h-5 w-5 mr-2" />,
      path: "/historiquedeconsomation",
    },
    {
      title: "invtory tracking",
      icon: <Layers className="h-5 w-5 mr-2" />,
      path: "/invtorytracking",
    },
  ];

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "bg-neutral-800 text-white flex-shrink-0 h-screen flex flex-col transition-all duration-300 ease-in-out shadow-lg",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-green-400" />
            {isSidebarOpen && <h1 className="font-bold text-xl">Convo Bio</h1>}
          </div>
          <button
            onClick={toggleSidebar}
            className="text-neutral-400 hover:text-white focus:outline-none"
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 flex-grow overflow-y-auto">
          {renderSection("Menu Principal", menuItems, "menu")}
          {renderSection("Traçabilité", traceabilityItems, "traceability")}
          {renderSection("Administration", adminItems, "admin")}
          {renderSection("Logistique", logisticsItems, "logistics")}
          {renderSection("Qualité", quality, "quality")}
          {renderSection("Réception", ReceptionItems, "reception")}
          {renderSection("Production", production, "production")}
          {renderSection("Personnel", personnelItems, "personnel")}
        </nav>

        {/* Bottom Section with Version and Info */}
        {isSidebarOpen && (
          <div className="p-2 border-t border-neutral-700 text-center text-xs text-neutral-500">
            <div>Version 0.1</div>
            <div>© 2025 Convo Bio Compliance</div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
