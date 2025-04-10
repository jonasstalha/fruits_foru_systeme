import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Plus, User, Loader2 } from "lucide-react";
import { registerSchema, User as UserType } from "@shared/schema";

type UserWithoutPassword = Omit<UserType, "password">;

export default function UsersPage() {
  const { toast } = useToast();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  
  // Fetch users
  const { data: users, isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Add user form
  const addUserForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "operator",
    },
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      addUserForm.reset();
      setOpenAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'utilisateur",
        variant: "destructive",
      });
    },
  });
  
  // Handle add user submit
  const onAddUserSubmit = (values: z.infer<typeof registerSchema>) => {
    createUserMutation.mutate(values);
  };
  
  // Get user role display name
  const getUserRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "operator":
        return "Opérateur";
      case "client":
        return "Client";
      default:
        return role;
    }
  };
  
  // Get user role badge class
  const getUserRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "operator":
        return "bg-green-100 text-green-800";
      case "client":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-grow">
        <TopBar title="Gérer les Utilisateurs" subtitle="Ajouter et modifier les utilisateurs du système" />
        
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between px-6">
              <CardTitle>Liste des Utilisateurs</CardTitle>
              <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un Utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un Nouvel Utilisateur</DialogTitle>
                  </DialogHeader>
                  <Form {...addUserForm}>
                    <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
                      <FormField
                        control={addUserForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom Complet <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nom complet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addUserForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom d'utilisateur <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nom d'utilisateur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addUserForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mot de passe <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Mot de passe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addUserForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmer le mot de passe <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirmer le mot de passe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addUserForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rôle <span className="text-red-500">*</span></FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="operator">Opérateur</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenAddDialog(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={createUserMutation.isPending}
                        >
                          {createUserMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Création...
                            </>
                          ) : (
                            "Créer"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Nom d'utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading states
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium flex items-center">
                          <div className="bg-primary-500 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">
                              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserRoleBadgeClass(user.role)}`}>
                            {getUserRoleDisplay(user.role)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-neutral-500">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            
            <CardFooter className="py-4 px-6 border-t text-sm text-neutral-500">
              Total: {users?.length || 0} utilisateurs
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
