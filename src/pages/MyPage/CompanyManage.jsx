import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCompanies } from '../../api/companyApi';
import { formatBusinessNumber } from '../../utils/companyValidate';
import styles from './CompanyManage.module.css';

function CompanyManage() {
  const nav = useNavigate();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  
  // 회사 목록 조회
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await getMyCompanies();
        setCompanies(response.companies);
        
        // localStorage에서 현재 선택된 회사 가져오기
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentCompanyId(user?.companyId || null);
        
      } catch (err) {
        alert(err.response?.data?.error || '회사 목록 조회 실패');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);
  
  // 작업 회사 선택
  const handleSelectCompany = (company) => {
    localStorage.setItem('companyId', company.companyId);
    localStorage.setItem('currentCompanyName', company.companyName);
  const user = JSON.parse(localStorage.getItem('user'));
    user.companyId = company.companyId;
    user.hasCompany = true;
    localStorage.setItem('user', JSON.stringify(user));
    
    // 회사명도 저장!
    localStorage.setItem('currentCompanyName', company.companyName);
    
    setCurrentCompanyId(company.companyId);
    alert('작업 회사가 변경되었습니다');
    
    // 페이지 새로고침으로 Header 업데이트
    window.location.reload();
  };
  
  // 상태별 분류
  const approvedCompanies = companies.filter(c => c.status === 'APPROVED');
  const pendingCompanies = companies.filter(c => c.status === 'PENDING');
  const rejectedCompanies = companies.filter(c => c.status === 'REJECTED');
  
  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>회사 관리</h1>
        <p>로딩 중...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>회사 관리</h1>
      
      {/* 승인된 회사 */}
      {approvedCompanies.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>승인된 회사 ({approvedCompanies.length})</h2>
          <div className={styles.companyList}>
            {approvedCompanies.map((company) => (
              <div 
                key={company.companyId} 
                className={`${styles.companyCard} ${currentCompanyId === company.companyId ? styles.active : ''}`}
              >
                <div className={styles.companyInfo}>
                  <h3 className={styles.companyName}>
                    {company.companyName}
                    {currentCompanyId === company.companyId && (
                      <span className={styles.currentBadge}>현재 작업 중</span>
                    )}
                  </h3>
                  <p className={styles.companyDetail}>
                    사업자번호: {formatBusinessNumber(company.businessNumber)}
                  </p>
                  {company.ceoName && (
                    <p className={styles.companyDetail}>
                      대표자: {company.ceoName}
                    </p>
                  )}
                  <p className={styles.companyDetail}>
                    역할: {company.role === 'ADMIN' ? '관리자' : '직원'}
                  </p>
                  {company.approvedAt && (
                    <p className={styles.companyDetail}>
                      승인일: {new Date(company.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {currentCompanyId !== company.companyId && (
                  <button
                    onClick={() => handleSelectCompany(company)}
                    className={styles.selectButton}
                  >
                    이 회사로 작업하기
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 대기 중인 회사 */}
      {pendingCompanies.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>승인 대기 중 ({pendingCompanies.length})</h2>
          <div className={styles.companyList}>
            {pendingCompanies.map((company) => (
              <div key={company.companyId} className={styles.companyCard}>
                <div className={styles.companyInfo}>
                  <h3 className={styles.companyName}>{company.companyName}</h3>
                  <p className={styles.companyDetail}>
                    사업자번호: {formatBusinessNumber(company.businessNumber)}
                  </p>
                  {company.ceoName && (
                    <p className={styles.companyDetail}>
                      대표자: {company.ceoName}
                    </p>
                  )}
                  <p className={styles.statusPending}>승인 대기 중</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 거절된 회사 */}
      {rejectedCompanies.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>가입 거절됨 ({rejectedCompanies.length})</h2>
          <div className={styles.companyList}>
            {rejectedCompanies.map((company) => (
              <div key={company.companyId} className={styles.companyCard}>
                <div className={styles.companyInfo}>
                  <h3 className={styles.companyName}>{company.companyName}</h3>
                  <p className={styles.companyDetail}>
                    사업자번호: {formatBusinessNumber(company.businessNumber)}
                  </p>
                  {company.ceoName && (
                    <p className={styles.companyDetail}>
                      대표자: {company.ceoName}
                    </p>
                  )}
                  <p className={styles.statusRejected}>가입 거절됨</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 회사 없음 */}
      {companies.length === 0 && (
        <div className={styles.emptyState}>
          <p>소속된 회사가 없습니다</p>
          <button 
            onClick={() => nav('/mypage/company/search')}
            className={styles.searchButton}
          >
            회사 검색하기
          </button>
        </div>
      )}
    </div>
  );
}

export default CompanyManage;