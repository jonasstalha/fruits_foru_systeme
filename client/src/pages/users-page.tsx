import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Plus, User, Loader2, Edit, Trash2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, query, where } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { toast } from "react-hot-toast";

const db = getFirestore();

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Le nom complet est requis"),
  role: z.enum(["admin", "operator", "client"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
  uid?: string;
};

export default function UsersPage() {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const addUserForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "operator",
    },
  });
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log("Starting to fetch users...");
      
      // Check if we're authenticated
      const currentUser = auth.currentUser;
      console.log("Current user:", currentUser?.email);
      
      if (!currentUser) {
        toast.error("Vous devez être connecté pour voir les utilisateurs");
        return;
      }

      console.log("Getting Firestore instance...");
      const usersCollection = collection(db, "users");
      console.log("Collection reference created");
      
      const userSnapshot = await getDocs(usersCollection);
      console.log("Snapshot received, number of documents:", userSnapshot.docs.length);
      
      const usersList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Processing document:", doc.id, data);
        return {
          id: doc.id,
          email: data.email,
          fullName: data.fullName || data.displayName || "Nouvel utilisateur",
          role: data.role || "operator",
          createdAt: data.createdAt?.toDate() || new Date(),
          uid: data.uid || doc.id
        };
      });
      
      console.log("Final users list:", usersList);
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Impossible de récupérer la liste des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkUsers = async () => {
    try {
      console.log("Checking Firebase Auth users...");
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No authenticated user");
        return;
      }

      // Get Firestore users
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(usersCollection);
      console.log("Firestore users:", userSnapshot.docs.length);
      userSnapshot.docs.forEach(doc => {
        console.log("Firestore user:", doc.id, doc.data());
      });

      // Get Firebase Auth users (this will only show the current user)
      console.log("Current Firebase Auth user:", {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      });

    } catch (error) {
      console.error("Error checking users:", error);
    }
  };
  
  useEffect(() => {
    fetchUsers();
    checkUsers();
  }, []);
  
  const onAddUserSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Starting user creation with values:", values);
      
      // First try to create the user in Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          values.email,
          values.password
        );
        console.log("Successfully created user in Firebase Auth:", userCredential.user.uid);
        
        // If successful, create Firestore document
        const userId = userCredential.user.uid;
        const userDoc = doc(db, "users", userId);
        
        await setDoc(userDoc, {
          email: values.email,
          fullName: values.fullName,
          role: values.role,
          uid: userId,
          createdAt: new Date(),
          displayName: values.fullName,
        });
        console.log("Successfully created Firestore document");
        
        toast.success("L'utilisateur a été créé avec succès");
        addUserForm.reset();
        setOpenAddDialog(false);
        fetchUsers();
      } catch (authError: any) {
        console.error("Firebase Auth Error:", authError);
        console.error("Error code:", authError.code);
        console.error("Error message:", authError.message);
        
        if (authError.code === 'auth/email-already-in-use') {
          toast.error("Cette adresse email est déjà utilisée dans Firebase Authentication");
        } else if (authError.code === 'auth/weak-password') {
          toast.error("Le mot de passe est trop faible");
        } else if (authError.code === 'auth/invalid-email') {
          toast.error("L'adresse email n'est pas valide");
        } else {
          toast.error(`Erreur d'authentification: ${authError.message}`);
        }
      }
    } catch (error: any) {
      console.error("General error:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const deleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        toast.success("L'utilisateur a été supprimé avec succès");
        fetchUsers();
      } catch (error) {
        toast.error("Une erreur est survenue lors de la suppression de l'utilisateur");
      }
    }
  };
  
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
  
  const getUserRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "operator":
        return "bg-blue-100 text-blue-800";
      case "client":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Add update user function
  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await setDoc(doc(db, "users", userId), userData, { merge: true });
      toast.success("Utilisateur mis à jour avec succès");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erreur lors de la mise à jour de l'utilisateur");
    }
  };
  
  // Add this function after fetchUsers
  const syncFirebaseUsers = async () => {
    try {
      setIsLoading(true);
      // Get current user's ID token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Vous devez être connecté");
        return;
      }

      const idToken = await currentUser.getIdToken();
      
      // Make request to Firebase Admin API
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyC0bMWINNGLLS6bfnK-hfRQwHFnBSJqMhI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken
        })
      });

      const data = await response.json();
      
      if (data.users) {
        // For each Firebase Auth user, create or update Firestore document
        for (const user of data.users) {
          const userDoc = doc(db, "users", user.localId);
          await setDoc(userDoc, {
            email: user.email,
            fullName: user.displayName || "Nouvel utilisateur",
            role: "operator", // Default role
            uid: user.localId,
            createdAt: new Date(parseInt(user.createdAt))
          }, { merge: true });
        }
        
        toast.success("Utilisateurs synchronisés avec succès");
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error("Error syncing users:", error);
      toast.error("Erreur lors de la synchronisation des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
        <div className="flex gap-2">
          <Button onClick={syncFirebaseUsers} variant="outline">
            Synchroniser les utilisateurs
          </Button>
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un utilisateur</DialogTitle>
              </DialogHeader>
              <Form {...addUserForm}>
                <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Entrez l'email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addUserForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Entrez le nom complet" {...field} />
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
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Entrez le mot de passe" {...field} />
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
                        <FormLabel>Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirmez le mot de passe" {...field} />
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
                        <FormLabel>Rôle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Créer
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserRoleBadgeClass(user.role)}`}>
                          {getUserRoleDisplay(user.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              const newRole = prompt("Nouveau rôle (admin, operator, client):", user.role);
                              if (newRole && ["admin", "operator", "client"].includes(newRole)) {
                                updateUser(user.id, { role: newRole });
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => deleteUser(user.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}