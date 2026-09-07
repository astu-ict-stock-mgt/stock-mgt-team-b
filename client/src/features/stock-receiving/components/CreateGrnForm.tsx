/**
 * CreateGrnForm
 * SRS Reference: 4.4.9 - Stock Receiving Page (register goods, verify items, generate receiving notes)
 * Workflow Reference: Steps 5-7 (Receive -> Inspect -> Store)
 * Issue: feat(client/stock-receiving): Build GRN creation UI #16
 */
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, CheckCircle2, AlertCircle, Building2, Warehouse as WarehouseIcon, X } from 'lucide-react';
import { InspectionStatus, InventoryItem } from '../api';
import { useCreateGrn, useItemSearch, useSuppliers, useWarehouses, useCreateSupplier, useCreateWarehouse } from '../hooks';
import { useAuth } from '../../auth/hooks';
import styles from './CreateGrnForm.module.css';

interface LineItemDraft {
  key: string;
  item: InventoryItem | null;
  itemQuery: string;
  quantity: string;
  unitCost: string;
  remarks: string;
  inspectionResult?: InspectionStatus;
}

function makeEmptyLineItem(): LineItemDraft {
  return {
    key: crypto.randomUUID(),
    item: null,
    itemQuery: '',
    quantity: '',
    unitCost: '',
    remarks: '',
    inspectionResult: 'Accepted',
  };
}

function previewVoucherNumber() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}-${seq}`;
}

interface LineItemErrors {
  item?: string;
  quantity?: string;
  unitCost?: string;
}

function validateLineItem(line: LineItemDraft): LineItemErrors {
  const errors: LineItemErrors = {};
  if (!line.item) errors.item = 'Select an existing inventory item.';

  const quantity = Number(line.quantity);
  if (line.quantity.trim() === '' || Number.isNaN(quantity) || quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0.';
  }

  const unitCost = Number(line.unitCost);
  if (line.unitCost.trim() === '' || Number.isNaN(unitCost) || unitCost <= 0) {
    errors.unitCost = 'Unit cost must be greater than 0.';
  }

  return errors;
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function CreateGrnForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  void user;
  const { data: suppliers = [], isLoading: suppliersLoading, isError: suppliersError } = useSuppliers();
  const {
    data: warehouses = [],
    isLoading: warehousesLoading,
    isError: warehousesError,
  } = useWarehouses();
  const createGrnMutation = useCreateGrn();
  const createSupplierMutation = useCreateSupplier();
  const createWarehouseMutation = useCreateWarehouse();

  const [voucherPreview] = useState(previewVoucherNumber);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([makeEmptyLineItem()]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<'idle' | 'passed' | 'failed'>('idle');
  const [verifyErrors, setVerifyErrors] = useState<string[]>([]);

  // Quick modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [supplierModalError, setSupplierModalError] = useState('');

  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseLocation, setNewWarehouseLocation] = useState('');
  const [warehouseModalError, setWarehouseModalError] = useState('');

  const lineErrors = useMemo(() => lineItems.map(validateLineItem), [lineItems]);

  const hasDuplicateItems = useMemo(() => {
    const ids = lineItems.map((l) => l.item?.id).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }, [lineItems]);

  const hasFieldErrors =
    !supplierId ||
    !warehouseId ||
    !receivedDate ||
    hasDuplicateItems ||
    lineErrors.some((e) => Object.keys(e).length > 0);

  const canSubmit = lineItems.length > 0 && !hasFieldErrors;

  const totalValue = lineItems.reduce((sum, line) => {
    const qty = Number(line.quantity);
    const cost = Number(line.unitCost);
    if (Number.isNaN(qty) || Number.isNaN(cost)) return sum;
    return sum + qty * cost;
  }, 0);

  function updateLineItem(key: string, patch: Partial<LineItemDraft>) {
    setLineItems((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setVerifyResult('idle');
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, makeEmptyLineItem()]);
    setVerifyResult('idle');
  }

  function removeLineItem(key: string) {
    setLineItems((prev) => {
      const next = prev.filter((l) => l.key !== key);
      return next.length > 0 ? next : [makeEmptyLineItem()];
    });
    setVerifyResult('idle');
  }

  function collectValidationErrors(): string[] {
    const errors: string[] = [];
    if (!supplierId) errors.push('Select a supplier vendor.');
    if (!warehouseId) errors.push('Select a target storage warehouse.');
    if (!receivedDate) errors.push('Enter a valid date received.');
    if (lineItems.length === 0) errors.push('At least one item line is required.');

    lineItems.forEach((line, idx) => {
      const label = line.item?.name ?? `Line ${idx + 1}`;
      if (!line.item) errors.push(`Line ${idx + 1}: select an existing inventory item.`);
      const qty = Number(line.quantity);
      if (line.quantity.trim() === '' || Number.isNaN(qty) || qty <= 0) {
        errors.push(`${label}: quantity must be greater than 0.`);
      }
      const cost = Number(line.unitCost);
      if (line.unitCost.trim() === '' || Number.isNaN(cost) || cost <= 0) {
        errors.push(`${label}: unit cost must be greater than 0.`);
      }
    });

    const itemIdCounts = new Map<string, number>();
    lineItems.forEach((line) => {
      if (!line.item) return;
      itemIdCounts.set(line.item.id, (itemIdCounts.get(line.item.id) ?? 0) + 1);
    });
    itemIdCounts.forEach((count, itemId) => {
      if (count > 1) {
        const name = lineItems.find((l) => l.item?.id === itemId)?.item?.name ?? 'This item';
        errors.push(`${name} appears on more than one line. Combine it into a single line.`);
      }
    });

    return errors;
  }

  function handleVerify() {
    const errors = collectValidationErrors();
    setVerifyErrors(errors);
    setVerifyResult(errors.length === 0 ? 'passed' : 'failed');
    setSubmitAttempted(true);
  }

  async function handleQuickAddSupplier(e: FormEvent) {
    e.preventDefault();
    setSupplierModalError('');
    if (!newSupplierName.trim()) {
      setSupplierModalError('Supplier company name is required.');
      return;
    }
    try {
      const created = await createSupplierMutation.mutateAsync({
        name: newSupplierName.trim(),
        contactName: newSupplierContact.trim() || undefined,
        phone: newSupplierPhone.trim() || undefined,
        email: newSupplierEmail.trim() || undefined,
      });
      setSupplierId(created.id);
      setShowAddSupplierModal(false);
      setNewSupplierName('');
      setNewSupplierContact('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
    } catch (err: unknown) {
      setSupplierModalError(err instanceof Error ? err.message : 'Failed to register supplier.');
    }
  }

  async function handleQuickAddWarehouse(e: FormEvent) {
    e.preventDefault();
    setWarehouseModalError('');
    if (!newWarehouseName.trim()) {
      setWarehouseModalError('Warehouse name is required.');
      return;
    }
    try {
      const created = await createWarehouseMutation.mutateAsync({
        name: newWarehouseName.trim(),
        location: newWarehouseLocation.trim() || undefined,
      });
      setWarehouseId(created.id);
      setShowAddWarehouseModal(false);
      setNewWarehouseName('');
      setNewWarehouseLocation('');
    } catch (err: unknown) {
      setWarehouseModalError(err instanceof Error ? err.message : 'Failed to create warehouse.');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    setFormError(null);

    if (!canSubmit) return;

    try {
      const grn = await createGrnMutation.mutateAsync({
        supplierId,
        warehouseId,
        receivedDate,
        lineItems: lineItems.map((line) => ({
          itemId: line.item!.id,
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
        })),
      });
      navigate(`/stock-receiving/grns/${grn.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create GRN. Please try again.');
    }
  }

  return (
    <>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeader}>
          <h2>Shipment Identification &amp; Storage Target</h2>
          <p>
            Log newly received stock items directly into the system ledger. All fields must be
            validated.
          </p>
        </div>
        <div className={styles.divider} />

        <div className={styles.metaGrid}>
          {/* Supplier Vendor Field */}
          <div className={styles.field}>
            <div className="flex items-center justify-between">
              <label htmlFor="supplier">Supplier Vendor</label>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add New Vendor
              </button>
            </div>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setShowAddSupplierModal(true);
                } else {
                  setSupplierId(e.target.value);
                }
              }}
              disabled={suppliersLoading}
              aria-invalid={submitAttempted && !supplierId}
            >
              <option value="">
                {suppliersLoading ? 'Loading suppliers...' : 'Select supplier registry...'}
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__NEW__" className="font-semibold text-blue-600">
                + Add / Write New Supplier...
              </option>
            </select>
            {submitAttempted && !supplierId && (
              <p className={styles.errorText}>Select a supplier vendor.</p>
            )}
            {suppliersError && (
              <p className={styles.errorText}>
                Unable to load suppliers. Use the "+ Add New Vendor" button above to add one.
              </p>
            )}
          </div>

          {/* Receiving Voucher No */}
          <div className={styles.field}>
            <label htmlFor="voucher">Receiving Voucher No. (Auto)</label>
            <input
              id="voucher"
              type="text"
              value={voucherPreview}
              readOnly
              className={styles.readOnlyInput}
            />
          </div>

          {/* Date Received */}
          <div className={styles.field}>
            <label htmlFor="receivedDate">Date Received</label>
            <input
              id="receivedDate"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              aria-invalid={submitAttempted && !receivedDate}
            />
            {submitAttempted && !receivedDate && (
              <p className={styles.errorText}>Enter a valid receiving date.</p>
            )}
          </div>

          {/* Target Storage Warehouse Field */}
          <div className={styles.field}>
            <div className="flex items-center justify-between">
              <label htmlFor="warehouse">Target Storage Warehouse</label>
              <button
                type="button"
                onClick={() => setShowAddWarehouseModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add New Warehouse
              </button>
            </div>
            <select
              id="warehouse"
              value={warehouseId}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setShowAddWarehouseModal(true);
                } else {
                  setWarehouseId(e.target.value);
                }
              }}
              disabled={warehousesLoading}
              aria-invalid={submitAttempted && !warehouseId}
            >
              <option value="">
                {warehousesLoading ? 'Loading warehouses...' : 'Select warehouse...'}
              </option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
              <option value="__NEW__" className="font-semibold text-blue-600">
                + Add / Write New Warehouse...
              </option>
            </select>
            {submitAttempted && !warehouseId && (
              <p className={styles.errorText}>Select a target storage warehouse.</p>
            )}
            {warehousesError && (
              <p className={styles.errorText}>
                Unable to load warehouses. Use "+ Add New Warehouse" to register one.
              </p>
            )}
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Inbound Stock Items</h3>

        <div className={styles.table} role="table">
          <div className={styles.tableHeadRow} role="row">
            <span role="columnheader">Item Model &amp; Specifications</span>
            <span role="columnheader">Quantity</span>
            <span role="columnheader">Unit Price ($)</span>
            <span role="columnheader">Inspection</span>
            <span role="columnheader" className={styles.actionHeader}>
              Action
            </span>
          </div>

          {lineItems.map((line, index) => (
            <LineItemRow
              key={line.key}
              line={line}
              errors={submitAttempted ? lineErrors[index] : {}}
              canRemove={lineItems.length > 1}
              onChange={(patch) => updateLineItem(line.key, patch)}
              onRemove={() => removeLineItem(line.key)}
              selectedItemIds={lineItems
                .filter((l) => l.key !== line.key && l.item)
                .map((l) => l.item!.id)}
            />
          ))}
        </div>

        <button type="button" className={styles.addLineButton} onClick={addLineItem}>
          <Plus size={16} /> Add Item Line
        </button>

        <div className={styles.divider} />

        {verifyResult === 'passed' && (
          <div className={`${styles.banner} ${styles.bannerSuccess}`} role="status">
            <CheckCircle2 size={18} />
            <span>All items verified. Ready to complete receiving.</span>
          </div>
        )}
        {verifyResult === 'failed' && (
          <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
            <AlertCircle size={18} />
            <div>
              <p className={styles.bannerTitle}>Fix the following before continuing:</p>
              <ul>
                {verifyErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {formError && (
          <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.totalValue}>
            <span>Total Receiving Value</span>
            <strong>{money(totalValue)}</strong>
          </div>

          <div className={styles.footerActions}>
            {!canSubmit && submitAttempted && (
              <p className={styles.footerHint}>
                Fix the errors above before saving the draft.
              </p>
            )}
            <button type="button" className={styles.secondaryButton} onClick={handleVerify}>
              Verify Items
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={createGrnMutation.isPending}
            >
              {createGrnMutation.isPending ? 'Saving Draft...' : '💾 Save as Draft — Send to Inspection'}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Register New Supplier</h3>
                  <p className="text-xs text-gray-500">Add a new vendor directly to the registry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAddSupplier} className="mt-4 space-y-3.5">
              {supplierModalError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {supplierModalError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Company Name *</label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Addis Tech Supplies PLC"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Contact Person</label>
                <input
                  type="text"
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  placeholder="e.g. Daniel Girma"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="+251 911 234567"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    placeholder="sales@company.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {createSupplierMutation.isPending ? 'Saving...' : 'Save & Select Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Warehouse Modal */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <WarehouseIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Add Storage Warehouse</h3>
                  <p className="text-xs text-gray-500">Register a new storage location / room</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWarehouseModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAddWarehouse} className="mt-4 space-y-3.5">
              {warehouseModalError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {warehouseModalError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Warehouse Name *</label>
                <input
                  type="text"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  placeholder="e.g. Science Depo Store"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Location / Description</label>
                <input
                  type="text"
                  value={newWarehouseLocation}
                  onChange={(e) => setNewWarehouseLocation(e.target.value)}
                  placeholder="e.g. Block 4, Ground Floor"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createWarehouseMutation.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                >
                  {createWarehouseMutation.isPending ? 'Saving...' : 'Save & Select Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

interface LineItemRowProps {
  line: LineItemDraft;
  errors: LineItemErrors;
  canRemove: boolean;
  onChange: (patch: Partial<LineItemDraft>) => void;
  onRemove: () => void;
  selectedItemIds: string[];
}

function LineItemRow({
  line,
  errors,
  canRemove,
  onChange,
  onRemove,
  selectedItemIds,
}: LineItemRowProps) {
  const { data: itemResults, isFetching } = useItemSearch(line.itemQuery);
  const showResults = line.itemQuery.trim().length > 0 && !line.item;
  const availableResults = itemResults?.filter(
    (item) => item.id === line.item?.id || !selectedItemIds.includes(item.id)
  );

  return (
    <div className={styles.tableRow} role="row">
      <div className={styles.itemPicker}>
        {line.item ? (
          <div className={styles.itemChip}>
            <span>
              {line.item.name} <span className={styles.sku}>({line.item.sku})</span>
              <span className={styles.stockHint}>
                {' '}
                - {line.item.quantityOnHand} {line.item.unit} in stock
              </span>
            </span>
            <button
              type="button"
              className={styles.itemChipClear}
              onClick={() => onChange({ item: null, itemQuery: '' })}
              aria-label="Change item"
            >
              x
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={line.itemQuery}
              placeholder="Search item model or SKU (e.g. paper, cable)..."
              onChange={(e) => onChange({ itemQuery: e.target.value })}
              aria-invalid={Boolean(errors.item)}
            />
            {showResults && (
              <ul className={styles.itemResults} role="listbox">
                {isFetching && (
                  <li className={styles.itemResultEmpty}>Loading inventory items...</li>
                )}
                {!isFetching && availableResults?.length === 0 && (
                  <li className={styles.itemResultEmpty}>
                    {itemResults?.length ? 'Already added to this GRN.' : 'No matching items found.'}
                  </li>
                )}
                {availableResults?.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => onChange({ item, itemQuery: '' })}>
                      {item.name} <span className={styles.sku}>({item.sku})</span>
                      <span className={styles.stockHint}>
                        {' '}
                        - {item.quantityOnHand} {item.unit} in stock
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {errors.item && <p className={styles.errorText}>{errors.item}</p>}
      </div>

      <div>
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={line.quantity}
          placeholder="0"
          onChange={(e) => onChange({ quantity: e.target.value })}
          aria-invalid={Boolean(errors.quantity)}
        />
        {errors.quantity && <p className={styles.errorText}>{errors.quantity}</p>}
      </div>

      <div>
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={line.unitCost}
          placeholder="0.00"
          onChange={(e) => onChange({ unitCost: e.target.value })}
          aria-invalid={Boolean(errors.unitCost)}
        />
        {errors.unitCost && <p className={styles.errorText}>{errors.unitCost}</p>}
      </div>

      <div className={styles.inspectionToggle} role="group" aria-label="Inspection result">
        <button
          type="button"
          className={`${styles.inspectionButton} ${styles.accept} ${
            line.inspectionResult === 'Accepted' ? styles.active : ''
          }`}
          onClick={() => onChange({ inspectionResult: 'Accepted' })}
        >
          Accepted
        </button>
        <button
          type="button"
          className={`${styles.inspectionButton} ${styles.reject} ${
            line.inspectionResult === 'Rejected' ? styles.active : ''
          }`}
          onClick={() => onChange({ inspectionResult: 'Rejected' })}
        >
          Rejected
        </button>
      </div>

      <button
        type="button"
        className={styles.removeButton}
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove line item"
        title={!canRemove ? 'At least one item line is required.' : 'Remove line item'}
      >
        <Trash2 size={16} />
      </button>

      {line.inspectionResult === 'Rejected' && (
        <div className={styles.remarksRow}>
          <label htmlFor={`remarks-${line.key}`}>Rejection remarks</label>
          <input
            id={`remarks-${line.key}`}
            type="text"
            value={line.remarks}
            placeholder="Reason for rejection (damaged, short delivery, wrong item...)"
            onChange={(e) => onChange({ remarks: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
