// 사업자번호 포맷팅 (000-00-00000)
export const formatBusinessNumber = (value) => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 5) {
    return numbers.replace(/(\d{3})(\d{1,2})/, '$1-$2');
  } else if (numbers.length <= 10) {
    return numbers.replace(/(\d{3})(\d{2})(\d{1,5})/, '$1-$2-$3');
  } else {
    return numbers.slice(0, 10).replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  }
};

// 전화번호 포맷팅 (02-0000-0000 또는 000-0000-0000)
export const formatCompanyTel = (value) => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.startsWith('02')) {
    if (numbers.length <= 6) {
      return numbers.replace(/(\d{2})(\d{1,4})/, '$1-$2');
    } else if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{1,4})/, '$1-$2-$3');
    } else {
      return numbers.slice(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  } else {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{1,4})/, '$1-$2-$3');
    } else {
      return numbers.slice(0, 11).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }
};

// 회계연도 포맷팅
export const formatFiscalYearEnd = (value) => {
  const numbers = value.replace(/\D/g, ''); //숫자만 추출

  if (numbers.length <=2) {
    return numbers;
  } else if (numbers.length <=4 ){
    return numbers.replace(/(\d{2})(\d{1,2})/, '$1-$2')
  } else {
    return numbers.slice(0, 4).replace(/(\d{2})(\d{1,2})/, '$1-$2');
  }
}


// 회사 등록 유효성 검사
export const validateCompanyRegister = (e, formData) => {
  const { name, value } = e.target;
  
  switch (name) {
    case 'businessNumber':
      const cleanBN = value.replace(/\D/g, '');
      if (!cleanBN) return '사업자번호를 입력해주세요';
      if (cleanBN.length !== 10) return '사업자번호는 10자리여야 합니다';
      return '';
      
    case 'companyName':
      if (!value.trim()) return '상호를 입력해주세요';
      if (value.trim().length < 2) return '상호는 2자 이상이어야 합니다';
      return '';
      
    case 'tel':
      if (!value) return '';
      const cleanTel = value.replace(/\D/g, '');
      if (cleanTel.length < 9 || cleanTel.length > 11) return '올바른 전화번호 형식이 아닙니다';
      return '';
      
    case 'fiscalYearEnd':
      if (!value) return '';
      const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      const cleanFY = value.replace(/\D/g, '');
      if (!regex.test(value)) return '올바른 형식이 아닙니다 (MM-DD)';
      
      const [month, day] = value.split('-').map(Number);
      const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (day > daysInMonth[month - 1]) return `${month}월은 ${daysInMonth[month - 1]}일까지입니다`;
      return '';
      
    default:
      return '';
  }
};