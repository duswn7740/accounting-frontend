import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/authApi';

function Login() {
  const nav = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 입력 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 로그인
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await login(formData.email, formData.password);
      
      // 토큰 저장
      localStorage.setItem('token', response.token);
      
      // 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(response.user));

      // 회사명 초기화 (로그인 시 새로 선택하도록)
      localStorage.removeItem('currentCompanyName');
      
      alert(`${response.user.name}님 환영합니다!`);

      // 회사 연결 여부 확인 후 회사 등록 물어보기
      if (!response.user.hasCompany) {
      if (response.user.userType === 'BUSINESS') {
        const registerCompany = window.confirm(
          '회사를 등록하시겠습니까?\n(나중에 등록할 수 있습니다)'
        );
        if (registerCompany) {
          nav('/company/register');
          return;
        }
      } else {  // GENERAL
        const searchCompany = window.confirm(
          '회사를 검색하시겠습니까?\n(나중에 검색할 수 있습니다)'
        );
        if (searchCompany) {
          nav('/mypage/company/search');
          return;
        }
      }

      // 회사가 있으면 회사명도 저장 (백엔드에서 회사명 받아오기)
      if (response.user.hasCompany && response.companyName) {
        localStorage.setItem('currentCompanyName', response.companyName);
}
    }
      
      nav('/');
      
    } catch (err) {
      setError(err.response?.data?.error || '로그인 실패');
      alert(err.response?.data?.error || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="이메일"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={formData.password}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      
      <p>
        계정이 없으신가요? 
        <button type="button" onClick={() => nav('/register')}>
          회원가입
        </button>
      </p>
    </div>
  );
}

export default Login;