import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useEffect, useState } from 'react';

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [currentCompany, setCurrentCompany] = useState(null);
  
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
  } else {
    localStorage.removeItem('currentCompanyName');
    setCurrentCompany(null);
  }
}, [location]);
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
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