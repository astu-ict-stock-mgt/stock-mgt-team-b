/**
 * GrnView
 * Read-only, print-friendly view of a submitted GRN.
 * Route: /stock-receiving/grns/:id
 */
import { useParams } from 'react-router-dom';
import { useGrn } from '../hooks';
import styles from './GrnView.module.css';

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function GrnView() {
  const { id } = useParams<{ id: string }>();
  const { data: grn, isLoading, isError } = useGrn(id);

  if (isLoading) return <p className={styles.state}>Loading GRN...</p>;
  if (isError || !grn) return <p className={styles.state}>Unable to load this GRN.</p>;

  return (
    <div className={styles.page}>
      <div className={styles.printBar}>
        <button type="button" onClick={() => window.print()} className={styles.printButton}>
          Print GRN
        </button>
      </div>

      <div className={styles.sheet}>
        <header className={styles.sheetHeader}>
          <div>
            <p className={styles.eyebrow}>Goods Received Note</p>
            <h1>{grn.grnNumber}</h1>
          </div>
          <span className={`${styles.statusBadge} ${styles[statusClass(grn.status)]}`}>
            {grn.status}
          </span>
        </header>

        <dl className={styles.metaGrid}>
          <div>
            <dt>Supplier</dt>
            <dd>{grn.supplierName}</dd>
          </div>
          <div>
            <dt>Date Received</dt>
            <dd>{new Date(grn.receivedDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Target Warehouse</dt>
            <dd>{grn.warehouseName}</dd>
          </div>
          <div>
            <dt>Storekeeper</dt>
            <dd>{grn.createdBy}</dd>
          </div>
        </dl>

        <table className={styles.lineTable}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Line Total</th>
              <th>Inspection</th>
            </tr>
          </thead>
          <tbody>
            {grn.lineItems.map((line) => (
              <tr key={line.id}>
                <td>
                  {line.itemName} <span className={styles.sku}>({line.itemSku})</span>
                </td>
                <td>
                  {line.quantity} {line.unit}
                </td>
                <td>{money(line.unitCost)}</td>
                <td>{money(line.lineTotal)}</td>
                <td>
                  <span
                    className={`${styles.inspectionTag} ${
                      line.inspectionResult === 'Accepted' ? styles.accept : styles.reject
                    }`}
                  >
                    {line.inspectionResult}
                  </span>
                  {line.remarks && <p className={styles.remarks}>{line.remarks}</p>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total Value</td>
              <td>{money(grn.totalValue)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function statusClass(status: string): 'accepted' | 'rejected' | 'partial' {
  if (status === 'Accepted') return 'accepted';
  if (status === 'Rejected') return 'rejected';
  return 'partial';
}
