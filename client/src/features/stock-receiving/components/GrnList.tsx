/**
 * GrnList
 * SRS Reference: 4.4.9 - Stock Receiving Page
 * Route: /stock-receiving/grns
 * Displays every historical GRN with date, supplier, total value, and status.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useGrnList } from '../hooks';
import { GrnStatus } from '../api';
import styles from './GrnList.module.css';

const STATUS_FILTERS: (GrnStatus | 'All')[] = ['All', 'Accepted', 'Partially Accepted', 'Rejected'];

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function GrnList() {
  const { data: grns, isLoading, isError } = useGrnList();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GrnStatus | 'All'>('All');

  const filtered = useMemo(() => {
    if (!grns) return [];
    const q = search.trim().toLowerCase();
    return grns.filter((g) => {
      const matchesSearch =
        !q || g.grnNumber.toLowerCase().includes(q) || g.supplierName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [grns, search, statusFilter]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2>Goods Received Notes</h2>
          <p>Complete history of inbound shipments logged into the system ledger.</p>
        </div>
        <Link to="/stock-receiving" className={styles.newButton}>
          + New GRN
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search GRN number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search GRNs"
          />
        </div>
        <div className={styles.filterGroup} role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className={styles.state}>Loading GRNs...</p>}
      {isError && <p className={styles.state}>Unable to load GRNs. Please try again.</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p>No goods received notes match your search.</p>
          <Link to="/stock-receiving">Record a new delivery</Link>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>GRN Number</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id}>
                <td className={styles.grnNumber}>{g.grnNumber}</td>
                <td>{new Date(g.receivedDate).toLocaleDateString()}</td>
                <td>{g.supplierName}</td>
                <td>{money(g.totalValue)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[statusClass(g.status)]}`}>
                    {g.status}
                  </span>
                </td>
                <td>
                  <Link to={`/stock-receiving/grns/${g.id}`} className={styles.viewLink}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function statusClass(status: GrnStatus): 'accepted' | 'rejected' | 'partial' {
  if (status === 'Accepted') return 'accepted';
  if (status === 'Rejected') return 'rejected';
  return 'partial';
}
