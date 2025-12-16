import { useState, useEffect } from 'react';
import { getAccountsByCompany } from '../../api/accountApi';
import styles from './SearchModal.module.css';

function AccountSearchModal({ onSelect, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchKeyword, accounts]);

  const fetchAccounts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getAccountsByCompany(user.companyId);
      setAccounts(response.accounts);
      setFilteredAccounts(response.accounts);
    } catch (error) {
      alert(error.response?.data?.error || '계정과목 조회 실패');
    }
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      setFilteredAccounts(accounts);
      return;
    }

    const keyword = searchKeyword.toLowerCase();
    const filtered = accounts.filter(account => {
      // 코드 또는 이름 둘 다 검색
      return account.account_code.toLowerCase().includes(keyword) ||
             account.account_name.toLowerCase().includes(keyword);
    });

    setFilteredAccounts(filtered);
  };

  const handleSelect = (account) => {
    onSelect(account);
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>계정과목 검색</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchInput}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="계정과목 코드 또는 계정과목 이름 검색"
              autoFocus
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>코드</th>
                <th>계정과목</th>
                <th>유형</th>
                <th>세부분류</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="4" className={styles.empty}>
                    검색 결과가 없습니다
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(account => (
                  <tr
                    key={account.account_id}
                    onClick={() => handleSelect(account)}
                    className={styles.selectableRow}
                  >
                    <td>{account.account_code}</td>
                    <td>{account.account_name}</td>
                    <td>{account.account_type}</td>
                    <td>{account.account_category || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountSearchModal;