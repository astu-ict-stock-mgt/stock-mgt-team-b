// client/src/features/damaged-obsolete/components/WriteOffForm.tsx

import React, { useState } from 'react';
import { useCreateWriteOff, useInventoryItems, useApprovalAuthority } from '../hooks';
import { getReasonCodes } from '../api';
import type { WriteOffRequest } from '../api';

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
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
    const item = items.find((i: any) => i.id === e.target.value);
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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Damaged / Obsolete Stock</h1>
          <p className="text-sm text-gray-500 mt-1">
            Report damaged or obsolete items for write-off approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorized && (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">
              ● Authorized
            </span>
          )}
          <span className="text-sm text-gray-500">SRS 1.4.2</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Write-Off Request Form</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {createWriteOff.isSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
              <span className="text-xl">✓</span>
              <div>
                <p className="font-medium">Write-off request submitted successfully!</p>
                <p className="text-sm text-green-600">Request ID: {createWriteOff.data?.id}</p>
              </div>
            </div>
          )}

          {createWriteOff.isError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
              <span className="text-xl">✕</span>
              <p>{createWriteOff.error?.message || 'Failed to submit request'}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Item <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.itemId}
              onChange={handleItemSelect}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                formErrors.itemId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              } ${itemsLoading ? 'bg-gray-100 cursor-wait' : 'bg-white'}`}
              disabled={itemsLoading}
            >
              <option value="">Select an item...</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code}) — Available: {item.quantity} {item.unit}
                </option>
              ))}
            </select>
            {formErrors.itemId && <p className="text-sm text-red-500 mt-1">{formErrors.itemId}</p>}
          </div>

          {selectedItem && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity to Write Off <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleChange}
              min="1"
              max={selectedItem?.quantity || 9999}
              className={`w-full max-w-xs px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                formErrors.quantity ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quantity"
            />
            {formErrors.quantity && <p className="text-sm text-red-500 mt-1">{formErrors.quantity}</p>}
            {selectedItem && !formErrors.quantity && (
              <p className="text-xs text-gray-500 mt-1">Max: {selectedItem.quantity} {selectedItem.unit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              name="reasonCode"
              value={formData.reasonCode}
              onChange={handleChange}
              className={`w-full max-w-md px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                formErrors.reasonCode ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
              }`}
            >
              {reasonCodes.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.icon} {reason.label} — {reason.description}
                </option>
              ))}
            </select>
            {formErrors.reasonCode && <p className="text-sm text-red-500 mt-1">{formErrors.reasonCode}</p>}
          </div>

          {formData.reasonCode === 'OTHER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="reasonDescription"
                value={formData.reasonDescription || ''}
                onChange={handleChange}
                className={`w-full max-w-lg px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  formErrors.reasonDescription ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the reason in detail"
              />
              {formErrors.reasonDescription && (
                <p className="text-sm text-red-500 mt-1">{formErrors.reasonDescription}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional Notes <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
              className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
              placeholder="e.g., Condition, location, supporting details..."
            />
          </div>

          {isAuthorized && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span>🔑</span>
                You have approval authority. Approve/Reject buttons will appear in the history view.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={createWriteOff.isPending || itemsLoading}
              className="px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex items-center gap-2"
            >
              {createWriteOff.isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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