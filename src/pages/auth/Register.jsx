import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmail, register } from '../../api/authApi';
import { validateRegister, formatPhone } from '../../utils/registerValidate';
import Button from '../../components/Button';
import Input from '../../components/Input';
import styles from './Register.module.css';

function Register() {
  const nav = useNavigate();
  
  const [formData, setFormData] = useState({
    userType: 'GENERAL',
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: ''
  });
  
  const [errorMsg, setErrorMsg] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: ''
  });
  
  const [isDuplicated, setIsDuplicated] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'email') {
      newValue = value.toLowerCase();
      setIsDuplicated(true);
    }
    
    if (name === 'phone') {
      newValue = formatPhone(value);
    }
    
    setFormData({
      ...formData,
      [name]: newValue
    });
  };
  
  const handleOnChange = (e) => {
    const { name } = e.target;
    const error = validateRegister(e, formData);
    setErrorMsg({
      ...errorMsg,
      [name]: error
    });
  };
  
  const handleCheckEmail = async () => {
    try {
      const data = await checkEmail(formData.email);
      if (data.available) {
        alert('사용 가능한 이메일입니다');
        setIsDuplicated(false);
      } else {
        alert('이 이메일은 사용할 수 없습니다');
      }
    } catch (error) {
      alert(error.response?.data?.error || '중복 체크 실패');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isDuplicated) {
      alert('이메일 중복 체크를 해주세요');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await register(formData);
      const goToLogin = window.confirm(`${formData.name}님 환영합니다.\n로그인하러 가시겠습니까?`);
      nav(goToLogin ? '/login' : '/');
      
    } catch (error) {
      alert(error.response?.data?.error || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>회원가입</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>회원 유형</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="userType"
                value="GENERAL"
                checked={formData.userType === 'GENERAL'}
                onChange={handleChange}
              />
              일반회원
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="userType"
                value="BUSINESS"
                checked={formData.userType === 'BUSINESS'}
                onChange={handleChange}
              />
              사업주
            </label>
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            이메일<span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <Input
              type="email"
              placeholder="이메일을 입력하세요"
              name="email"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                handleOnChange(e);
              }}
            />
            <Button
              type="button"
              variant="check"
              onClick={handleCheckEmail}
            >
              중복 확인
            </Button>
          </div>
          <p className={styles.errorMessage}>{errorMsg.email}</p>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            비밀번호<span className={styles.required}>*</span>
          </label>
          <Input
            type="password"
            name="password"
            placeholder="비밀번호를 입력하세요"
            value={formData.password}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.password}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            비밀번호 확인<span className={styles.required}>*</span>
          </label>
          <Input
            type="password"
            name="passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            value={formData.passwordConfirm}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.passwordConfirm}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            이름<span className={styles.required}>*</span>
          </label>
          <Input
            type="text"
            name="name"
            placeholder="이름을 입력하세요"
            value={formData.name}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.name}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>연락처</label>
          <Input
            type="text"
            name="phone"
            placeholder="010-0000-0000"
            value={formData.phone}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.phone}</p>
        </div>
        
        <div className={styles.buttonGroup}>
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isDuplicated || loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </div>
      </form>

      <div className={styles.loginPrompt}>
        이미 계정이 있으신가요?
        <button
          type="button"
          className={styles.loginLink}
          onClick={() => nav('/login')}
        >
          로그인하기
        </button>
      </div>
    </div>
  );
}

export default Register;