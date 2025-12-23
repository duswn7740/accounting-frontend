import axios from 'axios';

const API_URL = 'http://localhost:8000/api/vouchers';

// 전표 라인 조회
export const getVoucherLinesByDate = async (companyId, startDate, endDate) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    params: { companyId, startDate, endDate },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 전표 라인 생성
export const createVoucherLine = async (lineData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, lineData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 전표 라인 수정
export const updateVoucherLine = async (lineId, lineData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/${lineId}`, lineData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 전표 라인 삭제
export const deleteVoucherLine = async (lineId, companyId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/${lineId}`, {
    params: { companyId },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 여러 라인을 한 번에 저장하는 전표 생성
export const createVoucherWithLines = async (voucherData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/batch`, voucherData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 전표 전체 수정 (여러 라인)
export const updateVoucherWithLines = async (voucherId, voucherData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/batch/${voucherId}`, voucherData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 전표 삭제
export const deleteVoucher = async (voucherId, companyId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/${voucherId}`, {
    params: { companyId },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};