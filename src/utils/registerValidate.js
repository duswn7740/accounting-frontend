// 전화번호 포맷팅
export const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '');  // 숫자만 추출
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else if (numbers.length <= 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{1,4})/, '$1-$2-$3');
  } else {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
};



  //유호성 검사
export const validateRegister = (e, formData) => {
  const { email, password, passwordConfirm, name, phone } = formData;
  //이메일-유효성검사
  //영어 소문자, 이메일형식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  //비밀번호-유효성검사
  //영어 대소문자 + 숫자, 4~12자
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

  //이름
  //필수입력

  //전화번호-유효성검사
  const phoneNumbers = phone.replace(/\D/g, '');  // 숫자만 추출
 
 

  //상호명
  //사업자등록번호를 입력했다면, 입력하기

  //유효성검사
  let errorStr = '';
  switch(e.target.name){
    case 'email' :
      if(!e.target.value){
        errorStr = '아이디를 입력하세요.'
      } else if (!emailRegex.test(e.target.value)) {
        errorStr = '올바른 이메일 형식이 아닙니다.'
      } else {
        errorStr = ''
      }
      break;

    case 'password' :
      if (!e.target.value) {
        errorStr = '비밀번호를 입력하세요.'
      } else if (e.target.value.length < 8) {
        errorStr = '비밀번호는 8글자이상이어야 합니다.'
      } else if (!passwordRegex.test(e.target.value)) {
        errorStr = '비밀번호는 영어대문자, 소문자, 숫자, 특수문자를 모두 포함해야합니다.'
      } else {
        errorStr = ''
      }
      break;

    case 'passwordConfirm' :
      if (password !== e.target.value) {
        errorStr = '비밀번호가 일치하지 않습니다.'
      } else {
        errorStr = ''
      }
      break;

    case 'name' :
      if (!name || !name.trim()) {
        errorStr = '이름을 입력하세요.'
      } else {
        errorStr = ''
      }
      break;

    case 'phone' :
      if (e.target.value && phoneNumbers.length>0 &&phoneNumbers.length !== 10 && phoneNumbers.length !== 11) {
        errorStr = '전화번호는 10자리 또는 11자리여야합니다.'
      } else {
        errorStr = ''
      }
      break;    
  }
  
  return errorStr;
}

