import { useState, useEffect } from 'react';
import * as clientApi from '@/api/clientApi';
import { formatBusinessNumber, formatCompanyTel } from '@/utils/companyValidate';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import styles from './ClientModal.module.css';

function ClientModal({ client, companyId, onClose, onSuccess }) {
  const isEdit = !!client;

  const [formData, setFormData] = useState({
    category: '일반',
    clientCode: '',
    clientName: '',
    businessNumber: '',
    accountNumber: '',
    ceoName: '',
    address: '',
    tel: '',
    email: '',
    clientType: '양방'
  });
  
  const [isCodeChecked, setIsCodeChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 수정 모드일 때 데이터 채우기
  useEffect(() => {
    if (client) {
      setFormData({
        category: client.category || '일반',
        clientCode: client.client_code || '',
        clientName: client.client_name || '',
        businessNumber: client.business_number || '',
        accountNumber: client.account_number || '',
        ceoName: client.ceo_name || '',
        address: client.address || '',
        tel: client.tel || '',
        email: client.email || '',
        clientType: client.client_type || '양방'
      });
      setIsCodeChecked(true); // 수정 모드는 코드 체크 불필요
    }
  }, [client]);
  
  // 입력 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'category') {
      // 카테고리 변경 시 코드 체크 초기화 및 번호 필드 초기화
      setIsCodeChecked(false);
      setFormData({
        ...formData,
        [name]: newValue,
        clientCode: '', // 코드도 초기화
        businessNumber: '', // 사업자번호 초기화
        accountNumber: '' // 계좌/카드번호 초기화
      });
      return;
    }

    if (name === 'clientCode') {
      // 숫자만 입력, 5자리까지
      newValue = value.replace(/\D/g, '').slice(0, 5);
      setIsCodeChecked(false); // 코드 변경 시 체크 초기화
    }

    if (name === 'businessNumber') {
      newValue = formatBusinessNumber(value);
    }

    if (name === 'tel') {
      newValue = formatCompanyTel(value);
    }

    setFormData({
      ...formData,
      [name]: newValue
    });
  };
  
  // 거래처 코드 중복 확인
  const handleCheckCode = async () => {
    if (!formData.clientCode) {
      alert('거래처 코드를 입력해주세요');
      return;
    }
    
    if (formData.clientCode.length !== 5) {
      alert('거래처 코드는 5자리여야 합니다');
      return;
    }
    
    try {
      const result = await clientApi.checkClientCode(
        companyId,
        formData.clientCode,
        formData.category
      );
      
      if (result.available) {
        alert('사용 가능한 코드입니다');
        setIsCodeChecked(true);
      } else {
        alert(result.message);
        setIsCodeChecked(false);
      }
      
    } catch (err) {
      alert(err.response?.data?.error || '중복 확인 실패');
      setIsCodeChecked(false);
    }
  };
  
  // 자동 생성
  const handleAutoGenerate = async () => {
    try {
      const result = await clientApi.getNextClientCode(companyId, formData.category);
      
      setFormData({
        ...formData,
        clientCode: result.clientCode
      });
      
      setIsCodeChecked(true);
      alert(`자동 생성된 코드: ${result.clientCode}`);
      
    } catch (err) {
      alert(err.response?.data?.error || '자동 생성 실패');
    }
  };
  
  // 주소 검색
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
  
  // 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 항목 체크
    if (!formData.clientName.trim()) {
      alert('거래처명을 입력해주세요');
      return;
    }

    // 카테고리별 필수 항목 체크
    if (formData.category === '일반') {
      if (!formData.businessNumber.trim()) {
        alert('사업자번호를 입력해주세요');
        return;
      }
    } else if (formData.category === '은행' || formData.category === '카드') {
      if (!formData.accountNumber.trim()) {
        alert(formData.category === '은행' ? '계좌번호를 입력해주세요' : '카드번호를 입력해주세요');
        return;
      }
    }

    if (!formData.ceoName.trim()) {
      alert('대표자명을 입력해주세요');
      return;
    }

    if (!formData.address.trim()) {
      alert('주소를 입력해주세요');
      return;
    }
    
    if (!isEdit && !isCodeChecked) {
      alert('거래처 코드 중복 확인을 해주세요');
      return;
    }
    
    try {
      setLoading(true);
      
      const submitData = {
        companyId,
        category: formData.category,
        clientCode: formData.clientCode,
        clientName: formData.clientName,
        businessNumber: formData.businessNumber.replace(/\D/g, ''),
        accountNumber: formData.accountNumber.replace(/\D/g, ''),
        ceoName: formData.ceoName,
        address: formData.address,
        tel: formData.tel.replace(/\D/g, ''),
        email: formData.email,
        clientType: formData.clientType
      };
      
      if (isEdit) {
        await clientApi.updateClient(client.client_id, submitData);
        alert('수정되었습니다');
      } else {
        await clientApi.createClient(submitData);
        alert('등록되었습니다');
      }
      
      onSuccess();
      
    } catch (err) {
      alert(err.response?.data?.error || '저장 실패');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEdit ? '거래처 수정' : '거래처 등록'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 거래처 유형 (일반/은행/카드) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              거래처 유형<span className={styles.required}>*</span>
            </label>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isEdit}
            >
              <option value="일반">일반</option>
              <option value="은행">은행</option>
              <option value="카드">카드</option>
            </Select>
            {isEdit && (
              <p className={styles.infoMessage}>수정 모드에서는 유형을 변경할 수 없습니다</p>
            )}
          </div>

          {/* 거래처 코드 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              거래처 코드<span className={styles.required}>*</span>
            </label>
            {isEdit ? (
              <Input
                type="text"
                value={formData.clientCode}
                readOnly
                style={{ backgroundColor: '#f8f9fa', cursor: 'default' }}
              />
            ) : (
              <>
                <div className={styles.codeWrapper}>
                  <Input
                    type="text"
                    name="clientCode"
                    value={formData.clientCode}
                    onChange={handleChange}
                    placeholder="00000 (5자리)"
                  />
                  <Button
                    type="button"
                    variant="check"
                    onClick={handleCheckCode}
                  >
                    중복 확인
                  </Button>
                  <Button
                    type="button"
                    variant="check"
                    onClick={handleAutoGenerate}
                  >
                    자동 생성
                  </Button>
                </div>
                {formData.clientCode && !isCodeChecked && (
                  <p className={styles.warningMessage}>중복 확인을 해주세요</p>
                )}
              </>
            )}
          </div>
          
          {/* 거래처명 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              거래처명<span className={styles.required}>*</span>
            </label>
            <Input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="거래처명"
            />
          </div>
          
          {/* 일반: 사업자번호 / 은행: 계좌번호 / 카드: 카드번호 */}
          {formData.category === '일반' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                사업자번호<span className={styles.required}>*</span>
              </label>
              <Input
                type="text"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleChange}
                placeholder="000-00-00000"
              />
            </div>
          )}

          {formData.category === '은행' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                계좌번호<span className={styles.required}>*</span>
              </label>
              <Input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="계좌번호를 입력하세요"
              />
            </div>
          )}

          {formData.category === '카드' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                카드번호<span className={styles.required}>*</span>
              </label>
              <Input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="카드번호를 입력하세요"
              />
            </div>
          )}
          
          {/* 대표자명 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              대표자명<span className={styles.required}>*</span>
            </label>
            <Input
              type="text"
              name="ceoName"
              value={formData.ceoName}
              onChange={handleChange}
              placeholder="대표자명"
            />
          </div>
          
          {/* 주소 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              주소<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <Input
                type="text"
                name="address"
                value={formData.address}
                readOnly
                placeholder="주소"
              />
              <Button
                type="button"
                variant="address"
                onClick={handleSearchAddress}
              >
                주소 검색
              </Button>
            </div>
          </div>
          
          {/* 전화번호 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>전화번호</label>
            <Input
              type="text"
              name="tel"
              value={formData.tel}
              onChange={handleChange}
              placeholder="02-0000-0000 또는 000-0000-0000"
            />
          </div>

          {/* 이메일 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>이메일</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>
          
          {/* 거래처 유형 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>거래처 유형</label>
            <Select
              name="clientType"
              value={formData.clientType}
              onChange={handleChange}
            >
              <option value="매출">매출</option>
              <option value="매입">매입</option>
              <option value="양방">양방</option>
            </Select>
          </div>
          
          {/* 버튼 */}
          <div className={styles.buttonGroup}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || (!isEdit && !isCodeChecked)}
            >
              {loading ? '저장 중...' : isEdit ? '수정' : '등록'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientModal;