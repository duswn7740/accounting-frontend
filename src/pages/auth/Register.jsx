import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmail, register } from '../../api/authApi';
import { validateRegister, formatPhone } from '../../utils/registerValidate';

function Register() {
  const nav = useNavigate();

  
  // 회원가입 폼 작성 시 State
  const [formData, setFormData] = useState({
    userType:'GENERAL',
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 입력 변경
  const handleChange = (e) => {
    const {name, value} = e.target;

    let newValue = name === 'email' ? value.toLowerCase() : value;

    // 이메일이 변경되면 중복 체크 초기화
    if (name === 'email') {
      newValue = value.toLowerCase();
      setIsDuplicated(true);
    }
    // 전화번호 포멧팅
    if (name === 'phone') {
      newValue = formatPhone(value);
    }

    setFormData({
      ...formData,
      [name] : newValue
    });
  };

  // 유효성 검사 결과 에러메세지를 저장할 변수
  const [errorMsg, setErrorMsg] = useState({
    'email' : '',
    'password' : '',
    'passwordConfirm' : '',
    'name' : '',
    'phone' : ''
  });

  // 유효성 검사
  const handleOnChange = e => {
    const {name, value} = e.target;
    const error = validateRegister(e, formData);
    setErrorMsg ({
      ...errorMsg,
      [name] : error
    })
  }

  // 이메일 중복 확인 여부 저장할 state 변수
  const [isDuplicated, setIsDuplicated] = useState(true);

  // email 중복 검사 시 실행할 함수
  const handleCheckEmail = async() => {
    try {
      const data = await checkEmail(formData.email);
      if (data.available) {
        alert('사용가능한 이메일입니다.');
        setIsDuplicated(false);
      } else {
        alert('이 이메일은 사용 할 수 없습니다.');
      }
    } catch (error) {
      alert(error.response?.data?.error || '중복 체크 실패')
    }
  }
  
  // 회원가입
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 중복확인
    if (isDuplicated) {
      alert('이메일 중복 체크를 해주세요');
      return;
    }
    
    // API 호출
    try {
      setLoading(true);
      setError('');

      const response = await register (formData);
      const goToLogin = window.confirm(`${formData.name}님 환영합니다.\n 로그인하러 가시겠습니까?`);
      nav(goToLogin ? '/login' : '/')
    } catch (error) {
      setError(error.response?.data?.error || '회원가입 실패');
      alert(error.response?.data?.error || '회원가입 실패')
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div>
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        {/* 폼 내용 */}

        <div>
          <input
            type="radio"
            name="userType"
            value='GENERAL'
            checked={formData.userType==='GENERAL'}
            onChange={handleChange}
            />
          일반회원
          <input
            type="radio"
            name="userType"
            value='BUSINESS'
            checked={formData.userType==='BUSINESS'}
            onChange={handleChange}
          />
          사업주
        </div>


        <div>
          <input
            type="email"
            placeholder='이메일'
            name='email'
            value={formData.email}
            onChange={(e) => {
              handleChange(e)
              handleOnChange(e)
            }}
          />
          <p>{errorMsg.email}</p>
          <button 
            type="button"
            onClick={()=>handleCheckEmail()}
          >
            중복확인
          </button>
        </div>
        <div>
          <input
            type="password"
            name='password'
            placeholder='비밀번호'
            value={formData.password}
            onChange={(e) => {
              handleChange(e)
              handleOnChange(e)
            }}
          />
          <p>{errorMsg.password}</p>
        </div>
        <div>
          <input
            type="password"
            name="passwordConfirm"
            placeholder='비밀번호확인'
            value={formData.passwordConfirm}
            onChange={(e) => {
              handleChange(e)
              handleOnChange(e)
            }}
          />
          <p>{errorMsg.passwordConfirm}</p>
        </div>
        <div>
          <input
            type="text"
            name='name'
            placeholder='이름'
            value={formData.name}
            onChange={(e) => {
              handleChange(e)
              handleOnChange(e)
            }}
          />
          <p>{errorMsg.name}</p>
        </div>
        <div>
          <input
            type="text"
            name='phone'
            placeholder='연락처'
            value={formData.phone}
            onChange={(e) => {
              handleChange(e)
              handleOnChange(e)
            }}
          />
          <p>{errorMsg.phone}</p>
        </div>

        <div>
          <button type="submit"
            disabled={isDuplicated}
          >
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;