import axios from 'axios';

const BASE_URL = '/api/auth';

// 회원가입
export const register = async (userData) => {
  const response = await axios.post(`${BASE_URL}/register`, userData);
  return response.data;
};

// 로그인
export const login = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/login`, { email, password });
  return response.data;
};

// 중복 아이디 체크
export const checkEmail = async (email) => {
  const response = await axios.post(`${BASE_URL}/check-email`, {email});
  return response.data;
}
