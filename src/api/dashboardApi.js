const API_URL = 'http://localhost:8000/api/dashboard';

// KPI 요약 데이터 조회
export const getDashboardSummary = async (fiscalPeriodInfo, month) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    fiscalPeriodInfo: JSON.stringify(fiscalPeriodInfo)
  });
  if (month) {
    params.append('month', month);
  }
  const response = await fetch(`${API_URL}/summary?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// 월별 매출/비용 추이 조회
export const getMonthlyTrend = async (startMonth, endMonth, fiscalYear) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/monthly-trend?startMonth=${startMonth}&endMonth=${endMonth}&fiscalYear=${fiscalYear}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// 알림 조회
export const getNotifications = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
