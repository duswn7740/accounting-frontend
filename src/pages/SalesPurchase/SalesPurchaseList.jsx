import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as salesPurchaseApi from '@/api/salesPurchaseApi';
import Badge from '../../components/Badge';
import styles from './SalesPurchaseList.module.css';

function SalesPurchaseList() {
  const nav = useNavigate();

  const [currentCompany, setCurrentCompany] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 기간 필터
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

    // 기본 날짜 설정 (이번 달)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, [nav]);

  // 전표 목록 조회
  useEffect(() => {
    if (!currentCompany) return;
    fetchVouchers();
  }, [currentCompany]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await salesPurchaseApi.getVouchersByCompany(currentCompany.companyId);
      setVouchers(response.vouchers);
    } catch (err) {
      alert(err.response?.data?.error || '전표 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 기간별 조회
  const handleSearchByDate = async () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 입력해주세요');
      return;
    }

    if (startDate > endDate) {
      alert('시작일이 종료일보다 클 수 없습니다');
      return;
    }

    try {
      setLoading(true);
      const response = await salesPurchaseApi.getVouchersByDateRange(
        currentCompany.companyId,
        startDate,
        endDate
      );
      setVouchers(response.vouchers);
    } catch (err) {
      alert(err.response?.data?.error || '전표 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 전표 삭제
  const handleDelete = async (voucherId, voucherNo) => {
    const confirm = window.confirm(`전표번호 ${voucherNo}를 삭제하시겠습니까?`);
    if (!confirm) return;

    try {
      await salesPurchaseApi.deleteVoucher(voucherId);
      alert('전표가 삭제되었습니다');
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.error || '삭제 실패');
    }
  };

  // 전표 상세보기 (수정 페이지로 이동)
  const handleViewDetail = (voucherId) => {
    nav(`/voucher/sales-purchase/edit/${voucherId}`);
  };

  if (!currentCompany) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>매입매출 전표 조회</h1>
        <button
          onClick={() => nav('/voucher/sales-purchase')}
          className={styles.createButton}
        >
          + 전표 등록
        </button>
      </div>

      {/* 검색 필터 */}
      <div className={styles.filterSection}>
        <div className={styles.dateFilter}>
          <label className={styles.label}>조회 기간</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.input}
          />
          <span className={styles.dateSeparator}>~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.input}
          />
          <button onClick={handleSearchByDate} className={styles.searchButton}>
            조회
          </button>
        </div>
      </div>

      {/* 전표 목록 */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <p>로딩 중...</p>
        ) : vouchers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>조회된 전표가 없습니다</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>전표일자</th>
                <th>전표번호</th>
                <th>전표유형</th>
                <th>거래처코드</th>
                <th>거래처명</th>
                <th>사업자번호</th>
                <th>세금계산서</th>
                <th>공급가액</th>
                <th>부가세</th>
                <th>합계금액</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr
                  key={voucher.voucher_id}
                  onClick={() => handleViewDetail(voucher.voucher_id)}
                  className={styles.clickableRow}
                >
                  <td>{new Date(voucher.voucher_date).toLocaleDateString()}</td>
                  <td>{voucher.voucher_no}</td>
                  <td>
                    <Badge variant={voucher.voucher_type}>
                      {voucher.voucher_type}
                    </Badge>
                  </td>
                  <td>{voucher.client_code}</td>
                  <td>{voucher.client_name}</td>
                  <td>{voucher.business_number || '-'}</td>
                  <td>{voucher.tax_invoice_yn ? 'O' : '-'}</td>
                  <td className={styles.amount}>
                    {Number(voucher.total_supply_amount).toLocaleString()}
                  </td>
                  <td className={styles.amount}>
                    {Number(voucher.total_vat_amount).toLocaleString()}
                  </td>
                  <td className={styles.amount}>
                    {Number(voucher.total_amount).toLocaleString()}
                  </td>
                  <td>
                    <Badge variant={voucher.status}>
                      {voucher.status}
                    </Badge>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(voucher.voucher_id, voucher.voucher_no)}
                      className={styles.deleteButton}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SalesPurchaseList;
