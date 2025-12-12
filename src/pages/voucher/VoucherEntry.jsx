import { useState, useEffect } from 'react';
import { getVoucherLinesByDate } from '../../api/voucherApi';
import VoucherSearchBar from './VoucherSearchBar';
import VoucherTable from './VoucherTable';
import styles from './VoucherEntry.module.css';

function VoucherEntry() {
  const [lines, setLines] = useState([]);
  const [searchType, setSearchType] = useState('date'); // date | period
  const [loading, setLoading] = useState(false);

  const fetchVoucherLines = async (startDate, endDate) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getVoucherLinesByDate(user.companyId, startDate, endDate);
      setLines(response.lines);
    } catch (error) {
      alert(error.response?.data?.error || '전표 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (startDate, endDate) => {
    fetchVoucherLines(startDate, endDate);
  };

  const handleLineUpdate = () => {
    // 테이블에서 라인 추가/수정/삭제 후 재조회
    const searchBar = document.querySelector('[data-search-bar]');
    if (searchBar) {
      searchBar.click();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>일반전표 입력</h2>
      </div>

      <VoucherSearchBar
        searchType={searchType}
        setSearchType={setSearchType}
        onSearch={handleSearch}
      />

      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <VoucherTable
          lines={lines}
          onLineUpdate={handleLineUpdate}
        />
      )}
    </div>
  );
}

export default VoucherEntry;