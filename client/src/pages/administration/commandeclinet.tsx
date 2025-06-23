import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AvocadoOrder {
  id: string;
  clientName: string;
  orderDate: Date;
  requestedDeliveryDate: Date;
  status: 'pending' | 'processing' | 'delayed' | 'completed' | 'cancelled';
  items: Array<{
    caliber: string;
    quantity: number;
    type: string;
    processingTime: number;
  }>;
  priority: 'high' | 'medium' | 'low';
  totalProcessingTime: number;
  actualDeliveryDate?: Date;
  notes?: string;
  delayReason?: string;
}

export default function CommandeClient() {
  const [orders, setOrders] = useState<AvocadoOrder[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'avocado_orders'), orderBy('orderDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          orderDate: data.orderDate?.toDate ? data.orderDate.toDate() : new Date(data.orderDate),
          requestedDeliveryDate: data.requestedDeliveryDate?.toDate ? data.requestedDeliveryDate.toDate() : new Date(data.requestedDeliveryDate),
          actualDeliveryDate: data.actualDeliveryDate?.toDate ? data.actualDeliveryDate.toDate() : data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : undefined,
        } as AvocadoOrder;
      });
      setOrders(fetchedOrders);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mes Commandes d'Avocat</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livraison demandée</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.id}</div>
                    <div className="text-gray-500 text-sm">{order.clientName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.requestedDeliveryDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-gray-700">
                        {item.quantity} kg - {item.type} (Caliber {item.caliber})
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
