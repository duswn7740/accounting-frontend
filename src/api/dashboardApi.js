const API_URL = 'http://localhost:8000/api/dashboard';

// KPI 요약 데이터 조회
export const getDashboardSummary = async (fiscalPeriodInfo, month, companyId) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    fiscalPeriodInfo: JSON.stringify(fiscalPeriodInfo)
  });
  if (month) {
    params.append('month', month);
  }
  if (companyId) {
    params.append('companyId', companyId);
  }
  const response = await fetch(`${API_URL}/summary?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// 월별 매출/비용 추이 조회
export const getMonthlyTrend = async (startMonth, endMonth, fiscalYear, companyId) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    startMonth,
    endMonth,
    fiscalYear
  });
  if (companyId) {
    params.append('companyId', companyId);
  }
  const response = await fetch(`${API_URL}/monthly-trend?${params}`, {
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
