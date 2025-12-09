import { checkAccountCode } from '../api/accountApi';

// 계정과목 기본 유효성 검사
export const validateAccountBasic = (formData) => {
  if (!formData.accountCode || !formData.accountCode.trim()) {
    return '계정코드는 필수입니다';
  }

  if (!formData.accountName || !formData.accountName.trim()) {
    return '계정과목명은 필수입니다';
  }

  if (!formData.accountType) {
    return '계정유형은 필수입니다';
  }

  return null;
};

// 계정코드 중복 체크
export const checkAccountCodeDuplicate = async (companyId, accountCode) => {
  try {
    const response = await checkAccountCode(companyId, accountCode);  // ← 수정!
    return response.exists ? '이미 사용 중인 계정코드입니다' : null;
  } catch (error) {
    return '계정코드 중복 확인에 실패했습니다';
  }
};