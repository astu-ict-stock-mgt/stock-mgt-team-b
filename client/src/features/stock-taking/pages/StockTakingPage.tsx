import { CountWorksheet } from '../components/CountWorksheet';
import { ReconciliationReview } from '../components/ReconciliationReview';

export function StockTakingPage() {
  return (
    <div className="space-y-8">
      <CountWorksheet />
      <ReconciliationReview />
    </div>
  );
}
