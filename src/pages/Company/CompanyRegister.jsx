import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCompany, checkBusinessNumber } from '../../api/companyApi';
import { formatBusinessNumber, formatCompanyTel, formatFiscalYearEnd, validateCompanyRegister } from '../../utils/companyValidate';
import Button from '../../components/Button';
import Input from '../../components/Input';
import styles from './CompanyRegister.module.css';

function CompanyRegister() {
  const nav = useNavigate();
  
  const [formData, setFormData] = useState({
    businessNumber: '',
    companyName: '',
    ceoName: '',
    address: '',
    addressDetail: '',
    tel: '',
    industry: '',
    fiscalYearEnd: '12-31',
    openingDate: ''
  });
  
  const [errorMsg, setErrorMsg] = useState({
    businessNumber: '',
    companyName: '',
    tel: '',
    fiscalYearEnd: ''
  });
  
  const [isDuplicated, setIsDuplicated] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'businessNumber') {
      newValue = formatBusinessNumber(value);
      setIsDuplicated(true);
    }
    
    if (name === 'tel') {
      newValue = formatCompanyTel(value);
    }

    if (name === 'fiscalYearEnd') {
      newValue = formatFiscalYearEnd(value);
    }
    
    setFormData({
      ...formData,
      [name]: newValue
    });
  };
  
  const handleOnChange = (e) => {
    const { name } = e.target;
    const error = validateCompanyRegister(e, formData);
    setErrorMsg({
      ...errorMsg,
      [name]: error
    });
  };
  
  const handleCheckBusinessNumber = async () => {
    const cleanBN = formData.businessNumber.replace(/\D/g, '');
    
    if (cleanBN.length !== 10) {
      alert('사업자번호는 10자리여야 합니다');
      return;
    }
    
    try {
      const data = await checkBusinessNumber(formData.businessNumber);
      if (data.available) {
        alert('사용 가능한 사업자번호입니다');
        setIsDuplicated(false);
      } else {
        alert('이미 등록된 사업자번호입니다');
      }
    } catch (error) {
      alert(error.response?.data?.error || '중복 체크 실패');
    }
  };
  
  const handleSearchAddress = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        const fullAddress = data.address;
        const extraAddress = data.bname ? ` (${data.bname})` : '';
        
        setFormData({
          ...formData,
          address: fullAddress + extraAddress
        });
      }
    }).open();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isDuplicated) {
      alert('사업자번호 중복 체크를 해주세요');
      return;
    }
    
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        businessNumber: formData.businessNumber.replace(/\D/g, ''),
        tel: formData.tel.replace(/\D/g, ''),
        address: formData.address + (formData.addressDetail ? ' ' + formData.addressDetail : '')
      };
      
      const response = await registerCompany(submitData);
      
      const goToHome = window.confirm('회사 등록 성공!\n메인으로 가시겠습니까?');
      
      const user = JSON.parse(localStorage.getItem('user'));
      user.hasCompany = true;
      user.companyId = response.company.companyId;
      localStorage.setItem('user', JSON.stringify(user));
      
      nav(goToHome ? '/' : '/mypage/company/register');
      
    } catch (error) {
      alert(error.response?.data?.error || '회사 등록 실패');
    } finally {
      setLoading(false);
    }
  };
  
  const isFormValid = () => {
    return (
      formData.businessNumber.replace(/\D/g, '').length === 10 &&
      formData.companyName.trim() !== '' &&
      !isDuplicated &&
      !errorMsg.businessNumber &&
      !errorMsg.companyName
    );
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>회사 등록</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            사업자번호<span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <Input
              type="text"
              name="businessNumber"
              placeholder="000-00-00000"
              value={formData.businessNumber}
              onChange={(e) => {
                handleChange(e);
                handleOnChange(e);
              }}
            />
            <Button
              type="button"
              onClick={handleCheckBusinessNumber}
              variant="check"
            >
              중복 확인
            </Button>
          </div>
          <p className={styles.errorMessage}>{errorMsg.businessNumber}</p>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            상호<span className={styles.required}>*</span>
          </label>
          <Input
            type="text"
            name="companyName"
            placeholder="홍길동 상사"
            value={formData.companyName}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.companyName}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>대표자명</label>
          <Input
            type="text"
            name="ceoName"
            placeholder="홍길동"
            value={formData.ceoName}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>주소</label>
          <div className={styles.inputWrapper}>
            <Input
              type="text"
              name="address"
              placeholder="주소"
              value={formData.address}
              readOnly
            />
            <Button
              type="button"
              onClick={handleSearchAddress}
              variant="address"
            >
              주소 검색
            </Button>
          </div>
          <Input
            type="text"
            name="addressDetail"
            placeholder="상세주소"
            value={formData.addressDetail}
            onChange={handleChange}
            style={{ marginTop: '8px' }}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>전화번호</label>
          <Input
            type="text"
            name="tel"
            placeholder="02-0000-0000 또는 000-0000-0000"
            value={formData.tel}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.tel}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>업종</label>
          <Input
            type="text"
            name="industry"
            placeholder="제조업"
            value={formData.industry}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            개업일<span className={styles.required}>*</span>
          </label>
          <Input
            type="date"
            name="openingDate"
            value={formData.openingDate}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>회계연도 마감일 (MM-DD)</label>
          <Input
            type="text"
            name="fiscalYearEnd"
            placeholder="12-31"
            value={formData.fiscalYearEnd}
            onChange={(e) => {
              handleChange(e);
              handleOnChange(e);
            }}
          />
          <p className={styles.errorMessage}>{errorMsg.fiscalYearEnd}</p>
          <p className={styles.helperText}>
            기본값: 12-31 (12월 31일). 학교 등 특수한 경우 회계연도 마감일을 변경할 수 있습니다.
          </p>
        </div>

        <div className={styles.buttonGroup}>
          <Button
            type="submit"
            disabled={!isFormValid() || loading}
            variant="primary"
            size="large"
          >
            {loading ? '등록 중...' : '회사 등록'}
          </Button>

          <Button
            type="button"
            onClick={() => nav('/')}
            variant="secondary"
            size="large"
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CompanyRegister;