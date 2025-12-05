import axios from 'axios';

const BASE_URL = '/api/companies';

// 회사 등록 (사업주)
export const registerCompany = async (companyData) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(`${BASE_URL}/register`, companyData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

//사업자번호 중복 체크
export const checkBusinessNumber = async (businessNumber) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(`${BASE_URL}/check-business-number`, 
    { businessNumber },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};

// 회사 검색 (일반 회원)
export const searchCompanies = async (keyword) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/search`, {
    params: { keyword },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 회사 가입 신청 (일반 회원)
export const applyToCompany = async (companyId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(`${BASE_URL}/apply`, 
    { companyId },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};

// 내 회사 목록 조회
export const getMyCompanies = async () => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/my-companies`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 회사의 가입 신청 목록 조회
export const getPendingRequests = async (companyId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/${companyId}/pending-requests`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 가입 신청 승인/거절
export const handleRequest = async (companyUserId, action) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(`${BASE_URL}/handle-request`, 
    { companyUserId, action },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};

// 승인된 직원 목록 조회
export const getApprovedEmployees = async (companyId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/${companyId}/approved-employees`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// 거절/퇴사 목록 조회
export const getRejectedEmployees = async (companyId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${BASE_URL}/${companyId}/rejected-employees`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};