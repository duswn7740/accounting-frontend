import { useState, useEffect } from 'react';
import { getClientsByCompany } from '../../api/clientApi';
import ClientModal from '../Client/ClientModal';
import styles from './SearchModal.module.css';

function ClientSearchModal({ onSelect, onClose }) {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchKeyword, clients]);

  const fetchClients = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getClientsByCompany(user.companyId);
      setClients(response.clients);
      setFilteredClients(response.clients);
    } catch (error) {
      alert(error.response?.data?.error || '거래처 조회 실패');
    }
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      setFilteredClients(clients);
      return;
    }

    const keyword = searchKeyword.toLowerCase();
    const filtered = clients.filter(client => {
      // 코드, 이름, 사업자번호 모두 검색
      const codeMatch = client.client_code.toLowerCase().includes(keyword);
      const nameMatch = client.client_name.toLowerCase().includes(keyword);
      const businessNumberMatch = client.business_number?.replace(/-/g, '').includes(keyword.replace(/-/g, ''));

      return codeMatch || nameMatch || businessNumberMatch;
    });

    setFilteredClients(filtered);
  };

  const handleSelect = (client) => {
    onSelect(client);
  };

  const handleClientModalSuccess = async () => {
    setShowClientModal(false);
    await fetchClients();
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>거래처 검색</h3>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="거래처 코드, 거래처명 또는 사업자번호 검색"
                autoFocus
              />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>코드</th>
                  <th>거래처명</th>
                  <th>사업자번호</th>
                  <th>대표자</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.empty}>
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <tr
                      key={client.client_id}
                      onClick={() => handleSelect(client)}
                      className={styles.selectableRow}
                    >
                      <td>{client.client_code}</td>
                      <td>{client.client_name}</td>
                      <td>{client.business_number || '-'}</td>
                      <td>{client.ceo_name || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={styles.registerButton}
              onClick={() => setShowClientModal(true)}
            >
              거래처 등록
            </button>
            <button className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
          </div>
        </div>
      </div>

      {/* 거래처 등록 모달 */}
      {showClientModal && (
        <ClientModal
          companyId={JSON.parse(localStorage.getItem('user')).companyId}
          onClose={() => setShowClientModal(false)}
          onSuccess={handleClientModalSuccess}
        />
      )}
    </>
  );
}

export default ClientSearchModal;