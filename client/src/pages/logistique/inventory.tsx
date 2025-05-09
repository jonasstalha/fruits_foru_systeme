import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Search, Filter, Plus, Edit2, Trash2, Check, X, AlertCircle, ArrowUpDown } from "lucide-react";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("entryDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  
  const initialFormState = {
    itemType: '',
    itemName: '',
    quantity: '',
    unit: '',
    entryDate: new Date().toISOString().split('T')[0],
    supplier: '',
    isPaid: false,
    notes: '',
  };
  
  const [form, setForm] = useState(initialFormState);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const inventoryData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(inventoryData);
    } catch (e) {
      console.error("Error fetching inventory: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    const submitData = async () => {
      try {
        if (editingItem) {
          // Update existing item
          await updateDoc(doc(db, "inventory", editingItem.id), form);
          setInventory(inventory.map(item => 
            item.id === editingItem.id ? { id: editingItem.id, ...form } : item
          ));
        } else {
          // Add new item
          const docRef = await addDoc(collection(db, "inventory"), form);
          setInventory([...inventory, { id: docRef.id, ...form }]);
        }
        resetForm();
      } catch (e) {
        console.error("Error saving document: ", e);
      }
    };
    
    submitData();
  };

  const handleEdit = (item) => {
    setForm({
      itemType: item.itemType,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      entryDate: item.entryDate,
      supplier: item.supplier,
      isPaid: item.isPaid,
      notes: item.notes,
    });
    setEditingItem(item);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "inventory", id));
      setInventory(inventory.filter(item => item.id !== id));
      setShowConfirmDelete(null);
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort inventory items
  const filteredInventory = inventory
    .filter(item => {
      // Apply filter
      if (filter === "all") return true;
      if (filter === "paid") return item.isPaid;
      if (filter === "unpaid") return !item.isPaid;
      return item.itemType === filter;
    })
    .filter(item => {
      // Apply search
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        item.itemName?.toLowerCase().includes(search) ||
        item.supplier?.toLowerCase().includes(search) ||
        item.notes?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      // Apply sorting
      if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Get unique item types for filter dropdown
  const itemTypes = ["all", "paid", "unpaid", ...new Set(inventory.map(item => item.itemType).filter(Boolean))];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Hide Form' : <><Plus size={16} /> Add Item</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {editingItem ? "✏️ Edit Item" : "➕ Add New Item"}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Item Type</label>
              <select 
                name="itemType" 
                value={form.itemType} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Item Type</option>
                <option>Pallet</option>
                <option>Box</option>
                <option>Packaging</option>
                <option>Stickers</option>
                <option>Labels</option>
                <option>Tools</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Item Name</label>
              <input 
                type="text" 
                name="itemName" 
                value={form.itemName} 
                onChange={handleChange} 
                placeholder="Enter item name" 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input 
                type="number" 
                name="quantity" 
                value={form.quantity} 
                onChange={handleChange} 
                placeholder="Enter quantity" 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <select 
                name="unit" 
                value={form.unit} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Unit</option>
                <option>kg</option>
                <option>units</option>
                <option>boxes</option>
                <option>rolls</option>
                <option>liters</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Entry Date</label>
              <input 
                type="date" 
                name="entryDate" 
                value={form.entryDate} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Supplier</label>
              <input 
                type="text" 
                name="supplier" 
                value={form.supplier} 
                onChange={handleChange} 
                placeholder="Enter supplier name" 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={handleChange} 
                placeholder="Additional notes (optional)" 
                className="w-full p-2 border rounded-lg h-24" 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isPaid" 
                name="isPaid" 
                checked={form.isPaid} 
                onChange={handleChange} 
                className="h-4 w-4 text-blue-600 border-gray-300 rounded" 
              />
              <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                Paid
              </label>
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">📦 Inventory List</h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border rounded-lg w-full"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 border rounded-lg appearance-none w-full md:w-40"
              >
                {itemTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center">
            <AlertCircle size={40} className="text-gray-400 mb-2" />
            <p className="text-gray-500">
              {inventory.length === 0 
                ? "No inventory items found. Add your first item!"
                : "No items match your current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("itemName")}>
                    <div className="flex items-center gap-1">
                      Item
                      {sortBy === "itemName" && (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("itemType")}>
                    <div className="flex items-center gap-1">
                      Type
                      {sortBy === "itemType" && (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("quantity")}>
                    <div className="flex items-center gap-1">
                      Quantity
                      {sortBy === "quantity" && (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("entryDate")}>
                    <div className="flex items-center gap-1">
                      Date
                      {sortBy === "entryDate" && (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("supplier")}>
                    <div className="flex items-center gap-1">
                      Supplier
                      {sortBy === "supplier" && (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("isPaid")}>
                    <div className="flex items-center gap-1">
                      Status
                      {sortBy === "isPaid" && (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.itemType}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.entryDate}</td>
                    <td className="px-4 py-3 text-sm">{item.supplier || '-'}</td>
                    <td className="px-4 py-3">
                      {item.isPaid ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <Check size={12} className="mr-1" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          <X size={12} className="mr-1" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <button 
                          onClick={() => setShowConfirmDelete(item.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          {filteredInventory.length} of {inventory.length} items
        </div>
      </div>
      
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;