import React, { useState, useEffect } from 'react';
import styles from './Settlement.module.css';

function TrialBalance() {
  const [fiscalYear, setFiscalYear] = useState(null);
  const [period, setPeriod] = useState(null);
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const periodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || 'null');
    if (periodInfo) {
      setFiscalYear(periodInfo.fiscalYear);
      setPeriod(periodInfo.period);
      fetchTrialBalanceData(periodInfo.fiscalYear);
    }
  }, []);

  const fetchTrialBalanceData = async (year) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('합계잔액시산표 조회 시작:', { companyId: user.companyId, fiscalYear: year });

      const response = await fetch(
        `/api/settlement/trial-balance/${user.companyId}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('응답 상태:', response.status, response.statusText);
      const data = await response.json();
      console.log('받은 데이터:', data);
      console.log('계정 개수:', data.accounts?.length);

      // 보통예금 계정 확인
      const ordinaryDeposit = data.accounts?.find(acc => acc.accountName?.includes('보통예금'));
      if (ordinaryDeposit) {
        console.log('보통예금 계정 발견:', ordinaryDeposit);
      } else {
        console.log('보통예금 계정 없음');
      }

      if (response.ok) {
        setTrialBalanceData(data);
      } else {
        console.error('API 응답 에러:', data);
        alert(`데이터 조회 실패: ${data.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('합계잔액시산표 데이터 조회 실패:', error);
      alert(`오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (amount === 0 || amount === null || amount === undefined) {
      return '';
    }
    return amount.toLocaleString();
  };

  // 금액이 있는 계정만 필터링 (합계 또는 잔액에 금액이 있는 경우)
  const filterAccountsWithAmount = (accounts) => {
    console.log('필터링 전 계정 수:', accounts.length);
    const filtered = accounts.filter(account => {
      const hasTotal = (account.totalDebit && account.totalDebit !== 0) ||
                       (account.totalCredit && account.totalCredit !== 0);
      const hasBalance = (account.balanceDebit && account.balanceDebit !== 0) ||
                         (account.balanceCredit && account.balanceCredit !== 0);
      const shouldShow = hasTotal || hasBalance;

      // 보통예금 계정 필터링 로그
      if (account.accountName?.includes('보통예금')) {
        console.log('보통예금 필터링:', {
          accountName: account.accountName,
          totalDebit: account.totalDebit,
          totalCredit: account.totalCredit,
          balanceDebit: account.balanceDebit,
          balanceCredit: account.balanceCredit,
          hasTotal,
          hasBalance,
          shouldShow
        });
      }

      return shouldShow;
    });
    console.log('필터링 후 계정 수:', filtered.length);
    return filtered;
  };

  // 계정과목 카테고리로 그룹 판단
  const getAccountGroup = (account) => {
    // account_category가 있으면 그대로 사용
    if (account.accountCategory) {
      return account.accountCategory;
    }

    // category가 없으면 accountType 사용
    return account.accountType || '기타';
  };

  // 카테고리별로 계정 그룹핑
  const groupAccountsByCategory = (accounts) => {
    const grouped = {};
    accounts.forEach(account => {
      const group = getAccountGroup(account);
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(account);

      // 보통예금 계정 그룹핑 로그
      if (account.accountName?.includes('보통예금')) {
        console.log('보통예금 그룹핑:', {
          accountName: account.accountName,
          accountCategory: account.accountCategory,
          accountType: account.accountType,
          group
        });
      }
    });
    console.log('그룹핑 결과:', Object.keys(grouped));
    Object.keys(grouped).forEach(key => {
      console.log(`${key}: ${grouped[key].length}개 계정`);
    });
    return grouped;
  };

  // 카테고리 순서 정의
  const categoryOrder = [
    '유동자산', '비유동자산', '재고자산', '자산',
    '유동부채', '비유동부채', '부채',
    '자본',
    '매출', '제조원가', '도급비용', '영업비용', '판매관리비', '수익', '비용',
    '영업외수익', '영업외비용',
    '기타'
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>합계잔액시산표</h1>
        <div className={styles.content}>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!trialBalanceData) {
    return (
      <div className={styles.container}>
        <h1>합계잔액시산표</h1>
        <div className={styles.content}>
          <p>데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>합계잔액시산표</h1>
      <div className={styles.content}>
        <div className={styles.infoBox}>
          <p>선택된 회계기간: {fiscalYear ? `${fiscalYear}기` : '선택되지 않음'}</p>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th colSpan="2" style={{ textAlign: 'center' }}>차변</th>
              <th rowSpan="2" style={{ textAlign: 'center' }}>계정과목</th>
              <th colSpan="2" style={{ textAlign: 'center' }}>대변</th>
            </tr>
            <tr>
              <th style={{ textAlign: 'center' }}>잔액</th>
              <th style={{ textAlign: 'center' }}>합계</th>
              <th style={{ textAlign: 'center' }}>합계</th>
              <th style={{ textAlign: 'center' }}>잔액</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filteredAccounts = filterAccountsWithAmount(trialBalanceData.accounts);
              const groupedAccounts = groupAccountsByCategory(filteredAccounts);

              return categoryOrder.map(category => {
                const accounts = groupedAccounts[category];
                if (!accounts || accounts.length === 0) return null;

                return (
                  <React.Fragment key={category}>
                    <tr className={styles.sectionHeader}>
                      <td colSpan="5" style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                        {category}
                      </td>
                    </tr>
                    {accounts.map((account) => (
                      <tr key={account.accountCode}>
                        <td className={styles.amount}>{formatAmount(account.balanceDebit)}</td>
                        <td className={styles.amount}>{formatAmount(account.totalDebit)}</td>
                        <td style={{ textAlign: 'center' }}>{account.accountName}</td>
                        <td className={styles.amount}>{formatAmount(account.totalCredit)}</td>
                        <td className={styles.amount}>{formatAmount(account.balanceCredit)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              });
            })()}
            <tr className={styles.totalRow}>
              <td className={styles.amount}>{formatAmount(trialBalanceData.sumBalanceDebit)}</td>
              <td className={styles.amount}>{formatAmount(trialBalanceData.sumTotalDebit)}</td>
              <td style={{ fontWeight: 'bold', textAlign: 'center' }}>합계</td>
              <td className={styles.amount}>{formatAmount(trialBalanceData.sumTotalCredit)}</td>
              <td className={styles.amount}>{formatAmount(trialBalanceData.sumBalanceCredit)}</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.balanceCheck}>
          <h3>대차평형 확인</h3>
          <p>
            당기합계 차변: {trialBalanceData.sumTotalDebit?.toLocaleString() || '0'} 원
            / 당기합계 대변: {trialBalanceData.sumTotalCredit?.toLocaleString() || '0'} 원
          </p>
          <p>
            잔액 차변: {trialBalanceData.sumBalanceDebit?.toLocaleString() || '0'} 원
            / 잔액 대변: {trialBalanceData.sumBalanceCredit?.toLocaleString() || '0'} 원
          </p>
          {trialBalanceData.sumTotalDebit === trialBalanceData.sumTotalCredit &&
           trialBalanceData.sumBalanceDebit === trialBalanceData.sumBalanceCredit ? (
            <p className={styles.balanced}>✓ 대차평형 확인됨</p>
          ) : (
            <p className={styles.unbalanced}>✗ 대차평형 오류</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrialBalance;
