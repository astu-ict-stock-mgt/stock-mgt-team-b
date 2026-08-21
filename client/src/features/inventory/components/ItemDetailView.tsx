// client/src/features/inventory/components/ItemDetailView.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventoryItem, useInventoryLots } from '../hooks';

export const ItemDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: item, isLoading: itemLoading, error: itemError } = useInventoryItem(id || '');
  const { data: lots = [], isLoading: lotsLoading } = useInventoryLots(id || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (itemLoading || lotsLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-600">Loading item details...</p>
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          ❌ Error loading item: {(itemError as Error)?.message || 'Item not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/inventory')}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
      >
        ← Back to Inventory
      </button>

      {/* Item Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{item.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 font-mono">SKU: {item.sku}</span>
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                {item.category}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Value (FIFO)</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(item.totalValue)}</p>
          </div>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Quantity</p>
            <p className="text-lg font-medium text-gray-800">{item.quantity} {item.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Min Stock</p>
            <p className="text-lg font-medium text-gray-800">{item.minStock || 'N/A'} {item.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Max Stock</p>
            <p className="text-lg font-medium text-gray-800">{item.maxStock || 'N/A'} {item.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-lg font-medium text-gray-800">{formatDate(item.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Lots Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Lot Breakdown (FIFO Valuation)
            <span className="text-xs font-normal text-gray-400 ml-2">
              SRS Section 3.1 — Inventory Tracking
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          {lots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No lots found for this item</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lots.map((lot: any) => {
                  const isFullyConsumed = lot.remainingQuantity === 0;
                  return (
                    <tr key={lot.id} className={isFullyConsumed ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(lot.receivedDate)}
                        {lot.expiryDate && (
                          <span className="text-xs text-gray-400 block">
                            Expires: {formatDate(lot.expiryDate)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {lot.originalQuantity}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {lot.remainingQuantity}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {formatCurrency(lot.unitCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {formatCurrency(lot.totalCost)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isFullyConsumed ? (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            Consumed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Lot Summary */}
        {lots.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">
                Total Lots: <span className="font-medium text-gray-700">{lots.length}</span>
              </span>
              <span className="text-gray-500">
                Total Original Qty:{' '}
                <span className="font-medium text-gray-700">
                  {lots.reduce((sum: number, lot: any) => sum + lot.originalQuantity, 0)}
                </span>
              </span>
              <span className="text-gray-500">
                Total Remaining:{' '}
                <span className="font-medium text-gray-700">
                  {lots.reduce((sum: number, lot: any) => sum + lot.remainingQuantity, 0)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailView;