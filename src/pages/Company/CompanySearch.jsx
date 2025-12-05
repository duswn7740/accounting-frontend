import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCompanies, applyToCompany } from '../../api/companyApi';
import styles from './CompanySearch.module.css'
import { formatBusinessNumber } from '../../utils/companyValidate';

const CompanySearch = () => {
  const navigate = useNavigate();
  
  const [keyword, setKeyword] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null); // 신청 중인 회사 ID

  // 검색 (onChange에 포맷팅 추가)
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    
    // 숫자만 있으면 자동 포맷팅
    if (/^\d+$/.test(value.replace(/-/g, ''))) {
      setKeyword(formatBusinessNumber(value));
    } else {
      setKeyword(value);
    }
  };
  
  // 검색
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }
    
    try {
      setLoading(true);

      // 하이픈 제거하고 전송!
      const cleanKeyword = keyword.replace(/-/g, '');
      const response = await searchCompanies(cleanKeyword);
      setCompanies(response.companies);
      
      if (response.companies.length === 0) {
        alert('검색 결과가 없습니다');
      }
      
    } catch (err) {
      alert(err.response?.data?.error || '검색 실패');
    } finally {
      setLoading(false);
    }
  };
  
  // 가입 신청
  const handleApply = async (companyId) => {
    const confirm = window.confirm('이 회사에 가입 신청하시겠습니까?');
    if (!confirm) return;
    
    try {
      setApplying(companyId);
      
      const response = await applyToCompany(companyId);
      
      alert(response.message);

      // localStorage 업데이트 (pending 상태)
      const user = JSON.parse(localStorage.getItem('user'));
      user.hasCompany = false; // 아직 승인 안 됨
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/');
      
    } catch (err) {
      alert(err.response?.data?.error || '가입 신청 실패');
    } finally {
      setApplying(null);
    }
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>회사 검색</h1>
      
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="회사명 또는 사업자번호로 검색"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            handleKeywordChange(e)
          }}
          className={styles.searchInput}
        />
        <button 
          type="submit" 
          disabled={loading}
          className={styles.searchButton}
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </form>
      
      {companies.length > 0 && (
        <div className={styles.resultSection}>
          <h2 className={styles.resultTitle}>검색 결과 ({companies.length}개)</h2>
          <div className={styles.companyList}>
            {companies.map((company) => (
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
                </div>
                <button 
                  onClick={() => handleApply(company.companyId)}
                  disabled={applying === company.companyId}
                  className={styles.applyButton}
                >
                  {applying === company.companyId ? '신청 중...' : '가입 신청'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className={styles.buttonGroup}>
        <button 
          type="button" 
          onClick={() => nav('/')}
          className={styles.cancelButton}
        >
          취소
        </button>
      </div>
    </div>
  )
}

export default CompanySearch;