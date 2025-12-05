import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as companyApi from '../../api/companyApi';
import styles from './BusinessCompanyManage.module.css';

function BusinessCompanyManage() {
  const nav = useNavigate();
  
  const [currentCompany, setCurrentCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedEmployees, setApprovedEmployees] = useState([]);
  const [rejectedEmployees, setRejectedEmployees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  
  // 작업 중인 회사 정보 가져오기
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
    
  }, [nav]);
  
  // 데이터 로드
  useEffect(() => {
    if (!currentCompany) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          companyApi.getPendingRequests(currentCompany.companyId),
          companyApi.getApprovedEmployees(currentCompany.companyId),
          companyApi.getRejectedEmployees(currentCompany.companyId)
        ]);
        
        setPendingRequests(pendingRes.requests);
        setApprovedEmployees(approvedRes.employees);
        setRejectedEmployees(rejectedRes.employees);
        
      } catch (err) {
        alert(err.response?.data?.error || '데이터 조회 실패');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentCompany]);
  
  // 승인/거절/퇴사/재승인 처리
  const handleAction = async (companyUserId, action, actionName) => {
    const confirm = window.confirm(`정말 ${actionName}하시겠습니까?`);
    if (!confirm) return;
    
    try {
      setProcessing(companyUserId);
      
      const response = await companyApi.handleRequest(companyUserId, action);
      alert(response.message);
      
      // 목록 새로고침
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        companyApi.getPendingRequests(currentCompany.companyId),
        companyApi.getApprovedEmployees(currentCompany.companyId),
        companyApi.getRejectedEmployees(currentCompany.companyId)
      ]);
      
      setPendingRequests(pendingRes.requests);
      setApprovedEmployees(approvedRes.employees);
      setRejectedEmployees(rejectedRes.employees);
      
    } catch (err) {
      alert(err.response?.data?.error || '처리 실패');
    } finally {
      setProcessing(null);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>직원 관리</h1>
        <p>로딩 중...</p>
      </div>
    );
  }
  
  if (!currentCompany) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>직원 관리</h1>
      
      {/* 현재 회사 */}
      <div className={styles.companyInfo}>
        <h2 className={styles.companyName}>{currentCompany.companyName}</h2>
      </div>
      
      {/* 탭 메뉴 */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('pending')}
          className={`${styles.tab} ${activeTab === 'pending' ? styles.activeTab : ''}`}
        >
          가입 신청 ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`${styles.tab} ${activeTab === 'approved' ? styles.activeTab : ''}`}
        >
          승인된 직원 ({approvedEmployees.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`${styles.tab} ${activeTab === 'rejected' ? styles.activeTab : ''}`}
        >
          거절/퇴사 ({rejectedEmployees.length})
        </button>
      </div>
      
      {/* 가입 신청 목록 */}
      {activeTab === 'pending' && (
        <div className={styles.tabContent}>
          {pendingRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <p>대기 중인 신청이 없습니다</p>
            </div>
          ) : (
            <div className={styles.employeeList}>
              {pendingRequests.map((request) => (
                <div key={request.companyUserId} className={styles.employeeCard}>
                  <div className={styles.employeeInfo}>
                    <h3 className={styles.employeeName}>{request.name}</h3>
                    <p className={styles.employeeDetail}>이메일: {request.email}</p>
                    {request.phone && (
                      <p className={styles.employeeDetail}>연락처: {request.phone}</p>
                    )}
                    <p className={styles.employeeDetail}>
                      신청일: {new Date(request.joinedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleAction(request.companyUserId, 'approve', '승인')}
                      disabled={processing === request.companyUserId}
                      className={styles.approveButton}
                    >
                      {processing === request.companyUserId ? '처리 중...' : '승인'}
                    </button>
                    <button
                      onClick={() => handleAction(request.companyUserId, 'reject', '거절')}
                      disabled={processing === request.companyUserId}
                      className={styles.rejectButton}
                    >
                      {processing === request.companyUserId ? '처리 중...' : '거절'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 승인된 직원 목록 */}
      {activeTab === 'approved' && (
        <div className={styles.tabContent}>
          {approvedEmployees.length === 0 ? (
            <div className={styles.emptyState}>
              <p>승인된 직원이 없습니다</p>
            </div>
          ) : (
            <div className={styles.employeeList}>
              {approvedEmployees.map((employee) => (
                <div key={employee.companyUserId} className={styles.employeeCard}>
                  <div className={styles.employeeInfo}>
                    <h3 className={styles.employeeName}>
                      {employee.name}
                      <span className={styles.roleBadge}>
                        {employee.role === 'ADMIN' ? '관리자' : '직원'}
                      </span>
                    </h3>
                    <p className={styles.employeeDetail}>이메일: {employee.email}</p>
                    {employee.phone && (
                      <p className={styles.employeeDetail}>연락처: {employee.phone}</p>
                    )}
                    <p className={styles.employeeDetail}>
                      승인일: {new Date(employee.approvedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  {employee.role !== 'ADMIN' && (
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleAction(employee.companyUserId, 'reject', '퇴사 처리')}
                        disabled={processing === employee.companyUserId}
                        className={styles.rejectButton}
                      >
                        {processing === employee.companyUserId ? '처리 중...' : '퇴사'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 거절/퇴사 목록 */}
      {activeTab === 'rejected' && (
        <div className={styles.tabContent}>
          {rejectedEmployees.length === 0 ? (
            <div className={styles.emptyState}>
              <p>거절/퇴사한 직원이 없습니다</p>
            </div>
          ) : (
            <div className={styles.employeeList}>
              {rejectedEmployees.map((employee) => (
                <div key={employee.companyUserId} className={styles.employeeCard}>
                  <div className={styles.employeeInfo}>
                    <h3 className={styles.employeeName}>{employee.name}</h3>
                    <p className={styles.employeeDetail}>이메일: {employee.email}</p>
                    {employee.phone && (
                      <p className={styles.employeeDetail}>연락처: {employee.phone}</p>
                    )}
                    <p className={styles.employeeDetail}>
                      거절/퇴사일: {new Date(employee.approvedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleAction(employee.companyUserId, 'approve', '재승인')}
                      disabled={processing === employee.companyUserId}
                      className={styles.approveButton}
                    >
                      {processing === employee.companyUserId ? '처리 중...' : '재승인'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BusinessCompanyManage;