import { useState, useEffect } from 'react';
import { createAccount, updateAccount } from '../../api/accountApi';
import { validateAccountBasic, checkAccountCodeDuplicate } from '../../utils/accountValidate';
import styles from './AccountModal.module.css';

function AccountModal({ account, onClose }) {
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: '자산',
    accountCategory: '',
    isDebitNormal: true,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({
    accountCode: '',
    accountName: '',
    accountType: ''
  });

  const accountTypes = ['자산', '부채', '자본', '수익', '비용'];

  useEffect(() => {
    if (account) {
      setFormData({
        accountCode: account.account_code,
        accountName: account.account_name,
        accountType: account.account_type,
        accountCategory: account.account_category || '',
        isDebitNormal: account.is_debit_normal,
        description: account.description || ''
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrorMsg({
      accountCode: '',
      accountName: '',
      accountType: ''
    });

    if (!formData.accountCode || !formData.accountCode.trim()) {
      setErrorMsg(prev => ({ ...prev, accountCode: '계정코드는 필수입니다' }));
      return;
    }

    if (!formData.accountName || !formData.accountName.trim()) {
      setErrorMsg(prev => ({ ...prev, accountName: '계정과목명은 필수입니다' }));
      return;
    }

    if (!formData.accountType) {
      setErrorMsg(prev => ({ ...prev, accountType: '계정유형은 필수입니다' }));
      return;
    }

    if (!account) {
      const user = JSON.parse(localStorage.getItem('user'));
      const duplicateError = await checkAccountCodeDuplicate(user.companyId, formData.accountCode);
      if (duplicateError) {
        setErrorMsg(prev => ({ ...prev, accountCode: duplicateError }));
        return;
      }
    }

    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem('user'));
      
      const accountData = {
        companyId: user.companyId,
        accountCode: formData.accountCode,
        accountName: formData.accountName,
        accountType: formData.accountType,
        accountCategory: formData.accountCategory,
        isDebitNormal: formData.isDebitNormal,
        description: formData.description
      };

      if (account) {
        await updateAccount(account.account_id, accountData);
      } else {
        await createAccount(accountData);
      }

      onClose(true);

    } catch (error) {
      setErrorMsg(prev => ({ 
        ...prev, 
        accountName: error.response?.data?.error || '저장에 실패했습니다' 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{account ? '계정과목 수정' : '계정과목 추가'}</h3>
          <button className={styles.closeButton} onClick={() => onClose(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              계정코드<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="accountCode"
              value={formData.accountCode}
              onChange={handleChange}
              placeholder="예: 101"
              disabled={!!account}
              className={styles.input}
            />
            {account && <small>* 계정코드는 수정할 수 없습니다</small>}
            <p className={styles.errorMessage}>{errorMsg.accountCode}</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              계정과목명<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="예: 현금"
              className={styles.input}
            />
            <p className={styles.errorMessage}>{errorMsg.accountName}</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              계정유형<span className={styles.required}>*</span>
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className={styles.input}
            >
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className={styles.errorMessage}>{errorMsg.accountType}</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>세부분류</label>
            <input
              type="text"
              name="accountCategory"
              value={formData.accountCategory}
              onChange={handleChange}
              placeholder="예: 유동자산, 자산차감, 제조원가"
              className={styles.input}
            />
            <small>유동자산, 재고자산, 자산증가, 자산차감, 부채증가, 부채차감 등 자유롭게 입력</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isDebitNormal"
                checked={formData.isDebitNormal}
                onChange={handleChange}
              />
              <span>차변증가계정</span>
            </label>
            <small>체크 시: 차변 증가 / 미체크 시: 대변 증가</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="계정과목에 대한 설명을 입력하세요"
              rows={3}
              className={styles.input}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={() => onClose(false)}>
              취소
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? '저장 중...' : (account ? '수정' : '추가')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AccountModal;