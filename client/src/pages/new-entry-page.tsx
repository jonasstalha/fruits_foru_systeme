import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/queryClient";
import { AvocadoTracking, AvocadoVariety, QualityGrade } from "@shared/schema";

export default function NewEntryPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AvocadoTracking>>({
    harvest: {
      harvestDate: "",
      farmLocation: "",
      farmerId: "",
      lotNumber: "",
      variety: "hass",
    },
    transport: {
      lotNumber: "",
      transportCompany: "",
      driverName: "",
      vehicleId: "",
      departureDateTime: "",
      arrivalDateTime: "",
    },
    sorting: {
      lotNumber: "",
      sortingDate: "",
      qualityGrade: "A",
      rejectedCount: 0,
    },
    packaging: {
      lotNumber: "",
      packagingDate: "",
      boxId: "",
      workerIds: [],
      netWeight: 0,
      avocadoCount: 0,
    },
    storage: {
      boxId: "",
      entryDate: "",
      storageTemperature: 0,
      storageRoomId: "",
      exitDate: "",
    },
    export: {
      boxId: "",
      loadingDate: "",
      containerId: "",
      driverName: "",
      vehicleId: "",
      destination: "",
    },
    delivery: {
      boxId: "",
      estimatedDeliveryDate: "",
      actualDeliveryDate: "",
      clientName: "",
      received: false,
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post<AvocadoTracking>("/api/avocado-tracking", formData);
      toast({
        title: "Succès",
        description: "Le suivi des avocats a été enregistré avec succès",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  const handleChange = (section: keyof AvocadoTracking, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
  return (
          <Card>
            <CardHeader>
              <CardTitle>📝 Récolte (Ferme)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="harvestDate">Date de récolte</Label>
                <Input
                  id="harvestDate"
                  type="datetime-local"
                  value={formData.harvest?.harvestDate}
                  onChange={(e) => handleChange("harvest", "harvestDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmLocation">Localisation de la ferme</Label>
                            <Input
                  id="farmLocation"
                  value={formData.harvest?.farmLocation}
                  onChange={(e) => handleChange("harvest", "farmLocation", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmerId">ID Agriculteur</Label>
                            <Input
                  id="farmerId"
                  value={formData.harvest?.farmerId}
                  onChange={(e) => handleChange("harvest", "farmerId", e.target.value)}
                  required
                            />
                          </div>
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Numéro de lot</Label>
                <Input
                  id="lotNumber"
                  value={formData.harvest?.lotNumber}
                  onChange={(e) => handleChange("harvest", "lotNumber", e.target.value)}
                  required
                />
                        </div>
              <div className="space-y-2">
                <Label htmlFor="variety">Variété d'avocat</Label>
                          <Select 
                  value={formData.harvest?.variety}
                  onValueChange={(value) => handleChange("harvest", "variety", value)}
                          >
                            <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une variété" />
                            </SelectTrigger>
                            <SelectContent>
                    <SelectItem value="hass">Hass</SelectItem>
                    <SelectItem value="fuerte">Fuerte</SelectItem>
                    <SelectItem value="bacon">Bacon</SelectItem>
                    <SelectItem value="zutano">Zutano</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                            </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>🚛 Transport vers l'usine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transportCompany">Société de transport</Label>
                <Input
                  id="transportCompany"
                  value={formData.transport?.transportCompany}
                  onChange={(e) => handleChange("transport", "transportCompany", e.target.value)}
                  required
                />
                        </div>
              <div className="space-y-2">
                <Label htmlFor="driverName">Nom du chauffeur</Label>
                <Input
                  id="driverName"
                  value={formData.transport?.driverName}
                  onChange={(e) => handleChange("transport", "driverName", e.target.value)}
                  required
                />
                    </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleId">ID du véhicule</Label>
                <Input
                  id="vehicleId"
                  value={formData.transport?.vehicleId}
                  onChange={(e) => handleChange("transport", "vehicleId", e.target.value)}
                  required
                />
                  </div>
              <div className="space-y-2">
                <Label htmlFor="departureDateTime">Date et heure de départ</Label>
                <Input
                  id="departureDateTime"
                  type="datetime-local"
                  value={formData.transport?.departureDateTime}
                  onChange={(e) => handleChange("transport", "departureDateTime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalDateTime">Date et heure d'arrivée</Label>
                <Input
                  id="arrivalDateTime"
                  type="datetime-local"
                  value={formData.transport?.arrivalDateTime}
                  onChange={(e) => handleChange("transport", "arrivalDateTime", e.target.value)}
                  required
                      />
                    </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Température (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formData.transport?.temperature}
                  onChange={(e) => handleChange("transport", "temperature", parseFloat(e.target.value))}
                      />
                    </div>
            </CardContent>
          </Card>
        );

      // Add similar cases for steps 3-7 with their respective forms
      // ... (I'll continue with the remaining steps if you'd like)

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Nouvelle entrée de suivi d'avocats</h2>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                  ? "bg-primary/20"
                  : "bg-muted"
              }`}
            >
              {step}
            </div>
          ))}
                    </div>
                  </div>
                  
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderStep()}

        <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Précédent
          </Button>
          {currentStep < 7 ? (
            <Button type="button" onClick={nextStep}>
              Suivant
                    </Button>
          ) : (
            <Button type="submit">Enregistrer</Button>
          )}
        </div>
      </form>
    </div>
  );
}
