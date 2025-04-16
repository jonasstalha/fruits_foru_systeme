import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Static data for statistics
const MONTHLY_DATA = [
  { name: "Jan", lots: 12, farms: 3 },
  { name: "Fév", lots: 15, farms: 4 },
  { name: "Mar", lots: 18, farms: 5 },
  { name: "Avr", lots: 20, farms: 6 },
  { name: "Mai", lots: 25, farms: 7 },
  { name: "Juin", lots: 22, farms: 7 },
];

const PRODUCT_DISTRIBUTION = [
  { name: "Avocats", value: 400 },
  { name: "Oranges", value: 300 },
  { name: "Citrons", value: 200 },
  { name: "Autres", value: 100 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function StatisticsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-2xl font-bold">Statistiques</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques Mensuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lots" fill="#8884d8" name="Lots" />
                  <Bar dataKey="farms" fill="#82ca9d" name="Fermes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PRODUCT_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {PRODUCT_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total des Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">112</p>
            <p className="text-sm text-neutral-500">+12% depuis le mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fermes Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">7</p>
            <p className="text-sm text-neutral-500">+2 depuis le mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux de Livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">98%</p>
            <p className="text-sm text-neutral-500">+2% depuis le mois dernier</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 