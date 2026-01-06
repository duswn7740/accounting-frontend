import { useState } from 'react';
import DateRangeFilter from '../../components/DateRangeFilter';
import SalesPurchaseTable from './SalesPurchaseTable';
import styles from './SalesPurchaseEntry.module.css';

function SalesPurchaseEntry() {
  const [searchDates, setSearchDates] = useState({ startDate: '', endDate: '' });

  const handleSearch = (startDate, endDate) => {
    setSearchDates({ startDate, endDate });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>매입매출 전표 입력</h2>
      </div>

      <DateRangeFilter onSearch={handleSearch} />

      <SalesPurchaseTable searchDates={searchDates} />
    </div>
  );
}

export default SalesPurchaseEntry;
