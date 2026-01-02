import axios from 'axios';

const API_URL = 'http://localhost:8000/api/ledger';

// 계정별 원장 조회
export const getAccountLedger = async (companyId, filters) => {
  const token = localStorage.getItem('token');
  const params = {
    startMonth: filters.startMonth || undefined,
    startDay: filters.startDay || undefined,
    endMonth: filters.endMonth || undefined,
    endDay: filters.endDay || undefined,
    startAccountCode: filters.startAccountCode || undefined,
    endAccountCode: filters.endAccountCode || undefined,
    fiscalYear: filters.fiscalYear || undefined
  };

  const response = await axios.get(`${API_URL}/account/${companyId}`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 계정 요약 조회 (사이드바용)
export const getAccountSummary = async (companyId, filters) => {
  const token = localStorage.getItem('token');
  const params = {
    startMonth: filters.startMonth || undefined,
    startDay: filters.startDay || undefined,
    endMonth: filters.endMonth || undefined,
    endDay: filters.endDay || undefined,
    startAccountCode: filters.startAccountCode || undefined,
    endAccountCode: filters.endAccountCode || undefined,
    fiscalYear: filters.fiscalYear || undefined
  };

  const response = await axios.get(`${API_URL}/account/${companyId}/summary`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 전표 라인 수정
export const updateVoucherLine = async (voucherType, voucherId, lineNo, lineData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `${API_URL}/voucher-line/${voucherType}/${voucherId}/${lineNo}`,
    lineData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// 전표 라인 추가
export const addVoucherLine = async (voucherType, voucherId, lineData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/voucher-line/${voucherType}/${voucherId}`,
    lineData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// 전표 라인 삭제
export const deleteVoucherLine = async (voucherType, voucherId, lineNo) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(
    `${API_URL}/voucher-line/${voucherType}/${voucherId}/${lineNo}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};
