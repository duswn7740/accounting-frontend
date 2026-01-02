import { useState, useEffect } from 'react';
import styles from './PeriodClosing.module.css';

function PeriodClosing() {
  const [fiscalPeriods, setFiscalPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiscalPeriods();
  }, []);

  const fetchFiscalPeriods = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:8000/api/companies/${user.companyId}/fiscal-periods`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.periods) {
        setFiscalPeriods(data.periods);
      }
    } catch (error) {
      console.error('회계기수 조회 실패:', error);
      alert('회계기수 조회에 실패했습니다');
    }
  };

  const handleCarryForward = async () => {
    if (!selectedPeriod) {
      alert('회계기수를 선택해주세요');
      return;
    }

    if (selectedPeriod.isClosed) {
      alert('이미 마감된 회계기수입니다');
      return;
    }

    const confirmMessage = `${selectedPeriod.fiscalYear}기의 잔액을 ${selectedPeriod.fiscalYear + 1}기로 이월하시겠습니까?\n\n이월 후에는 ${selectedPeriod.fiscalYear + 1}기에 이월잔액이 생성됩니다.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:8000/api/fiscal-periods/${selectedPeriod.fiscalYear}/carry-forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          companyId: user.companyId
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${selectedPeriod.fiscalYear}기 → ${selectedPeriod.fiscalYear + 1}기 이월 완료\n\n계정별 이월: ${data.accountCount || 0}건\n거래처별 이월: ${data.clientCount || 0}건`);
        await fetchFiscalPeriods();
      } else {
        alert(`이월 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('이월 실패:', error);
      alert('이월 처리 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) {
      alert('회계기수를 선택해주세요');
      return;
    }

    if (selectedPeriod.isClosed) {
      // 마감 취소 처리
      const confirmMessage = `${selectedPeriod.fiscalYear}기 마감을 취소하시겠습니까?\n\n마감 취소 후에는 해당 회계기수의 전표를 수정/삭제할 수 있습니다.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`http://localhost:8000/api/fiscal-periods/${selectedPeriod.fiscalYear}/reopen`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            companyId: user.companyId
          })
        });

        const data = await response.json();

        if (data.success) {
          alert(`✅ ${selectedPeriod.fiscalYear}기 마감 취소 완료`);
          await fetchFiscalPeriods();
          // 마감 취소 후 업데이트된 기수 정보로 다시 선택
          const updatedPeriods = await fetch(`http://localhost:8000/api/companies/${user.companyId}/fiscal-periods`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const updatedData = await updatedPeriods.json();
          if (updatedData.periods) {
            const updatedPeriod = updatedData.periods.find(p => p.fiscalYear === selectedPeriod.fiscalYear);
            if (updatedPeriod) {
              setSelectedPeriod(updatedPeriod);
            }
          }
        } else {
          alert(`마감 취소 실패: ${data.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.error('마감 취소 실패:', error);
        alert('마감 취소 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    } else {
      // 마감 처리
      const confirmMessage = `${selectedPeriod.fiscalYear}기를 마감하시겠습니까?\n\n⚠️ 마감 후에는 해당 회계기수의 전표를 수정/삭제할 수 없습니다.\n마감을 진행하기 전에 이월 처리를 먼저 하시는 것을 권장합니다.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`http://localhost:8000/api/fiscal-periods/${selectedPeriod.fiscalYear}/close`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            companyId: user.companyId
          })
        });

        const data = await response.json();

        if (data.success) {
          alert(`✅ ${selectedPeriod.fiscalYear}기 마감 완료`);
          await fetchFiscalPeriods();
          // 마감 후 업데이트된 기수 정보로 다시 선택
          const updatedPeriods = await fetch(`http://localhost:8000/api/companies/${user.companyId}/fiscal-periods`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const updatedData = await updatedPeriods.json();
          if (updatedData.periods) {
            const updatedPeriod = updatedData.periods.find(p => p.fiscalYear === selectedPeriod.fiscalYear);
            if (updatedPeriod) {
              setSelectedPeriod(updatedPeriod);
            }
          }
        } else {
          alert(`마감 실패: ${data.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.error('마감 실패:', error);
        alert('마감 처리 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}.${month}.${day}`;
  };

  return (
    <div className={styles.container}>
      <h1>마감 후 이월</h1>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>회계기수 선택</h2>
          <div className={styles.periodList}>
            {fiscalPeriods.map(period => (
              <div
                key={period.fiscalYear}
                className={`${styles.periodItem} ${selectedPeriod?.fiscalYear === period.fiscalYear ? styles.selected : ''} ${period.isClosed ? styles.closed : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                <div className={styles.periodHeader}>
                  <span className={styles.fiscalYear}>{period.fiscalYear}기</span>
                  {!!period.isClosed && <span className={styles.closedBadge}>마감됨</span>}
                </div>
                <div className={styles.periodDates}>
                  {formatDate(period.startDate)} ~ {formatDate(period.endDate)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPeriod && (
          <div className={styles.section}>
            <h2>선택된 회계기수: {selectedPeriod.fiscalYear}기</h2>

            <div className={styles.infoBox}>
              <p><strong>기간:</strong> {formatDate(selectedPeriod.startDate)} ~ {formatDate(selectedPeriod.endDate)}</p>
              <p><strong>상태:</strong> {selectedPeriod.isClosed ? '마감됨' : '진행중'}</p>
            </div>

            <div className={styles.actions}>
              <div className={styles.actionCard}>
                <h3>마감 후 이월</h3>
                <p>
                  현재 회계기수({selectedPeriod.fiscalYear}기)의 계정별/거래처별 잔액을<br/>
                  다음 회계기수({selectedPeriod.fiscalYear + 1}기)의 이월잔액으로 생성합니다.
                </p>
                <ul className={styles.notes}>
                  <li>자산, 부채, 자본 계정: 차변/대변 잔액 그대로 이월</li>
                  <li>수익, 비용 계정: 당기순이익으로 정산하여 이익잉여금으로 이월</li>
                  <li>거래처별 미수금/미지급금: 거래처별로 이월</li>
                </ul>
                <button
                  className={styles.carryForwardButton}
                  onClick={handleCarryForward}
                  disabled={loading || selectedPeriod.isClosed}
                >
                  {loading ? '처리 중...' : '이월 실행'}
                </button>
              </div>

              <div className={styles.actionCard}>
                <h3>{selectedPeriod.isClosed ? '회계기수 마감 취소' : '회계기수 마감'}</h3>
                <p>
                  {selectedPeriod.isClosed ? (
                    <>
                      현재 회계기수({selectedPeriod.fiscalYear}기)의 마감을 취소합니다.<br/>
                      마감 취소 후에는 해당 기수의 전표를 수정/삭제할 수 있습니다.
                    </>
                  ) : (
                    <>
                      현재 회계기수({selectedPeriod.fiscalYear}기)를 마감 처리합니다.<br/>
                      마감 후에는 해당 기수의 전표를 수정/삭제할 수 없습니다.
                    </>
                  )}
                </p>
                <ul className={styles.notes}>
                  {selectedPeriod.isClosed ? (
                    <>
                      <li>마감 취소 후 다시 전표를 입력/수정할 수 있습니다</li>
                      <li>이월된 데이터는 유지됩니다</li>
                    </>
                  ) : (
                    <>
                      <li>⚠️ 마감 전에 이월 처리를 먼저 하시는 것을 권장합니다</li>
                      <li>마감 후에는 조회만 가능합니다</li>
                    </>
                  )}
                </ul>
                <button
                  className={styles.closeButton}
                  onClick={handleClosePeriod}
                  disabled={loading}
                >
                  {loading ? '처리 중...' : (selectedPeriod.isClosed ? '마감 취소' : '마감 실행')}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedPeriod && fiscalPeriods.length > 0 && (
          <div className={styles.emptyState}>
            <p>회계기수를 선택해주세요</p>
          </div>
        )}

        {fiscalPeriods.length === 0 && (
          <div className={styles.emptyState}>
            <p>회계기수가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PeriodClosing;
