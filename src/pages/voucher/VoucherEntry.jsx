import { useState } from 'react';
import DateRangeFilter from '../../components/DateRangeFilter';
import VoucherTable from './VoucherTable';
import styles from './VoucherEntry.module.css';

function VoucherEntry() {
  const [searchDates, setSearchDates] = useState({ startDate: '', endDate: '' });

  const handleSearch = (startDate, endDate) => {
    setSearchDates({ startDate, endDate });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>일반전표 입력</h2>
      </div>

      <DateRangeFilter onSearch={handleSearch} />

      <VoucherTable searchDates={searchDates} />
    </div>
  );
}

export default VoucherEntry;