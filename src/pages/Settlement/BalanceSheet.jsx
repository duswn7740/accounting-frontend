import { useState, useEffect } from 'react';
import styles from './Settlement.module.css';

function BalanceSheet() {
  const [fiscalYear, setFiscalYear] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const periodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || 'null');
    if (periodInfo) {
      setFiscalYear(periodInfo.fiscalYear);
      fetchBalanceSheetData(periodInfo.fiscalYear);
    }
  }, []);

  const fetchBalanceSheetData = async (year) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `/api/settlement/balance-sheet/${user.companyId}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setBalanceData(data);
      }
    } catch (error) {
      console.error('대차대조표 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>대차대조표</h1>
      <div className={styles.content}>
        <div className={styles.infoBox}>
          <p>선택된 회계기수: {fiscalYear ? `${fiscalYear}기` : '선택되지 않음'}</p>
        </div>

        {loading ? (
          <p>데이터를 불러오는 중...</p>
        ) : balanceData ? (
          <div className={styles.balanceSheet}>
            <div className={styles.balanceSheetGrid}>
              <div className={styles.balanceSheetColumn}>
                <h3>자산</h3>
                <table className={styles.statementTable}>
                  <tbody>
                    {balanceData.assets?.map((asset, index) => (
                      <tr key={index}>
                        <td>{asset.accountCode} {asset.accountName}</td>
                        <td className={styles.amount}>{asset.balance?.toLocaleString()} 원</td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td>자산 총계</td>
                      <td className={styles.amount}>{balanceData.totalAssets?.toLocaleString()} 원</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.balanceSheetColumn}>
                <h3>부채</h3>
                <table className={styles.statementTable}>
                  <tbody>
                    {balanceData.liabilities?.map((liability, index) => (
                      <tr key={index}>
                        <td>{liability.accountCode} {liability.accountName}</td>
                        <td className={styles.amount}>{liability.balance?.toLocaleString()} 원</td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td>부채 총계</td>
                      <td className={styles.amount}>{balanceData.totalLiabilities?.toLocaleString()} 원</td>
                    </tr>
                  </tbody>
                </table>

                <h3>자본</h3>
                <table className={styles.statementTable}>
                  <tbody>
                    {balanceData.equity?.map((eq, index) => (
                      <tr key={index}>
                        <td>{eq.accountCode} {eq.accountName}</td>
                        <td className={styles.amount}>{eq.balance?.toLocaleString()} 원</td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td>자본 총계</td>
                      <td className={styles.amount}>{balanceData.totalEquity?.toLocaleString()} 원</td>
                    </tr>
                  </tbody>
                </table>

                <div className={styles.balanceCheck}>
                  <table className={styles.statementTable}>
                    <tbody>
                      <tr className={styles.totalRow}>
                        <td>부채 + 자본 총계</td>
                        <td className={styles.amount}>
                          {(balanceData.totalLiabilities + balanceData.totalEquity)?.toLocaleString()} 원
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>데이터가 없습니다</p>
        )}
      </div>
    </div>
  );
}

export default BalanceSheet;
