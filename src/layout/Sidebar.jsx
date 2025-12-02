import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

function Sidebar() {
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
            <NavLink to="/clients">거래처 관리</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;