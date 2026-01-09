import { useState, useEffect } from 'react';
import { getAccountsByCompany, deleteAccount } from '../../api/accountApi';
import AccountModal from './AccountModal';
import Button from '../../components/Button';
import styles from './AccountManage.module.css';

function AccountManage() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('자산');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  const tabs = ['자산', '부채', '자본', '수익', '비용'];

  useEffect(() => {
    fetchAccounts();
    fetchUserRole();
  }, []);

  useEffect(() => {
    const filtered = accounts.filter(acc => acc.account_type === activeTab);
    setFilteredAccounts(filtered);
  }, [activeTab, accounts]);

  const fetchUserRole = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/companies/my-companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      const currentCompany = data.companies.find(
        c => c.companyId === user.companyId && c.status === 'APPROVED'
      );
      
      setUserRole(currentCompany?.role || '');
      
    } catch (error) {
      console.error('역할 조회 실패:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getAccountsByCompany(user.companyId);
      setAccounts(response.accounts);
    } catch (error) {
      alert(error.response?.data?.error || '계정과목 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`${account.account_name} 계정과목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteAccount(account.account_id);
      alert('계정과목이 삭제되었습니다');
      fetchAccounts();
    } catch (error) {
      alert(error.response?.data?.error || '삭제 실패');
    }
  };

  const handleModalClose = (refresh) => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    if (refresh) {
      fetchAccounts();
    }
  };

  if (loading) {
    return <div className={styles.container}>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>계정과목 관리</h2>
        {userRole === 'ADMIN' && (
          <Button variant="primary" onClick={handleAddAccount}>
            계정과목 추가
          </Button>
        )}
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr>
            <th>계정코드</th>
            <th>계정과목명</th>
            <th>계정유형</th>
            <th>세부분류</th>
            <th>차변증가</th>
            <th>시스템</th>
            {userRole === 'ADMIN' && <th>관리</th>}
          </tr></thead>
          <tbody>
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'ADMIN' ? 7 : 6} className={styles.empty}>
                  계정과목이 없습니다
                </td>
              </tr>
            ) : (
              filteredAccounts.map(account => (
                <tr key={account.account_id}>
                  <td>{account.account_code}</td>
                  <td>{account.account_name}</td>
                  <td>{account.account_type}</td>
                  <td>{account.account_category || '-'}</td>
                  <td>{account.is_debit_normal ? '○' : '×'}</td>
                  <td>{account.is_system ? '기본' : '추가'}</td>
                  {userRole === 'ADMIN' && (
                    <td>
                      <Button variant="primary" size="small" onClick={() => handleEditAccount(account)}>
                        수정
                      </Button>
                      <Button variant="danger" size="small" onClick={() => handleDeleteAccount(account)}>
                        삭제
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AccountModal
          account={selectedAccount}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default AccountManage;