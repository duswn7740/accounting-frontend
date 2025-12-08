import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // 마이페이지 경로면 마이페이지 메뉴 표시
  const isMyPage = location.pathname.startsWith('/mypage');
  
  if (isMyPage) {
    return (
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>마이페이지</h2>
        <nav className={styles.nav}>
          <ul>
            <li>
              <NavLink to="/mypage/profile">내 정보</NavLink>
            </li>
            {
              user && user.userType === 'BUSINESS' ? 
              <ul>
                <li><NavLink to='/mypage/company/register'>회사 등록</NavLink></li>
                <li><NavLink to='/mypage/company/manage'>회사 관리</NavLink></li>
                <li><NavLink to='/mypage/company/business-manage'>직원 관리</NavLink></li>
              </ul> :
              <ul>
                <li><NavLink to='/mypage/company/search'>회사 검색</NavLink></li>
                <li><NavLink to='/mypage/company/manage'>회사 관리</NavLink></li>
              </ul>
            }
          </ul>
        </nav>
      </aside>
    );
  }
  
  // 기본 메뉴
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul>
          <li>
            <NavLink to="/">대시보드</NavLink>
          </li>
          
          <li className={styles.menuTitle}>전표 입력</li>
          <li>
            <NavLink to="/voucher/general">일반전표</NavLink>
          </li>
          <li>
            <NavLink to="/voucher/sales-purchase">매입매출전표</NavLink>
          </li>
          
          <li className={styles.menuTitle}>마스터 데이터</li>
          <li>
            <NavLink to="/accounts">계정과목 관리</NavLink>
          </li>
          <li>
            <NavLink to="/clients/manage">거래처 관리</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;