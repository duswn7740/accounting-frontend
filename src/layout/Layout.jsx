import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import styles from './Layout.module.css';

function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.layoutBody}>  {/* ← 이 div가 flex container */}
        <Sidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;