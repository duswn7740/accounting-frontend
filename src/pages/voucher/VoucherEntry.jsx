import { useState, useEffect } from 'react';
import { getVoucherLinesByFiscalYear } from '../../api/voucherApi';
import VoucherSearchBar from './VoucherSearchBar';
import VoucherTable from './VoucherTable';
import styles from './VoucherEntry.module.css';

function VoucherEntry() {
  const [lines, setLines] = useState([]);
  const [searchType, setSearchType] = useState('date'); // date | period
  const [loading, setLoading] = useState(false);

  // 회계기수별로 전표 조회
  const fetchVoucherLines = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const fiscalYear = parseInt(localStorage.getItem('selectedFiscalYear') || '1');

      if (!fiscalYear) {
        alert('회계기수를 선택해주세요');
        return;
      }

      const response = await getVoucherLinesByFiscalYear(user.companyId, fiscalYear);
      console.log('[전표 조회] 받은 데이터 샘플 (첫 5개):');
      response.lines.slice(0, 5).forEach((line, idx) => {
        console.log(`  [${idx}] voucher_type: ${line.voucher_type}, debit: ${line.debit_amount}, credit: ${line.credit_amount}`);
      });
      setLines(response.lines);
    } catch (error) {
      alert(error.response?.data?.error || '전표 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVoucherLines();
  };

  // 컴포넌트 마운트 시 자동 조회
  useEffect(() => {
    fetchVoucherLines();
  }, []);

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