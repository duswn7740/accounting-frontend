import axios from 'axios';

const BASE_URL = '/api/clients';

// 거래처 등록
export const createClient = async (clientData) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(BASE_URL, clientData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 거래처 목록 조회
export const getClientsByCategory = async (companyId, category) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(BASE_URL, {
    params: { companyId, category },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 거래처 상세 조회
export const getClientById = async (clientId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 거래처 수정
export const updateClient = async (clientId, clientData) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.put(`${BASE_URL}/${clientId}`, clientData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 거래처 삭제
export const deleteClient = async (clientId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.delete(`${BASE_URL}/${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 거래처 코드 중복 확인
export const checkClientCode = async (companyId, clientCode, category) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(`${BASE_URL}/check-code`, 
    { companyId, clientCode, category },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};

// 다음 거래처 코드 조회
export const getNextClientCode = async (companyId, category) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/next-code`, {
    params: { companyId, category },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};