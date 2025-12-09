import axios from 'axios';

const API_URL = 'http://localhost:8000/api/accounts';

// 회사별 계정과목 조회
export const getAccountsByCompany = async (companyId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    params: { companyId },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 계정과목 추가
export const createAccount = async (accountData) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('user');
  const response = await axios.post(API_URL, accountData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 계정과목 수정
export const updateAccount = async (accountId, accountData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/${accountId}`, accountData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 계정과목 삭제
export const deleteAccount = async (accountId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/${accountId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 계정코드 중복 확인
export const checkAccountCode = async (companyId, accountCode) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/check-code`, {
    params: { companyId, accountCode },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};