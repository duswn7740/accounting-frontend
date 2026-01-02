import { useState, useEffect } from 'react';
import styles from './Settlement.module.css';

function RetainedEarnings() {
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(null);
  const [retainedEarningsData, setRetainedEarningsData] = useState(null);
  const [currentDisposalDate, setCurrentDisposalDate] = useState('');
  const [previousDisposalDate, setPreviousDisposalDate] = useState('');

  // 날짜 자동 포맷팅 (YYYY-MM-DD)
  const formatDate = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');

    // 빈 값이면 빈 문자열 반환
    if (numbers.length === 0) return '';

    // YYYY-MM-DD 형식으로 자동 변환
    let formatted = numbers;
    if (numbers.length > 4) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4);
    }
    if (numbers.length > 6) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6) + '-' + numbers.slice(6, 8);
    }

    return formatted;
  };

  useEffect(() => {
    const periodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || 'null');
    if (periodInfo) {
      setFiscalYear(periodInfo.fiscalYear);
      fetchRetainedEarningsData(periodInfo.fiscalYear);
    }
  }, []);

  const fetchRetainedEarningsData = async (year) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `/api/settlement/retained-earnings/${user.companyId}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setRetainedEarningsData(data);
        // 저장된 처분일이 있으면 state에 설정
        if (data.currentDisposalDate) {
          setCurrentDisposalDate(data.currentDisposalDate);
        }
        if (data.previousDisposalDate) {
          setPreviousDisposalDate(data.previousDisposalDate);
        }
      }
    } catch (error) {
      console.error('이익잉여금 데이터 조회 실패:', error);
    }
  };

  const handleExecuteSettlement = async () => {
    if (!fiscalYear) {
      alert('회계기수를 선택해주세요');
      return;
    }

    if (!currentDisposalDate) {
      alert('당기 처분예정일을 입력해주세요');
      return;
    }

    // 2기 이상인 경우 전기 처분확정일도 필수
    if (fiscalYear > 1 && !previousDisposalDate) {
      alert('2기 이상은 전기 처분확정일을 입력해주세요');
      return;
    }

    const confirmMessage = `처분일을 저장하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `/api/settlement/retained-earnings/${user.companyId}/${fiscalYear}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentDisposalDate,
            previousDisposalDate
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert(data.message || '처분일이 저장되었습니다');
        fetchRetainedEarningsData(fiscalYear);
      } else {
        alert(data.message || '처분일 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('처분일 저장 실패:', error);
      alert('처분일 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) => {
    if (!value && value !== 0) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('ko-KR');
  };

  if (!retainedEarningsData) {
    return (
      <div className={styles.container}>
        <h1>이익잉여금처분계산서</h1>
        <div className={styles.content}>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 계산
  const previousUndisposed = retainedEarningsData.previousRetainedEarnings || 0;
  const netIncome = retainedEarningsData.netIncome || 0;
  const netLoss = netIncome < 0 ? Math.abs(netIncome) : 0;
  const actualNetIncome = netIncome > 0 ? netIncome : 0;

  // I. 미처분이익잉여금
  const undisposedRetainedEarnings = previousUndisposed + actualNetIncome - netLoss;

  // II. 임의적립금 등의 이입액 (현재는 0)
  const reserveTransfer = 0;

  // 합계
  const totalBeforeDisposal = undisposedRetainedEarnings + reserveTransfer;

  // III. 이익잉여금처분액
  const legalReserve = actualNetIncome > 0 ? Math.floor(actualNetIncome * 0.1) : 0; // 10% 이익준비금
  const totalDisposal = legalReserve;

  // IV. 차기이월미처분이익잉여금
  const nextPeriodCarryForward = totalBeforeDisposal - totalDisposal;

  return (
    <div className={styles.container}>
      <h1>이익잉여금처분계산서</h1>

      <div className={styles.infoBox}>
        <p>선택된 회계기수: {fiscalYear ? `${fiscalYear}기` : '선택되지 않음'}</p>
      </div>

      <div className={styles.dateInputsHorizontal}>
        <div className={styles.inputGroup}>
          <label>당기 처분예정일:</label>
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            maxLength="10"
            value={currentDisposalDate}
            onChange={(e) => setCurrentDisposalDate(formatDate(e.target.value))}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>전기 처분확정일:</label>
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            maxLength="10"
            value={previousDisposalDate}
            onChange={(e) => setPreviousDisposalDate(formatDate(e.target.value))}
          />
        </div>
        <button
          className={styles.saveButton}
          onClick={handleExecuteSettlement}
          disabled={loading || !fiscalYear || !currentDisposalDate || (fiscalYear > 1 && !previousDisposalDate)}
        >
          {loading ? '저장 중...' : '처분일 저장'}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.itemColumn}>과목</th>
              <th className={styles.amountColumn}>금액</th>
            </tr>
          </thead>
          <tbody>
            {/* I. 미처분이익잉여금 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">I. 미처분이익잉여금</td>
            </tr>
            <tr>
              <td className={styles.indent1}>1. 전기이월미처분이익잉여금</td>
              <td className={styles.amount}>{formatAmount(previousUndisposed)}</td>
            </tr>
            <tr>
              <td className={styles.indent1}>2. 회계변경의 누적효과</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>3. 전기오류수정이익</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>4. 전기오류수정손실</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>5. 중간배당액</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>6. 당기순이익</td>
              <td className={styles.amount}>{formatAmount(actualNetIncome)}</td>
            </tr>
            <tr>
              <td className={styles.indent1}>7. 당기순손실</td>
              <td className={styles.amount}>{formatAmount(netLoss)}</td>
            </tr>
            <tr className={styles.calculationRow}>
              <td>= 미처분이익잉여금</td>
              <td className={styles.amount}>{formatAmount(undisposedRetainedEarnings)}</td>
            </tr>

            {/* II. 임의적립금 등의 이입액 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">II. 임의적립금 등의 이입액</td>
            </tr>
            <tr>
              <td className={styles.indent1}>1. 사업확장적립금 이입액</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>2. 기타 적립금 이입액</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr className={styles.calculationRow}>
              <td>= 임의적립금 등의 이입액 계</td>
              <td className={styles.amount}>{formatAmount(reserveTransfer)}</td>
            </tr>

            {/* 합계 */}
            <tr className={styles.subtotalRow}>
              <td>합 계</td>
              <td className={styles.amount}>{formatAmount(totalBeforeDisposal)}</td>
            </tr>

            {/* III. 이익잉여금처분액 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">III. 이익잉여금처분액</td>
            </tr>
            <tr>
              <td className={styles.indent1}>1. 이익준비금</td>
              <td className={styles.amount}>{formatAmount(legalReserve)}</td>
            </tr>
            <tr>
              <td className={styles.indent1}>2. 기업합리화적립금</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>3. 배당금</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent2}>가. 현금배당</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent2}>나. 주식배당</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>4. 사업확장적립금</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>5. 감채적립금</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr>
              <td className={styles.indent1}>6. 배당평균적립금</td>
              <td className={styles.amount}>0</td>
            </tr>
            <tr className={styles.calculationRow}>
              <td>= 이익잉여금처분액 계</td>
              <td className={styles.amount}>{formatAmount(totalDisposal)}</td>
            </tr>

            {/* IV. 차기이월미처분이익잉여금 */}
            <tr className={styles.totalRow}>
              <td>IV. 차기이월미처분이익잉여금</td>
              <td className={styles.amount}>{formatAmount(nextPeriodCarryForward)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RetainedEarnings;
