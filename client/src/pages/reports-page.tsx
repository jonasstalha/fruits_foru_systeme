import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Download } from "lucide-react";
import { Link } from "wouter";

// Static data for reports
const STATIC_REPORTS = [
  {
    id: 1,
    title: "Rapport Mensuel - Mars 2024",
    type: "monthly",
    date: "2024-03-31",
    description: "Rapport mensuel des activités et des statistiques",
    downloadUrl: "#",
  },
  {
    id: 2,
    title: "Rapport de Traçabilité - Lot 001",
    type: "traceability",
    date: "2024-03-15",
    description: "Rapport détaillé de traçabilité pour le lot 001",
    downloadUrl: "#",
  },
  {
    id: 3,
    title: "Rapport de Qualité - Avril 2024",
    type: "quality",
    date: "2024-04-01",
    description: "Rapport d'analyse de qualité des produits",
    downloadUrl: "#",
  },
];

const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = STATIC_REPORTS.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rapports</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Rechercher un rapport..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <FileText className="h-5 w-5 text-neutral-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-neutral-500">{report.description}</p>
                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <span>
                    {new Date(report.date).toLocaleDateString()}
                  </span>
                  <span className="capitalize">{report.type}</span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={report.downloadUrl}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage; 
