import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getDashboardSummary, getMonthlyTrend, getNotifications } from '../../api/dashboardApi';
import styles from './Dashboard.module.css';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // KPI 월 선택 (현재 월의 전월이 기본값)
  const currentMonth = new Date().getMonth() + 1;
  const defaultKpiMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const [selectedMonth, setSelectedMonth] = useState(defaultKpiMonth);

  const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
  const fiscalYear = fiscalPeriodInfo.fiscalYear;

  // 회계연도 표시용
  const fiscalYearDisplay = fiscalPeriodInfo.startDate
    ? `${fiscalYear}기 (${new Date(fiscalPeriodInfo.startDate).getFullYear()}년)`
    : `${fiscalYear}기`;

  useEffect(() => {
    if (!fiscalYear) {
      setError('회계기수를 선택해주세요');
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [fiscalYear, selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // KPI 요약 (선택한 월로 조회)
      const summaryRes = await getDashboardSummary(fiscalPeriodInfo, selectedMonth);
      if (summaryRes.success) {
        setSummary(summaryRes.summary);
      }

      // 월별 추이 (1~12월 전체)
      const trendRes = await getMonthlyTrend(1, 12, fiscalYear);
      if (trendRes.success) {
        setTrendData(trendRes.data);
        setProfitData(trendRes.data);
      }

      // 알림
      const notifRes = await getNotifications();
      if (notifRes.success) {
        setNotifications(notifRes.notifications);
      }

      setLoading(false);
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다');
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return Math.round(value).toLocaleString('ko-KR');
  };

  // 매출/비용 추이 차트 데이터
  const trendChartData = trendData ? {
    labels: trendData.map(d => `${d.month}월`),
    datasets: [
      {
        label: '매출',
        data: trendData.map(d => d.sales),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4
      },
      {
        label: '비용',
        data: trendData.map(d => d.expense),
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.4
      },
      {
        label: '순이익',
        data: trendData.map(d => d.profit),
        borderColor: '#27ae60',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        tension: 0.4
      }
    ]
  } : null;

  // 손익 현황 차트 데이터
  const profitChartData = profitData ? {
    labels: profitData.map(d => `${d.month}월`),
    datasets: [
      {
        label: '매출',
        data: profitData.map(d => d.sales),
        backgroundColor: '#3498db'
      },
      {
        label: '비용',
        data: profitData.map(d => d.expense),
        backgroundColor: '#e74c3c'
      },
      {
        label: '순이익',
        data: profitData.map(d => d.profit),
        backgroundColor: '#27ae60'
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}원`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>대시보드</h1>
        <div className={styles.headerSubtitle}>
          {fiscalPeriodInfo.startDate && fiscalPeriodInfo.endDate &&
            `${new Date(fiscalPeriodInfo.startDate).getFullYear()}년 회계기수 (${new Date(fiscalPeriodInfo.startDate).toLocaleDateString()} ~ ${new Date(fiscalPeriodInfo.endDate).toLocaleDateString()})`
          }
        </div>
      </div>

      {/* 알림 */}
      {notifications.length > 0 && (
        <div className={styles.notificationSection}>
          {notifications.map((notif, idx) => (
            <div key={idx} className={`${styles.notificationCard} ${styles[notif.priority]}`}>
              <div className={styles.notificationHeader}>
                <span className={styles.notificationTitle}>{notif.title}</span>
                {notif.daysLeft !== undefined && (
                  <span className={`${styles.notificationBadge} ${styles[notif.priority]}`}>
                    D-{notif.daysLeft}
                  </span>
                )}
              </div>
              <div className={styles.notificationMessage}>{notif.message}</div>
            </div>
          ))}
          <div/>
          <div/>
          <div/>
        </div>
      )}

      {/* KPI 카드 */}
      {summary && (
        <>
          <div className={styles.kpiHeader}>
            <h2>주요 지표</h2>
            <div className={styles.monthSelector}>
              <label>조회 월:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}월</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>{selectedMonth}월 매출</div>
              <div className={styles.kpiValue}>{formatCurrency(summary.sales)}원</div>
              <div className={`${styles.kpiGrowth} ${summary.salesGrowth > 0 ? styles.positive : summary.salesGrowth < 0 ? styles.negative : styles.neutral}`}>
                {summary.salesGrowth > 0 ? '↑' : summary.salesGrowth < 0 ? '↓' : '→'} {Math.abs(summary.salesGrowth)}%
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>{selectedMonth}월 비용</div>
              <div className={styles.kpiValue}>{formatCurrency(summary.expense)}원</div>
              <div className={`${styles.kpiGrowth} ${summary.expenseGrowth > 0 ? styles.positive : summary.expenseGrowth < 0 ? styles.negative : styles.neutral}`}>
                {summary.expenseGrowth > 0 ? '↑' : summary.expenseGrowth < 0 ? '↓' : '→'} {Math.abs(summary.expenseGrowth)}%
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>{selectedMonth}월 이익</div>
              <div className={styles.kpiValue}>{formatCurrency(summary.profit)}원</div>
              <div className={`${styles.kpiGrowth} ${summary.profitGrowth > 0 ? styles.positive : summary.profitGrowth < 0 ? styles.negative : styles.neutral}`}>
                {summary.profitGrowth > 0 ? '↑' : summary.profitGrowth < 0 ? '↓' : '→'} {Math.abs(summary.profitGrowth)}%
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>현금 잔액</div>
              <div className={styles.kpiValue}>{formatCurrency(summary.cash)}원</div>
            </div>
          </div>
        </>
      )}

      {/* 차트 섹션 */}
      <div className={styles.chartsRow}>
        {/* 매출/비용 추이 차트 */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>월별 매출/비용 추이</h2>
            <div className={styles.fiscalYearBadge}>{fiscalYearDisplay}</div>
          </div>
          <div className={styles.chartWrapper}>
            {trendChartData && <Line data={trendChartData} options={chartOptions} />}
          </div>
        </div>

        {/* 월별 손익 현황 차트 */}
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>월별 손익 현황</h2>
            <div className={styles.fiscalYearBadge}>{fiscalYearDisplay}</div>
          </div>
          <div className={styles.chartWrapper}>
            {profitChartData && <Bar data={profitChartData} options={chartOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
