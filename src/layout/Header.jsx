import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [currentCompany, setCurrentCompany] = useState(null);
  const [fiscalPeriods, setFiscalPeriods] = useState([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);

  useEffect(() => {
  const userData = JSON.parse(localStorage.getItem('user') || 'null');
  setUser(userData);

  // 작업 중인 회사 정보 가져오기
  if (userData && userData.companyId) {

    const companyName = localStorage.getItem('currentCompanyName');

    if (companyName) {
      setCurrentCompany(companyName);
    } else {
      fetch(`/api/companies/${userData.companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(r => {
        return r.json();
      })
      .then(data => {
        if (data.company) {
          localStorage.setItem('currentCompanyName', data.company.companyName);
          setCurrentCompany(data.company.companyName);
        }
      })
      .catch(err => {
        setCurrentCompany(null);
      });
    }

    // 회계기수 목록 가져오기
    fetch(`/api/companies/${userData.companyId}/fiscal-periods`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(r => r.json())
    .then(data => {
      if (data.periods) {
        setFiscalPeriods(data.periods);

        // localStorage에서 선택된 회계기수 가져오기
        const savedFiscalYear = localStorage.getItem('selectedFiscalYear');
        if (savedFiscalYear) {
          const selectedPeriod = data.periods.find(p => p.fiscalYear === parseInt(savedFiscalYear));
          if (selectedPeriod) {
            setSelectedFiscalYear(parseInt(savedFiscalYear));
            // 회계기수 전체 정보를 localStorage에 저장
            localStorage.setItem('selectedFiscalPeriodInfo', JSON.stringify({
              fiscalYear: selectedPeriod.fiscalYear,
              startDate: selectedPeriod.startDate,
              endDate: selectedPeriod.endDate,
              isClosed: selectedPeriod.isClosed
            }));
          }
        } else if (data.periods.length > 0) {
          // 저장된 값이 없으면 최신 기수 선택 (마감되지 않은 가장 큰 기수, 없으면 마지막 기수)
          const openPeriod = data.periods.find(p => !p.isClosed);
          const defaultPeriod = openPeriod || data.periods[data.periods.length - 1];
          setSelectedFiscalYear(defaultPeriod.fiscalYear);
          localStorage.setItem('selectedFiscalYear', defaultPeriod.fiscalYear);
          // 회계기수 전체 정보를 localStorage에 저장
          localStorage.setItem('selectedFiscalPeriodInfo', JSON.stringify({
            fiscalYear: defaultPeriod.fiscalYear,
            startDate: defaultPeriod.startDate,
            endDate: defaultPeriod.endDate,
            isClosed: defaultPeriod.isClosed
          }));
        }
      }
    })
    .catch(err => {
      console.error('Failed to load fiscal periods:', err);
    });
  } else {
    localStorage.removeItem('currentCompanyName');
    localStorage.removeItem('selectedFiscalYear');
    setCurrentCompany(null);
    setFiscalPeriods([]);
    setSelectedFiscalYear(null);
  }
}, [location]);
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // 날짜 포맷 함수 (YYYY.M.D)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}.${month}.${day}`;
  };

  const handleFiscalYearChange = (e) => {
    const fiscalYear = parseInt(e.target.value);
    const selectedPeriod = fiscalPeriods.find(p => p.fiscalYear === fiscalYear);

    if (selectedPeriod) {
      setSelectedFiscalYear(fiscalYear);
      localStorage.setItem('selectedFiscalYear', fiscalYear);
      // 회계기수 전체 정보를 localStorage에 저장
      localStorage.setItem('selectedFiscalPeriodInfo', JSON.stringify({
        fiscalYear: selectedPeriod.fiscalYear,
        startDate: selectedPeriod.startDate,
        endDate: selectedPeriod.endDate,
        isClosed: selectedPeriod.isClosed
      }));
      // 페이지 새로고침하여 선택된 회계기수 반영
      window.location.reload();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 onClick={(e) => navigate('/')}>회계 프로그램</h1>
          {currentCompany && (
            <span className={styles.currentCompany}
              onClick={()=>navigate('/mypage/company/manage')}
            >| {currentCompany}</span>
          )}
          {fiscalPeriods.length > 0 && selectedFiscalYear && (
            <select
              className={styles.fiscalPeriodSelect}
              value={selectedFiscalYear}
              onChange={handleFiscalYearChange}
            >
              {fiscalPeriods.map(period => {
                const startYear = new Date(period.startDate).getFullYear();
                const endYear = new Date(period.endDate).getFullYear();
                const displayYear = startYear === endYear ? `${startYear}년` : `${startYear}-${endYear}년`;

                return (
                  <option key={period.fiscalYear} value={period.fiscalYear}>
                    {period.fiscalYear}기 {displayYear} ({dayjs(period.startDate).format('YYYY.M.D.')} ~ {dayjs(period.endDate).format('YYYY.M.D.')})
                    {period.isClosed ? ' [마감]' : ''}
                  </option>
                );
              })}
            </select>
          )}
      </div>
      
      <div className={styles.headerRight}>
        {user ? (
          // 로그인 상태
          <>
            <span>{user.name}님</span>
            <button onClick={() => navigate('/mypage/profile')}>마이페이지</button>
            <button 
              onClick={handleLogout}
            >로그아웃</button>
          </>
        ) : (
          // 로그인 안 한 상태
          <>
            <button onClick={() => navigate('/login')}>로그인</button>
            <button onClick={() => navigate('/register')}>회원가입</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;