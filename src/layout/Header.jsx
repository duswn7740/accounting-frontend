import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };
  
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 onClick={() => navigate('/')}>회계 프로그램</h1>
      </div>
      
      <div className={styles.headerRight}>
        {user ? (
          // 로그인 상태
          <>
            <span>{user.name}님</span>
            <button onClick={() => navigate('/mypage')}>마이페이지</button>
            <button onClick={handleLogout}>로그아웃</button>
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