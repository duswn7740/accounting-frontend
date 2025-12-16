import axios from 'axios';

const API_URL = 'http://localhost:8000/api/sales-purchase';

// 매입매출 전표 등록
export const createVoucher = async (voucherData, lines) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    API_URL,
    { voucherData, lines },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// 회사별 전표 조회
export const getVouchersByCompany = async (companyId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}?companyId=${companyId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// 기간별 전표 조회
export const getVouchersByDateRange = async (companyId, startDate, endDate) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/by-date-range?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// 전표 상세 조회
export const getVoucherById = async (voucherId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/${voucherId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// 전표 수정
export const updateVoucher = async (voucherId, voucherData, lines) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `${API_URL}/${voucherId}`,
    { voucherData, lines },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// 전표 삭제
export const deleteVoucher = async (voucherId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(
    `${API_URL}/${voucherId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
