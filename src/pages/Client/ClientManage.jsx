import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as clientApi from '@/api/clientApi';
import { formatBusinessNumber } from '@/utils/companyValidate';
import styles from './ClientManage.module.css';
import ClientModal from './ClientModal';

function ClientManage() {
  const nav = useNavigate();
  
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('일반');
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  // 회사 정보 가져오기
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const companyName = localStorage.getItem('currentCompanyName');
    
    if (!user || !user.companyId || !companyName) {
      alert('작업 중인 회사를 먼저 선택해주세요');
      nav('/mypage/company/manage');
      return;
    }
    
    setCurrentCompany({
      companyId: user.companyId,
      companyName: companyName
    });
    
    setUserRole(user.userType === 'BUSINESS' ? 'ADMIN' : 'ACCOUNTANT');
    
  }, [nav]);
  
  // 거래처 목록 조회
  useEffect(() => {
    if (!currentCompany) return;
    
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await clientApi.getClientsByCategory(currentCompany.companyId, activeTab);
        setClients(response.clients);
      } catch (err) {
        alert(err.response?.data?.error || '거래처 조회 실패');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [currentCompany, activeTab]);
  
  // 등록 모달 열기
  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setShowModal(true);
  };
  
  // 수정 모달 열기
  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setShowModal(true);
  };
  
  // 삭제
  const handleDelete = async (clientId) => {
    const confirm = window.confirm('정말 삭제하시겠습니까?');
    if (!confirm) return;
    
    try {
      await clientApi.deleteClient(clientId);
      alert('삭제되었습니다');
      
      // 목록 새로고침
      const response = await clientApi.getClientsByCategory(currentCompany.companyId, activeTab);
      setClients(response.clients);
      
    } catch (err) {
      alert(err.response?.data?.error || '삭제 실패');
    }
  };
  
  if (loading && !currentCompany) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>거래처 관리</h1>
        <p>로딩 중...</p>
      </div>
    );
  }
  
  if (!currentCompany) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>거래처 관리</h1>
        {userRole === 'ACCOUNTANT' && (
          <button onClick={handleOpenCreateModal} className={styles.createButton}>
            + 거래처 등록
          </button>
        )}
      </div>
      
      {/* 탭 메뉴 */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('일반')}
          className={`${styles.tab} ${activeTab === '일반' ? styles.activeTab : ''}`}
        >
          일반 거래처 ({clients.filter(c => c.category === '일반').length})
        </button>
        <button
          onClick={() => setActiveTab('은행')}
          className={`${styles.tab} ${activeTab === '은행' ? styles.activeTab : ''}`}
        >
          은행 ({clients.filter(c => c.category === '은행').length})
        </button>
        <button
          onClick={() => setActiveTab('카드')}
          className={`${styles.tab} ${activeTab === '카드' ? styles.activeTab : ''}`}
        >
          카드 ({clients.filter(c => c.category === '카드').length})
        </button>
      </div>
      
      {/* 거래처 목록 */}
      <div className={styles.tabContent}>
        {loading ? (
          <p>로딩 중...</p>
        ) : clients.length === 0 ? (
          <div className={styles.emptyState}>
            <p>등록된 거래처가 없습니다</p>
          </div>
        ) : (
          <div className={styles.clientList}>
            {clients.map((client) => (
              <div key={client.client_id} className={styles.clientCard}>
                <div className={styles.clientInfo}>
                  <h3 className={styles.clientName}>
                    {client.client_name}
                    <span className={styles.clientCode}>[{client.client_code}]</span>
                  </h3>
                  {client.business_number && (
                    <p className={styles.clientDetail}>
                      사업자번호: {formatBusinessNumber(client.business_number)}
                    </p>
                  )}
                  {client.ceo_name && (
                    <p className={styles.clientDetail}>대표자: {client.ceo_name}</p>
                  )}
                  {client.tel && (
                    <p className={styles.clientDetail}>전화번호: {client.tel}</p>
                  )}
                  {client.email && (
                    <p className={styles.clientDetail}>이메일: {client.email}</p>
                  )}
                  {client.address && (
                    <p className={styles.clientDetail}>주소: {client.address}</p>
                  )}
                  {client.client_type && (
                    <p className={styles.clientDetail}>
                      거래처 유형: {client.client_type}
                    </p>
                  )}
                </div>
                
                {userRole === 'ACCOUNTANT' && (
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleOpenEditModal(client)}
                      className={styles.editButton}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(client.client_id)}
                      className={styles.deleteButton}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 등록/수정 모달 */}
      {showModal && (
        <ClientModal
          client={editingClient}
          category={activeTab}
          companyId={currentCompany.companyId}
          onClose={() => setShowModal(false)}
          onSuccess={async () => {
            setShowModal(false);
            const response = await clientApi.getClientsByCategory(currentCompany.companyId, activeTab);
            setClients(response.clients);
          }}
        />
      )}
    </div>
  );
}

export default ClientManage;