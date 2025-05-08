import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { AvocadoTracking } from "../../../shared/schema";

type PackagingCardProps = {
  formData: AvocadoTracking;
  handlePackageChange: (
    index: number,
    field: keyof Required<AvocadoTracking>["packaging"][number],
    value: any
  ) => void;
  removePackage: (index: number) => void;
};

const PackagingCard: React.FC<PackagingCardProps> = ({ formData, handlePackageChange, removePackage }) => {
  const packages = Array.isArray(formData.packaging) ? formData.packaging : [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>📦 Emballage</CardTitle>
        <CardDescription>Gérez les différents lots d'emballage.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {packages.map((pkg, index) => (
          <div key={pkg.boxId || index} className="border p-4 rounded-md space-y-4">
            <h3 className="font-medium">Lot #{index + 1}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`boxId-${index}`}>🔢 ID de la boîte</Label>
                <Input
                  id={`boxId-${index}`}
                  value={pkg.boxId || ""}
                  onChange={(e) => handlePackageChange(index, "boxId", e.target.value)}
                  placeholder="Ex: BX2024-0987"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`boxType-${index}`}>📦 Type de boîte</Label>
                <Select
                  value={pkg.boxType || ""}
                  onValueChange={(value) => handlePackageChange(index, "boxType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caisse">Caisse en bois</SelectItem>
                    <SelectItem value="boite">Boîte carton</SelectItem>
                    <SelectItem value="palette">Palette</SelectItem>
                    <SelectItem value="sac">Sac plastique</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`avocadoCount-${index}`}>🥑 Nombre d'avocats</Label>
                <Select
                  value={pkg.avocadoCount?.toString() || ""}
                  onValueChange={(value) => handlePackageChange(index, "avocadoCount", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} avocat{count > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`netWeight-${index}`}>⚖️ Poids net (kg)</Label>
                <Input
                  id={`netWeight-${index}`}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pkg.netWeight || ""}
                  onChange={(e) => handlePackageChange(index, "netWeight", parseFloat(e.target.value))}
                />
              </div>
            </div>

            {(index !== 0 || !pkg.isPreset) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removePackage(index)}
                className="text-red-500"
              >
                ❌ Supprimer ce lot
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PackagingCard;