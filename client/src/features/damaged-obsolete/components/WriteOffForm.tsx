// client/src/features/damaged-obsolete/components/WriteOffForm.tsx

import React, { useState } from 'react';
import { useCreateWriteOff, useInventoryItems, useApprovalAuthority } from '../hooks';
import { getReasonCodes } from '../api';
import type { InventoryItem, WriteOffRequest } from '../api';

interface WriteOffFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const WriteOffForm: React.FC<WriteOffFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Omit<WriteOffRequest, 'id' | 'requestedAt'>>({
    itemId: '',
    itemName: '',
    quantity: 0,
    reasonCode: 'DAMAGED',
    reasonDescription: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const createWriteOff = useCreateWriteOff();
  const { data: items = [], isLoading: itemsLoading } = useInventoryItems();
  const { isAuthorized } = useApprovalAuthority();
  const reasonCodes = getReasonCodes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.itemId) errors.itemId = 'Please select an item';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (selectedItem && formData.quantity > selectedItem.quantity) {
      errors.quantity = `Cannot exceed available stock (${selectedItem.quantity})`;
    }
    if (!formData.reasonCode) errors.reasonCode = 'Please select a reason';
    if (formData.reasonCode === 'OTHER' && !formData.reasonDescription?.trim()) {
      errors.reasonDescription = 'Please provide a description for "Other" reason';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createWriteOff.mutateAsync({
        ...formData,
        requestedBy: localStorage.getItem('username') || 'Unknown User',
      });

      setFormData({
        itemId: '',
        itemName: '',
        quantity: 0,
        reasonCode: 'DAMAGED',
        reasonDescription: '',
        notes: '',
      });
      setSelectedItem(null);
      setFormErrors({});
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = items.find((i: InventoryItem) => i.id === e.target.value);
    setSelectedItem(item || null);
    setFormData((prev) => ({
      ...prev,
      itemId: item?.id || '',
      itemName: item?.name || '',
      quantity: 0,
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Damaged / Obsolete Stock</h1>
          <p className="mt-1 text-sm text-gray-500">
            Report damaged or obsolete items for write-off approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorized && (
            <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              ● Authorized
            </span>
          )}
          <span className="text-sm text-gray-500">SRS 1.4.2</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Write-Off Request Form</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {createWriteOff.isSuccess && (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              <span className="text-xl">✓</span>
              <div>
                <p className="font-medium">Write-off request submitted successfully!</p>
                <p className="text-sm text-green-600">Request ID: {createWriteOff.data?.id}</p>
              </div>
            </div>
          )}

          {createWriteOff.isError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <span className="text-xl">✕</span>
              <p>{createWriteOff.error?.message || 'Failed to submit request'}</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Select Item <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.itemId}
              onChange={handleItemSelect}
              className={`w-full rounded-lg border px-4 py-2.5 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                formErrors.itemId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              } ${itemsLoading ? 'cursor-wait bg-gray-100' : 'bg-white'}`}
              disabled={itemsLoading}
            >
              <option value="">Select an item...</option>
              {items.map((item: InventoryItem) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code}) — Available: {item.quantity} {item.unit}
                </option>
              ))}
            </select>
            {formErrors.itemId && <p className="mt-1 text-sm text-red-500">{formErrors.itemId}</p>}
          </div>

          {selectedItem && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Item Name</p>
                <p className="text-sm font-medium text-gray-800">{selectedItem.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Item Code</p>
                <p className="text-sm font-medium text-gray-800">{selectedItem.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Available Stock</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedItem.quantity} {selectedItem.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium text-gray-800">{selectedItem.category}</p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Quantity to Write Off <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleChange}
              min="1"
              max={selectedItem?.quantity || 9999}
              className={`w-full max-w-xs rounded-lg border px-4 py-2.5 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                formErrors.quantity ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quantity"
            />
            {formErrors.quantity && (
              <p className="mt-1 text-sm text-red-500">{formErrors.quantity}</p>
            )}
            {selectedItem && !formErrors.quantity && (
              <p className="mt-1 text-xs text-gray-500">
                Max: {selectedItem.quantity} {selectedItem.unit}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              name="reasonCode"
              value={formData.reasonCode}
              onChange={handleChange}
              className={`w-full max-w-md rounded-lg border px-4 py-2.5 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                formErrors.reasonCode ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              }`}
            >
              {reasonCodes.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.icon} {reason.label} — {reason.description}
                </option>
              ))}
            </select>
            {formErrors.reasonCode && (
              <p className="mt-1 text-sm text-red-500">{formErrors.reasonCode}</p>
            )}
          </div>

          {formData.reasonCode === 'OTHER' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="reasonDescription"
                value={formData.reasonDescription || ''}
                onChange={handleChange}
                className={`w-full max-w-lg rounded-lg border px-4 py-2.5 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  formErrors.reasonDescription
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Describe the reason in detail"
              />
              {formErrors.reasonDescription && (
                <p className="mt-1 text-sm text-red-500">{formErrors.reasonDescription}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Additional Notes <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
              className="w-full max-w-lg resize-y rounded-lg border border-gray-300 px-4 py-2.5 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g., Condition, location, supporting details..."
            />
          </div>

          {isAuthorized && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="flex items-center gap-2 text-sm text-blue-700">
                <span>🔑</span>
                You have approval authority. Approve/Reject buttons will appear in the history view.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={createWriteOff.isPending || itemsLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createWriteOff.isPending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteOffForm;
