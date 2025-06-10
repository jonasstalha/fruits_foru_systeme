import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, getFirestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface Category {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  categoryId: string;
  url: string;
  uploadedAt: Date;
}

export default function DocumentArchive() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        console.log('Current user:', user); // Debug log

        if (!user) {
          console.log('No user found, redirecting to login'); // Debug log
          setLocation('/login');
          return;
        }

        // Get the ID token to ensure it's fresh
        const token = await user.getIdToken(true);
        console.log('User token:', token ? 'Token exists' : 'No token'); // Debug log

        await fetchCategories();
        await fetchDocuments();
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Authentication error');
        setLocation('/login');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user'); // Debug log
      if (user) {
        checkAuth();
      } else {
        setLocation('/login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  const fetchCategories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('Fetching categories...'); // Debug log
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, where('createdBy', '==', user.uid));
      console.log('Categories query created'); // Debug log
      
      const categoriesSnapshot = await getDocs(q);
      console.log('Categories snapshot:', categoriesSnapshot.size, 'documents'); // Debug log

      if (categoriesSnapshot.empty) {
        console.log('No categories found for user'); // Debug log
        setCategories([]);
        return;
      }

      const categoriesList = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('permission-denied')) {
          toast.error('You do not have permission to access categories');
        } else if (error.message.includes('not-found')) {
          toast.error('Categories collection not found');
        } else {
          toast.error('Failed to fetch categories: ' + error.message);
        }
      } else {
        toast.error('Failed to fetch categories');
      }
    }
  };

  const fetchDocuments = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('Fetching documents...'); // Debug log
      const documentsRef = collection(db, 'documents');
      console.log('Documents collection reference created'); // Debug log
      
      const documentsSnapshot = await getDocs(documentsRef);
      console.log('Documents snapshot:', documentsSnapshot.size, 'documents'); // Debug log

      const documentsList = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt.toDate()
      })) as Document[];
      setDocuments(documentsList);
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      toast.error('Failed to fetch documents');
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please log in to create categories');
        return;
      }

      // Check if category already exists
      const categoriesRef = collection(db, 'categories');
      const q = query(
        categoriesRef,
        where('name', '==', newCategory.trim()),
        where('createdBy', '==', user.uid)
      );
      const existingCategories = await getDocs(q);
      
      if (!existingCategories.empty) {
        toast.error('A category with this name already exists');
        return;
      }

      console.log('Adding category:', newCategory.trim()); // Debug log
      const docRef = await addDoc(categoriesRef, {
        name: newCategory.trim(),
        createdAt: new Date(),
        createdBy: user.uid
      });
      console.log('Category added with ID:', docRef.id); // Debug log

      setNewCategory('');
      await fetchCategories();
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('permission-denied')) {
          toast.error('You do not have permission to create categories');
        } else {
          toast.error('Error adding category: ' + error.message);
        }
      } else {
        toast.error('Error adding category');
      }
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !selectedCategory) {
      toast.error('Please select a file and category');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('Uploading document...'); // Debug log
      
      // Create a unique filename
      const timestamp = new Date().getTime();
      const uniqueFilename = `${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `documents/${user.uid}/${uniqueFilename}`);
      
      // Set metadata for the upload
      const metadata = {
        contentType: selectedFile.type,
        customMetadata: {
          'uploadedBy': user.uid,
          'categoryId': selectedCategory,
          'origin': window.location.origin
        }
      };

      // Upload the file with metadata
      const uploadResult = await uploadBytes(storageRef, selectedFile, metadata);
      console.log('File uploaded successfully:', uploadResult); // Debug log
      
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('File URL:', downloadURL); // Debug log

      const docRef = await addDoc(collection(db, 'documents'), {
        name: selectedFile.name,
        categoryId: selectedCategory,
        url: downloadURL,
        uploadedAt: new Date(),
        uploadedBy: user.uid,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      });
      console.log('Document reference added with ID:', docRef.id); // Debug log

      setSelectedFile(null);
      setSelectedCategory('');
      await fetchDocuments();
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          toast.error('You do not have permission to upload files');
        } else if (error.message.includes('storage/canceled')) {
          toast.error('Upload was canceled');
        } else if (error.message.includes('storage/retry-limit-exceeded')) {
          toast.error('Upload failed after multiple retries');
        } else if (error.message.includes('storage/invalid-checksum')) {
          toast.error('File upload failed: Invalid checksum');
        } else if (error.message.includes('storage/network-request-failed')) {
          toast.error('Network error occurred during upload');
        } else {
          toast.error('Error uploading document: ' + error.message);
        }
      } else {
        toast.error('Error uploading document');
      }
    }
  };

  const deleteDocument = async (document: Document) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('Deleting document...'); // Debug log
      const storageRef = ref(storage, document.url);
      await deleteObject(storageRef);
      console.log('File deleted from storage'); // Debug log

      await deleteDoc(doc(db, 'documents', document.id));
      console.log('Document reference deleted'); // Debug log
      
      await fetchDocuments();
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error deleting document');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Document Archive</h1>
      
      {/* Category Management */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="flex gap-2 mb-4">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
          />
          <Button onClick={addCategory}>Add Category</Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="p-2 bg-gray-100 rounded">
              {category.name}
            </div>
          ))}
        </div>
      </Card>

      {/* Document Upload */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        <div className="flex gap-2 mb-4">
          <Input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <select
            className="border rounded p-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button onClick={uploadDocument}>Upload</Button>
        </div>
      </Card>

      {/* Documents List */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <div className="grid grid-cols-1 gap-4">
          {documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <h3 className="font-medium">{document.name}</h3>
                <p className="text-sm text-gray-500">
                  Category: {categories.find(c => c.id === document.categoryId)?.name}
                </p>
                <p className="text-sm text-gray-500">
                  Uploaded: {document.uploadedAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(document.url, '_blank')}
                >
                  View
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteDocument(document)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 