import { useState, useEffect } from 'react';
import styles from './Settlement.module.css';

function IncomeStatement() {
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(null);
  const [incomeData, setIncomeData] = useState(null);

  useEffect(() => {
    const periodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || 'null');
    if (periodInfo) {
      setFiscalYear(periodInfo.fiscalYear);
      fetchIncomeStatementData(periodInfo.fiscalYear);
    }
  }, []);

  const fetchIncomeStatementData = async (year) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `/api/settlement/income-statement/${user.companyId}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setIncomeData(data);
      }
    } catch (error) {
    }
  };

  const handleExecuteSettlement = async () => {
    if (!fiscalYear) {
      alert('회계기수를 선택해주세요');
      return;
    }

    const confirmMessage = `${fiscalYear}기 손익계산 결산을 실행하시겠습니까?\n\n수익 및 비용 계정이 당기순이익(998) 계정으로 대체됩니다.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `/api/settlement/income-statement/${user.companyId}/${fiscalYear}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert('손익계산 결산이 완료되었습니다');
        fetchIncomeStatementData(fiscalYear);
      } else {
        alert(data.message || '손익계산 결산에 실패했습니다');
      }
    } catch (error) {
      alert('손익계산 결산에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 계정 타입에 따라 수익/비용 여부 판단
  const isRevenueAccount = (accountType) => {
    return accountType === '수익' || accountType === 'REVENUE';
  };

  const isExpenseAccount = (accountType) => {
    return accountType === '비용' || accountType === 'EXPENSE';
  };

  // 수익과 비용 계정 분리
  const getRevenueAndExpenseDetails = () => {
    if (!incomeData?.details) {
      return { revenues: [], expenses: [] };
    }

    const revenues = [];
    const expenses = [];

    incomeData.details.forEach(detail => {
      if (isRevenueAccount(detail.account_type)) {
        revenues.push(detail);
      } else if (isExpenseAccount(detail.account_type)) {
        expenses.push(detail);
      }
    });

    return { revenues, expenses };
  };

  // 수익 금액 계산 (credit - debit)
  const getRevenueAmount = (detail) => {
    return (detail.total_credit || 0) - (detail.total_debit || 0);
  };

  // 비용 금액 계산 (debit - credit)
  const getExpenseAmount = (detail) => {
    return (detail.total_debit || 0) - (detail.total_credit || 0);
  };

  // 합계 계산
  const calculateRevenueTotalAmount = (revenues) => {
    return revenues.reduce((sum, detail) => sum + getRevenueAmount(detail), 0);
  };

  const calculateExpenseTotalAmount = (expenses) => {
    return expenses.reduce((sum, detail) => sum + getExpenseAmount(detail), 0);
  };

  const { revenues, expenses } = getRevenueAndExpenseDetails();
  const revenueTotal = calculateRevenueTotalAmount(revenues);
  const expenseTotal = calculateExpenseTotalAmount(expenses);
  const netIncome = revenueTotal - expenseTotal;

  return (
    <div className={styles.container}>
      <h1>손익계산서</h1>
      <div className={styles.content}>
        <div className={styles.infoBox}>
          <p>선택된 회계기수: {fiscalYear ? `${fiscalYear}기` : '선택되지 않음'}</p>
        </div>

        <div className={styles.dataDisplay}>
          {incomeData ? (
            <div className={styles.incomeStatement}>
              {/* I. 수익 섹션 */}
              <div className={styles.section}>
                <h3>I. 수익</h3>
                <table className={styles.detailTable}>
                  <thead>
                    <tr>
                      <th className={styles.codeCol}>계정코드</th>
                      <th className={styles.nameCol}>계정명</th>
                      <th className={styles.amountCol}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.length > 0 ? (
                      <>
                        {revenues.map((detail, index) => (
                          <tr key={index}>
                            <td className={styles.code}>{detail.account_code}</td>
                            <td className={styles.name}>{detail.account_name}</td>
                            <td className={styles.amount}>
                              {getRevenueAmount(detail).toLocaleString()} 원
                            </td>
                          </tr>
                        ))}
                        <tr className={styles.totalRow}>
                          <td className={styles.code}></td>
                          <td className={styles.totalLabel}>수익 합계</td>
                          <td className={styles.totalAmount}>
                            {revenueTotal.toLocaleString()} 원
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="3" className={styles.noData}>수익 계정이 없습니다</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* II. 비용 섹션 */}
              <div className={styles.section}>
                <h3>II. 비용</h3>
                <table className={styles.detailTable}>
                  <thead>
                    <tr>
                      <th className={styles.codeCol}>계정코드</th>
                      <th className={styles.nameCol}>계정명</th>
                      <th className={styles.amountCol}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length > 0 ? (
                      <>
                        {expenses.map((detail, index) => (
                          <tr key={index}>
                            <td className={styles.code}>{detail.account_code}</td>
                            <td className={styles.name}>{detail.account_name}</td>
                            <td className={styles.amount}>
                              {getExpenseAmount(detail).toLocaleString()} 원
                            </td>
                          </tr>
                        ))}
                        <tr className={styles.totalRow}>
                          <td className={styles.code}></td>
                          <td className={styles.totalLabel}>비용 합계</td>
                          <td className={styles.totalAmount}>
                            {expenseTotal.toLocaleString()} 원
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="3" className={styles.noData}>비용 계정이 없습니다</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* III. 당기순이익 섹션 */}
              <div className={styles.section}>
                <h3>III. 당기순이익</h3>
                <table className={styles.summaryTable}>
                  <tbody>
                    <tr>
                      <td className={styles.label}>수익 합계</td>
                      <td className={styles.amount}>{revenueTotal.toLocaleString()} 원</td>
                    </tr>
                    <tr>
                      <td className={styles.label}>비용 합계</td>
                      <td className={styles.amount}>{expenseTotal.toLocaleString()} 원</td>
                    </tr>
                    <tr className={styles.netIncomeRow}>
                      <td className={styles.label}>당기순이익 (수익 - 비용)</td>
                      <td className={styles.netIncomeAmount}>
                        {netIncome.toLocaleString()} 원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 기존 종합 현황 테이블 */}
              <div className={styles.section}>
                <h3>종합 현황</h3>
                <table className={styles.statementTable}>
                  <tbody>
                    <tr>
                      <td>수익 총계</td>
                      <td className={styles.amount}>{revenueTotal.toLocaleString()} 원</td>
                    </tr>
                    <tr>
                      <td>비용 총계</td>
                      <td className={styles.amount}>{expenseTotal.toLocaleString()} 원</td>
                    </tr>
                    <tr className={styles.totalRow}>
                      <td>당기순이익</td>
                      <td className={styles.amount}>
                        {netIncome.toLocaleString()} 원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p>데이터를 불러오는 중...</p>
          )}
        </div>

        <div className={styles.buttonContainer}>
          <button
            onClick={handleExecuteSettlement}
            disabled={loading || !fiscalYear}
            className={styles.executeButton}
          >
            {loading ? '처리 중...' : '결산 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomeStatement;
