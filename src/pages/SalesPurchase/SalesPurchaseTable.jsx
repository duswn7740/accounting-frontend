import React, { useState, useEffect, useRef } from 'react';
import { createVoucher, deleteVoucher, getVouchersByDateRange, getVoucherById, updateVoucher } from '@/api/salesPurchaseApi';
import { getAccountsByCompany } from '@/api/accountApi';
import { getClientsByCompany } from '@/api/clientApi';
import AccountSearchModal from '../Voucher/AccountSearchModal';
import ClientSearchModal from '../Voucher/ClientSearchModal';
import SearchInput from '../../components/SearchInput';
import styles from './SalesPurchaseTable.module.css';

function SalesPurchaseTable({ searchDates }) {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  // 펼쳐진 전표 ID들
  const [expandedVoucherIds, setExpandedVoucherIds] = useState([]);
  // 펼쳐진 전표의 상세 라인들
  const [voucherDetails, setVoucherDetails] = useState({});

  // 수정 모드 - 전표 ID로 관리
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [editFormData, setEditFormData] = useState([]);

  // 임시 라인들 (아직 저장 안 된 상태)
  const [tempLines, setTempLines] = useState([]);

  // 현재 입력 중인 라인
  const [currentLine, setCurrentLine] = useState({
    month: '',
    day: '',
    voucherType: '매출',
    debitCredit: '차변',
    accountCode: '',
    accountName: '',
    accountId: null,
    clientCode: '',
    clientName: '',
    clientBusinessNo: '',
    clientId: null,
    debitAmount: '',
    creditAmount: '',
    taxInvoiceYn: false,
    descriptionCode: '',
    description: ''
  });

  // 모달 상태
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  const monthInputRef = useRef(null);

  const voucherTypeOptions = ['매출', '매입', '면세매출', '면세매입', '불공'];

  useEffect(() => {
    fetchAccounts();
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchDates.startDate && searchDates.endDate) {
      fetchVouchers();
    }
  }, [searchDates]);

  const fetchAccounts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getAccountsByCompany(user.companyId);
      setAccounts(response.accounts);
    } catch (error) {
      console.error('계정과목 조회 실패:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getClientsByCompany(user.companyId);
      setClients(response.clients);
    } catch (error) {
      console.error('거래처 조회 실패:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getVouchersByDateRange(
        user.companyId,
        searchDates.startDate,
        searchDates.endDate
      );
      console.log('조회된 전표 데이터:', response.vouchers);
      setVouchers(response.vouchers);
    } catch (error) {
      console.error('전표 조회 실패:', error);
    }
  };

  // 전표 상세 조회 (펼치기/접기)
  const handleToggleVoucher = async (voucherId) => {
    if (expandedVoucherIds.includes(voucherId)) {
      // 상세보기를 닫을 때 해당 전표의 수정모드도 취소
      if (editingVoucherId === voucherId) {
        handleCancelEdit();
      }
      setExpandedVoucherIds(prev => prev.filter(id => id !== voucherId));
    } else {
      try {
        const response = await getVoucherById(voucherId);
        setVoucherDetails(prev => ({
          ...prev,
          [voucherId]: response.voucher.lines
        }));
        setExpandedVoucherIds(prev => [...prev, voucherId]);
      } catch (error) {
        alert(error.response?.data?.error || '전표 상세 조회 실패');
      }
    }
  };

  // 차대변 합계 계산
  const calculateTotals = () => {
    let debit = 0;
    let credit = 0;

    tempLines.forEach(line => {
      debit += parseFloat(line.debitAmount) || 0;
      credit += parseFloat(line.creditAmount) || 0;
    });

    debit += parseFloat(currentLine.debitAmount) || 0;
    credit += parseFloat(currentLine.creditAmount) || 0;

    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 };
  };

  const totals = calculateTotals();

  // 현재 라인 입력 변경
  // AccountInput 컴포넌트로부터 계정 정보 받기
  const handleAccountChange = (accountData) => {
    setCurrentLine(prev => ({
      ...prev,
      accountId: accountData.accountId,
      accountCode: accountData.accountCode || '',
      accountName: accountData.accountName || ''
    }));
  };

  // ClientInput 컴포넌트로부터 거래처 정보 받기
  const handleClientChange = (clientData) => {
    // 거래처 사업자번호도 함께 가져오기
    const client = clients.find(c => c.client_id === clientData.clientId);
    setCurrentLine(prev => ({
      ...prev,
      clientId: clientData.clientId,
      clientCode: clientData.clientCode || '',
      clientName: clientData.clientName || '',
      clientBusinessNo: client?.business_number || ''
    }));
  };

  const handleCurrentLineChange = (field, value) => {
    if (field === 'debitCredit') {
      // 차대변 변경 시 반대편 금액 초기화
      setCurrentLine(prev => ({
        ...prev,
        debitCredit: value,
        debitAmount: value === '차변' ? prev.debitAmount : '',
        creditAmount: value === '대변' ? prev.creditAmount : ''
      }));
    } else {
      setCurrentLine(prev => ({ ...prev, [field]: value }));
    }
  };

  // 라인 추가 (임시 라인에 추가)
  const handleAddLine = () => {
    if (!currentLine.accountId) {
      alert('계정과목을 선택해주세요');
      return;
    }

    const debitAmount = parseFloat(currentLine.debitAmount) || 0;
    const creditAmount = parseFloat(currentLine.creditAmount) || 0;

    if (debitAmount === 0 && creditAmount === 0) {
      alert('차변 또는 대변 금액을 입력해주세요');
      return;
    }

    if (debitAmount > 0 && creditAmount > 0) {
      alert('차변과 대변 중 하나만 입력해주세요');
      return;
    }

    const newLine = {
      month: currentLine.month,
      day: currentLine.day,
      voucherType: currentLine.voucherType,
      debitCredit: currentLine.debitCredit,
      accountId: currentLine.accountId,
      accountCode: currentLine.accountCode,
      accountName: currentLine.accountName,
      clientId: currentLine.clientId,
      clientCode: currentLine.clientCode,
      clientName: currentLine.clientName,
      clientBusinessNo: currentLine.clientBusinessNo,
      debitAmount: debitAmount,
      creditAmount: creditAmount,
      taxInvoiceYn: currentLine.taxInvoiceYn,
      descriptionCode: currentLine.descriptionCode,
      description: currentLine.description
    };

    const newTempLines = [...tempLines, newLine];
    setTempLines(newTempLines);

    // 부가세 자동 추가 (매출/매입인 경우)
    const voucherType = currentLine.voucherType;
    console.log('부가세 자동 추가 시작:', { voucherType, newTempLinesLength: newTempLines.length });

    if (voucherType === '매출' || voucherType === '매입') {
      // 새로 추가된 라인을 포함한 차대변 합계 계산
      const newTotals = newTempLines.reduce((acc, line) => {
        acc.debit += parseFloat(line.debitAmount) || 0;
        acc.credit += parseFloat(line.creditAmount) || 0;
        return acc;
      }, { debit: 0, credit: 0 });

      console.log('차대변 합계:', newTotals);

      let vatAccountCode = null;
      let vatDebitCredit = null;
      let supplyAmount = 0;

      // 매출: 대변(공급가액) 입력 시 부가세 추가
      // 매입: 차변(공급가액) 입력 시 부가세 추가
      if (voucherType === '매출') {
        // 대변에서 부가세예수금 제외한 금액 = 공급가액
        const existingVatLine = newTempLines.find(line => line.accountCode === '255');
        const existingVat = existingVatLine ? (existingVatLine.creditAmount || 0) : 0;
        supplyAmount = newTotals.credit - existingVat;

        if (supplyAmount > 0) {
          vatAccountCode = '255'; // 부가세예수금
          vatDebitCredit = '대변';
          console.log('매출 부가세 계산:', { vatAccountCode, supplyAmount, existingVat });
        }
      } else if (voucherType === '매입') {
        // 차변에서 부가세대급금 제외한 금액 = 공급가액
        const existingVatLine = newTempLines.find(line => line.accountCode === '135');
        const existingVat = existingVatLine ? (existingVatLine.debitAmount || 0) : 0;
        supplyAmount = newTotals.debit - existingVat;

        if (supplyAmount > 0) {
          vatAccountCode = '135'; // 부가세대급금
          vatDebitCredit = '차변';
          console.log('매입 부가세 계산:', { vatAccountCode, supplyAmount, existingVat });
        }
      }

      if (vatAccountCode && supplyAmount > 0) {
        const vatAccount = accounts.find(a => a.account_code === vatAccountCode);
        console.log('부가세 계정 찾기:', { vatAccountCode, found: !!vatAccount });

        if (vatAccount) {
          // 기존 부가세 라인 제거 (있으면)
          const linesWithoutVat = newTempLines.filter(line => line.accountCode !== vatAccountCode);

          // 부가세 계산
          const vatAmount = Math.round(supplyAmount * 0.1);
          console.log('부가세 금액:', vatAmount);

          // 부가세 라인 추가
          const vatLine = {
            month: currentLine.month,
            day: currentLine.day,
            voucherType: currentLine.voucherType,
            debitCredit: vatDebitCredit,
            accountId: vatAccount.account_id,
            accountCode: vatAccount.account_code,
            accountName: vatAccount.account_name,
            clientId: null,
            clientCode: '',
            clientName: '',
            clientBusinessNo: '',
            debitAmount: vatDebitCredit === '차변' ? vatAmount : 0,
            creditAmount: vatDebitCredit === '대변' ? vatAmount : 0,
            taxInvoiceYn: false,
            descriptionCode: '',
            description: '부가세'
          };

          console.log('부가세 라인 추가:', vatLine);
          const finalTempLines = [...linesWithoutVat, vatLine];
          setTempLines(finalTempLines);

          // 부가세 추가 후 차대변 일치 여부 확인하고 자동 저장
          setTimeout(() => {
            checkAndAutoSave(finalTempLines);
          }, 100);
        } else {
          console.log('부가세 계정을 찾을 수 없습니다. accounts:', accounts.map(a => a.account_code));
        }
      } else {
        // 부가세가 없는 경우에도 차대변 확인
        setTimeout(() => {
          checkAndAutoSave(newTempLines);
        }, 100);
      }
    } else {
      // 매출/매입이 아닌 경우에도 차대변 확인
      setTimeout(() => {
        checkAndAutoSave(newTempLines);
      }, 100);
    }

    // 초기화 (월/일/전표유형/차대변은 유지)
    setCurrentLine(prev => ({
      ...prev,
      accountCode: '',
      accountName: '',
      accountId: null,
      clientCode: '',
      clientName: '',
      clientBusinessNo: '',
      clientId: null,
      debitAmount: '',
      creditAmount: '',
      taxInvoiceYn: false,
      descriptionCode: '',
      description: ''
    }));

    setTimeout(() => {
      if (monthInputRef.current) {
        monthInputRef.current.focus();
      }
    }, 0);
  };

  // 차대변 일치 시 자동 저장
  const checkAndAutoSave = (lines) => {
    const debitTotal = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    const creditTotal = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);

    console.log('차대변 합계 체크:', { debitTotal, creditTotal, balanced: Math.abs(debitTotal - creditTotal) < 0.01 });

    if (Math.abs(debitTotal - creditTotal) < 0.01 && lines.length > 0) {
      console.log('차대변 일치! 자동 저장 실행');
      handleSaveVoucher(lines); // lines를 인자로 전달
    }
  };

  // 임시 라인 삭제
  const handleDeleteTempLine = (index) => {
    setTempLines(prev => prev.filter((_, i) => i !== index));
  };

  // 전표 저장
  const handleSaveVoucher = async (linesToSave = null) => {
    // linesToSave가 없으면 tempLines 사용 (수동 저장 버튼 클릭 시)
    const lines = linesToSave || tempLines;

    if (lines.length === 0) {
      alert('최소 1개 이상의 라인을 추가해주세요');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));

      // 회계기수 정보에서 연도 가져오기 (UTC 타임존 변환 없이 직접 추출)
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo'));
      if (!fiscalPeriodInfo) {
        alert('회계기수 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        return;
      }
      const year = parseInt(fiscalPeriodInfo.startDate.substring(0, 4));

      // 첫 번째 라인의 날짜 사용
      const firstLine = lines[0];
      const month = firstLine.month || new Date().getMonth() + 1;
      const day = firstLine.day || new Date().getDate();
      const voucherDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // 첫 번째 라인의 전표유형 사용
      const voucherType = firstLine.voucherType;

      // 첫 번째 라인의 거래처 사용 (있으면)
      const clientId = firstLine.clientId || null;

      // 전자세금계산서 여부 (하나라도 true면 true)
      const taxInvoiceYn = lines.some(line => line.taxInvoiceYn);

      const voucherData = {
        companyId: user.companyId,
        voucherDate,
        voucherType,
        clientId,
        taxInvoiceYn,
        taxInvoiceNo: null,
        totalSupplyAmount: 0,
        totalVatAmount: 0,
        totalAmount: 0,
        status: '확정'
      };

      const voucherLines = lines.map(line => ({
        debitCredit: line.debitAmount > 0 ? '차변' : '대변',
        accountId: line.accountId,
        clientId: line.clientId || null,
        amount: line.debitAmount > 0 ? line.debitAmount : line.creditAmount,
        description: line.description || null,
        descriptionCode: line.descriptionCode || null,
        departmentCode: null,
        projectCode: null
      }));

      // lines로 차대변 합계 계산
      const linesTotals = lines.reduce((acc, line) => {
        acc.debit += parseFloat(line.debitAmount) || 0;
        acc.credit += parseFloat(line.creditAmount) || 0;
        return acc;
      }, { debit: 0, credit: 0 });

      // 공급가액과 부가세 계산 (lines에 이미 부가세 라인이 포함되어 있음)
      console.log('저장 시 전표 유형:', voucherType);
      console.log('저장 시 lines:', lines);
      console.log('저장 시 linesTotals:', linesTotals);

      if (voucherType === '매출') {
        // 매출: 대변에서 부가세예수금(255) 제외한 금액 = 공급가액
        const vatLine = lines.find(line => line.accountCode === '255');
        const supplyAmount = linesTotals.credit - (vatLine ? (vatLine.creditAmount || 0) : 0);
        const vatAmount = vatLine ? (vatLine.creditAmount || 0) : 0;

        console.log('매출 전표:', { vatLine, supplyAmount, vatAmount, totalDebit: linesTotals.debit });

        voucherData.totalSupplyAmount = supplyAmount;
        voucherData.totalVatAmount = vatAmount;
        voucherData.totalAmount = linesTotals.debit; // 차변 합계 = 총액
      } else if (voucherType === '매입') {
        // 매입: 차변에서 부가세대급금(135) 제외한 금액 = 공급가액
        const vatLine = lines.find(line => line.accountCode === '135');
        const supplyAmount = linesTotals.debit - (vatLine ? (vatLine.debitAmount || 0) : 0);
        const vatAmount = vatLine ? (vatLine.debitAmount || 0) : 0;

        console.log('매입 전표:', { vatLine, supplyAmount, vatAmount, totalCredit: linesTotals.credit });

        voucherData.totalSupplyAmount = supplyAmount;
        voucherData.totalVatAmount = vatAmount;
        voucherData.totalAmount = linesTotals.credit; // 대변 합계 = 총액
      } else {
        // 면세 또는 기타 유형은 차대변 검증
        const balanced = Math.abs(linesTotals.debit - linesTotals.credit) < 0.01;
        if (!balanced) {
          alert('차변과 대변 합계가 일치하지 않습니다');
          return;
        }
        voucherData.totalAmount = linesTotals.debit;
      }

      console.log('최종 voucherData:', voucherData);

      // 최종 차대변 검증 (부가세 라인 추가 후)
      const finalDebit = voucherLines
        .filter(l => l.debitCredit === '차변')
        .reduce((sum, l) => sum + parseFloat(l.amount), 0);
      const finalCredit = voucherLines
        .filter(l => l.debitCredit === '대변')
        .reduce((sum, l) => sum + parseFloat(l.amount), 0);

      if (Math.abs(finalDebit - finalCredit) > 0.01) {
        alert('부가세 라인 추가 후에도 차대변이 일치하지 않습니다. 금액을 확인해주세요.');
        return;
      }

      await createVoucher(voucherData, voucherLines);
      alert('전표가 저장되었습니다');

      // 초기화
      setTempLines([]);
      setCurrentLine({
        month: '',
        day: '',
        voucherType: '매출',
        debitCredit: '차변',
        accountCode: '',
        accountName: '',
        accountId: null,
        clientCode: '',
        clientName: '',
        clientBusinessNo: '',
        clientId: null,
        debitAmount: '',
        creditAmount: '',
        taxInvoiceYn: false,
        descriptionCode: '',
        description: ''
      });

      fetchVouchers();
    } catch (error) {
      alert(error.response?.data?.error || '저장 실패');
    }
  };

  // 임시 라인 취소
  const handleCancelTempLines = () => {
    if (tempLines.length === 0) {
      return;
    }
    if (window.confirm('입력 중인 라인을 모두 삭제하시겠습니까?')) {
      setTempLines([]);
      setCurrentLine({
        month: '',
        day: '',
        voucherType: '매출',
        debitCredit: '차변',
        accountCode: '',
        accountName: '',
        accountId: null,
        clientCode: '',
        clientName: '',
        clientBusinessNo: '',
        clientId: null,
        debitAmount: '',
        creditAmount: '',
        taxInvoiceYn: false,
        descriptionCode: '',
        description: ''
      });
    }
  };

  // 전표 수정 모드 진입
  const handleEditVoucher = async (voucherId) => {
    try {
      const response = await getVoucherById(voucherId);
      const lines = response.voucher.lines;

      // 상세보기가 닫혀있으면 열기
      if (!expandedVoucherIds.includes(voucherId)) {
        setVoucherDetails(prev => ({
          ...prev,
          [voucherId]: lines
        }));
        setExpandedVoucherIds(prev => [...prev, voucherId]);
      }

      setEditingVoucherId(voucherId);

      const mappedLines = lines.map(line => ({
        line_id: line.line_id,
        voucher_date: response.voucher.voucher_date,
        month: new Date(response.voucher.voucher_date).getMonth() + 1,
        day: new Date(response.voucher.voucher_date).getDate(),
        voucherType: response.voucher.voucher_type,
        debitCredit: line.debit_credit,
        accountCode: line.account_code,
        accountName: line.account_name,
        accountId: line.account_id,
        clientCode: line.client_code || '',
        clientName: line.client_name || '',
        clientBusinessNo: line.business_number || '',
        clientId: line.client_id || null,
        debitAmount: line.debit_credit === '차변' ? line.amount : 0,
        creditAmount: line.debit_credit === '대변' ? line.amount : 0,
        taxInvoiceYn: response.voucher.tax_invoice_yn || false,
        descriptionCode: line.description_code || '',
        description: line.description || ''
      }));

      setEditFormData(mappedLines);
    } catch (error) {
      alert(error.response?.data?.error || '전표 조회 실패');
    }
  };

  // 수정 모드 - AccountInput 컴포넌트로부터 계정 정보 받기
  const handleEditAccountChange = (lineIndex, accountData) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        accountId: accountData.accountId,
        accountCode: accountData.accountCode || '',
        accountName: accountData.accountName || ''
      };
      return newData;
    });
  };

  // 수정 모드 - ClientInput 컴포넌트로부터 거래처 정보 받기
  const handleEditClientChange = (lineIndex, clientData) => {
    const client = clients.find(c => c.client_id === clientData.clientId);
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        clientId: clientData.clientId,
        clientCode: clientData.clientCode || '',
        clientName: clientData.clientName || '',
        clientBusinessNo: client?.business_number || ''
      };
      return newData;
    });
  };

  // 수정 중인 라인 데이터 업데이트
  const handleUpdateEditLine = (lineIndex, field, value) => {
    setEditFormData(prev => {
      const newData = [...prev];

      if (field === 'debitAmount' || field === 'creditAmount') {
        const numValue = value.replace(/,/g, '');
        newData[lineIndex] = { ...newData[lineIndex], [field]: numValue };
      } else {
        newData[lineIndex] = { ...newData[lineIndex], [field]: value };
      }

      return newData;
    });
  };

  // 수정 모드에서 라인 추가
  const handleAddEditLine = () => {
    if (editFormData.length === 0) return;

    const firstLine = editFormData[0];
    const newLine = {
      line_id: null,
      voucher_date: firstLine.voucher_date,
      month: firstLine.month,
      day: firstLine.day,
      voucherType: firstLine.voucherType,
      debitCredit: '대변',
      accountCode: '',
      accountName: '',
      accountId: null,
      clientCode: '',
      clientName: '',
      clientBusinessNo: '',
      clientId: null,
      debitAmount: 0,
      creditAmount: 0,
      taxInvoiceYn: false,
      descriptionCode: '',
      description: ''
    };

    setEditFormData(prev => [...prev, newLine]);
  };

  // 수정 모드에서 라인 삭제
  const handleRemoveEditLine = (lineIndex) => {
    if (editFormData.length === 1) {
      alert('최소 1개의 라인은 있어야 합니다');
      return;
    }
    setEditFormData(prev => prev.filter((_, idx) => idx !== lineIndex));
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingVoucherId || editFormData.length === 0) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo'));

      if (!fiscalPeriodInfo) {
        alert('회계기수 정보를 찾을 수 없습니다.');
        return;
      }

      const year = parseInt(fiscalPeriodInfo.startDate.substring(0, 4));
      const firstLine = editFormData[0];
      const voucherDate = `${year}-${String(firstLine.month).padStart(2, '0')}-${String(firstLine.day).padStart(2, '0')}`;

      // 차대변 합계 계산
      const debitTotal = editFormData.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
      const creditTotal = editFormData.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);

      if (Math.abs(debitTotal - creditTotal) > 0.01) {
        alert('차변과 대변 합계가 일치하지 않습니다');
        return;
      }

      // 공급가액과 부가세 계산
      let totalSupplyAmount = 0;
      let totalVatAmount = 0;

      if (firstLine.voucherType === '매출') {
        const vatLine = editFormData.find(line => line.accountCode === '255');
        totalSupplyAmount = creditTotal - (vatLine ? (parseFloat(vatLine.creditAmount) || 0) : 0);
        totalVatAmount = vatLine ? (parseFloat(vatLine.creditAmount) || 0) : 0;
      } else if (firstLine.voucherType === '매입') {
        const vatLine = editFormData.find(line => line.accountCode === '135');
        totalSupplyAmount = debitTotal - (vatLine ? (parseFloat(vatLine.debitAmount) || 0) : 0);
        totalVatAmount = vatLine ? (parseFloat(vatLine.debitAmount) || 0) : 0;
      } else {
        totalSupplyAmount = debitTotal;
      }

      const voucherData = {
        companyId: user.companyId,
        voucherDate,
        voucherType: firstLine.voucherType,
        clientId: firstLine.clientId,
        taxInvoiceYn: firstLine.taxInvoiceYn,
        taxInvoiceNo: null,
        totalSupplyAmount,
        totalVatAmount,
        totalAmount: debitTotal,
        status: '확정'
      };

      const voucherLines = editFormData.map(line => ({
        debitCredit: line.debitAmount > 0 ? '차변' : '대변',
        accountId: line.accountId,
        clientId: line.clientId || null,
        amount: parseFloat(line.debitAmount > 0 ? line.debitAmount : line.creditAmount),
        description: line.description || null,
        descriptionCode: line.descriptionCode || null,
        departmentCode: null,
        projectCode: null
      }));

      await updateVoucher(editingVoucherId, voucherData, voucherLines);
      alert('전표가 수정되었습니다');

      setEditingVoucherId(null);
      setEditFormData([]);
      fetchVouchers();
    } catch (error) {
      alert(error.response?.data?.error || '수정 실패');
    }
  };

  // 수정 모드 취소
  const handleCancelEdit = () => {
    setEditingVoucherId(null);
    setEditFormData([]);
  };

  // 전표 삭제
  const handleDeleteVoucher = async (voucherId, voucherNo) => {
    if (!window.confirm(`전표번호 ${voucherNo}를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteVoucher(voucherId);
      alert('전표가 삭제되었습니다');
      fetchVouchers();
    } catch (error) {
      alert(error.response?.data?.error || '삭제 실패');
    }
  };

  const handleAccountSelect = (account) => {
    setCurrentLine(prev => ({
      ...prev,
      accountId: account.account_id,
      accountCode: account.account_code,
      accountName: account.account_name
    }));
    setShowAccountModal(false);
  };

  const handleClientSelect = (client) => {
    setCurrentLine(prev => ({
      ...prev,
      clientId: client.client_id,
      clientCode: client.client_code,
      clientName: client.client_name,
      clientBusinessNo: client.business_number
    }));
    setShowClientModal(false);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' && field === 'description') {
      e.preventDefault();
      handleAddLine();
    }
  };

  const formatAmount = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('ko-KR');
  };

  const formatBusinessNumber = (value) => {
    if (!value) return '';
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    // 000-00-00000 형식으로 변환
    if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
    }
    return value;
  };

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>월</th>
              <th>일</th>
              <th>전표유형</th>
              <th>전표번호</th>
              <th>계정코드</th>
              <th>계정과목</th>
              <th>거래처코드</th>
              <th>거래처명</th>
              <th>사업자번호</th>
              <th>공급가액</th>
              <th>부가세</th>
              <th>전자</th>
              <th>적요코드</th>
              <th>적요</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {/* 저장된 전표들 */}
            {vouchers.map(voucher => {
              const isEditing = editingVoucherId === voucher.voucher_id;
              const voucherNo = voucher.voucher_no ? String(voucher.voucher_no).padStart(3, '0') : '-';

              return (
                <React.Fragment key={`voucher-${voucher.voucher_id}`}>
                  {/* 요약 행 - 항상 표시, 클릭 시 토글 */}
                  <tr
                    className={styles.voucherRow}
                    onClick={() => handleToggleVoucher(voucher.voucher_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{new Date(voucher.voucher_date).getMonth() + 1}</td>
                    <td>{new Date(voucher.voucher_date).getDate()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[voucher.voucher_type]}`}>
                        {voucher.voucher_type}
                      </span>
                    </td>
                    <td>{voucherNo}</td>
                    <td>{voucher.account_code || '-'}</td>
                    <td>{voucher.account_name || '-'}</td>
                    <td>{voucher.client_code || '-'}</td>
                    <td>{voucher.client_name || '-'}</td>
                    <td>{formatBusinessNumber(voucher.business_number) || '-'}</td>
                    <td className={styles.amount}>
                      {voucher.total_supply_amount ? Number(voucher.total_supply_amount).toLocaleString() : '-'}
                    </td>
                    <td className={styles.amount}>
                      {voucher.total_vat_amount ? Number(voucher.total_vat_amount).toLocaleString() : '-'}
                    </td>
                    <td>{voucher.tax_invoice_yn ? 'O' : '-'}</td>
                    <td>{voucher.description_code || '-'}</td>
                    <td>{voucher.description || '-'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {isEditing ? (
                          <>
                            <button
                              className={styles.saveButton}
                              onClick={handleSaveEdit}
                            >
                              저장
                            </button>
                            <button
                              className={styles.cancelButton}
                              onClick={handleCancelEdit}
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={styles.editButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVoucher(voucher.voucher_id);
                              }}
                            >
                              수정
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVoucher(voucher.voucher_id, voucherNo);
                              }}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* 상세 라인 표시 - 펼쳐진 경우에만 */}
                  {!isEditing && expandedVoucherIds.includes(voucher.voucher_id) && voucherDetails[voucher.voucher_id] && (
                    <>
                      {/* 상세 라인 헤더 */}
                      <tr className={styles.detailHeaderRow}>
                        <td>월</td>
                        <td>일</td>
                        <td>유형</td>
                        <td>번호</td>
                        <td>차대</td>
                        <td>계정코드</td>
                        <td>계정과목</td>
                        <td>거래처코드</td>
                        <td>거래처명</td>
                        <td>사업자번호</td>
                        <td>차변</td>
                        <td>대변</td>
                        <td>전자</td>
                        <td>적요</td>
                        <td></td>
                      </tr>
                      {voucherDetails[voucher.voucher_id].map((line, idx) => (
                        <tr key={`detail-${voucher.voucher_id}-${idx}`} className={styles.detailLine}>
                          <td>{new Date(voucher.voucher_date).getMonth() + 1}</td>
                          <td>{new Date(voucher.voucher_date).getDate()}</td>
                          <td>{line.voucher_type}</td>
                          <td>{voucherNo}</td>
                          <td>{line.debit_credit}</td>
                          <td>{line.account_code}</td>
                          <td>{line.account_name}</td>
                          <td>{line.client_code || '-'}</td>
                          <td>{line.client_name || '-'}</td>
                          <td>{formatBusinessNumber(voucher.business_number) || '-'}</td>
                          <td className={styles.amount}>
                            {line.debit_credit === '차변' ? Number(line.amount).toLocaleString() : '-'}
                          </td>
                          <td className={styles.amount}>
                            {line.debit_credit === '대변' ? Number(line.amount).toLocaleString() : '-'}
                          </td>
                          <td>-</td>
                          <td>{line.description || '-'}</td>
                          <td></td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* 수정 모드일 때 - 상세 라인들만 펼침 */}
                  {isEditing && editFormData.map((editLine, lineIdx) => (
                    <tr key={`edit-${voucher.voucher_id}-${lineIdx}`} className={styles.editingLine}>
                      <td>
                        <input
                          type="text"
                          value={editLine.month}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'month', e.target.value)}
                          className={styles.input}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editLine.day}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'day', e.target.value)}
                          className={styles.input}
                        />
                      </td>
                      <td>
                        <select
                          value={editLine.voucherType}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'voucherType', e.target.value)}
                          className={styles.input}
                        >
                          {voucherTypeOptions.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{voucherNo}</td>
                      <SearchInput
                        items={accounts}
                        codeValue={editLine.accountCode}
                        nameValue={editLine.accountName}
                        onChange={(accountData) => handleEditAccountChange(lineIdx, accountData)}
                        onOpenModal={() => setShowAccountModal(true)}
                        codeField="account_code"
                        nameField="account_name"
                        idField="account_id"
                        outputCodeField="accountCode"
                        outputNameField="accountName"
                        outputIdField="accountId"
                      />
                      <SearchInput
                        items={clients}
                        codeValue={editLine.clientCode}
                        nameValue={editLine.clientName}
                        onChange={(clientData) => handleEditClientChange(lineIdx, clientData)}
                        onOpenModal={() => setShowClientModal(true)}
                        codeField="client_code"
                        nameField="client_name"
                        idField="client_id"
                        outputCodeField="clientCode"
                        outputNameField="clientName"
                        outputIdField="clientId"
                      />
                      <td>
                        <input
                          type="text"
                          value={formatBusinessNumber(editLine.clientBusinessNo)}
                          onChange={(e) => {handleUpdateEditLine(lineIdx, 'clientBusinessNo', e.target.value)}}
                          readOnly
                          className={styles.input}
                        />
                      </td>
                      <td className={styles.amount}>
                        <input
                          type="text"
                          value={formatAmount(editLine.debitAmount)}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'debitAmount', e.target.value)}
                          className={styles.input}
                        />
                      </td>
                      <td className={styles.amount}>
                        <input
                          type="text"
                          value={formatAmount(editLine.creditAmount)}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'creditAmount', e.target.value)}
                          className={styles.input}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editLine.taxInvoiceYn ? '전자' : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUpdateEditLine(lineIdx, 'taxInvoiceYn', value === '1' || value === '전자');
                          }}
                          className={styles.input}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editLine.descriptionCode}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'descriptionCode', e.target.value)}
                          className={styles.input}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editLine.description}
                          onChange={(e) => handleUpdateEditLine(lineIdx, 'description', e.target.value)}
                          className={styles.input}
                        />
                      </td>
                      <td>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleRemoveEditLine(lineIdx)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* 수정 모드일 때 라인 추가 버튼 */}
                  {isEditing && (
                    <tr className={styles.addLineRow}>
                      <td colSpan="15" style={{ textAlign: 'center', padding: '8px' }}>
                        <button
                          className={styles.addButton}
                          onClick={handleAddEditLine}
                        >
                          + 라인 추가
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* 임시 라인들 - 수정 모드가 아닐 때만 표시 */}
            {!editingVoucherId && tempLines.length > 0 && (
              <>
                {/* 임시 라인 헤더 */}
                <tr className={styles.tempHeaderRow}>
                  <td>월</td>
                  <td>일</td>
                  <td>전표유형</td>
                  <td>차대변</td>
                  <td>계정코드</td>
                  <td>계정명</td>
                  <td>거래처코드</td>
                  <td>거래처명</td>
                  <td>사업자번호</td>
                  <td>차변</td>
                  <td>대변</td>
                  <td>전자여부</td>
                  <td>적요코드</td>
                  <td>적요</td>
                  <td></td>
                </tr>
                {tempLines.map((line, index) => (
                  <tr key={`temp-${index}`} className={styles.tempLine}>
                    <td>{line.month}</td>
                    <td>{line.day}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[line.voucherType]}`}>
                        {line.voucherType}
                      </span>
                    </td>
                    <td>{line.debitCredit}</td>
                    <td>{line.accountCode}</td>
                    <td>{line.accountName}</td>
                    <td>{line.clientCode || '-'}</td>
                    <td>{line.clientName || '-'}</td>
                    <td>{formatBusinessNumber(line.clientBusinessNo) || '-'}</td>
                    <td className={styles.amount}>{line.debitAmount ? formatAmount(line.debitAmount) : '-'}</td>
                    <td className={styles.amount}>{line.creditAmount ? formatAmount(line.creditAmount) : '-'}</td>
                    <td>{line.taxInvoiceYn ? 'O' : '-'}</td>
                    <td>{line.descriptionCode || '-'}</td>
                    <td>{line.description || '-'}</td>
                    <td>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteTempLine(index)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* 차대변 합계 행 - 항상 표시 */}
            <tr className={styles.totalsRow}>
              <td colSpan="9" style={{ textAlign: 'left', paddingLeft: '20px' }}>
                <span style={{ marginRight: '30px' }}>
                  차변 합계: <strong className={styles.amount}>{formatAmount(totals.debit)}</strong>
                </span>
                <span style={{ marginRight: '30px' }}>
                  대변 합계: <strong className={styles.amount}>{formatAmount(totals.credit)}</strong>
                </span>
                <span className={totals.balanced ? styles.balanced : styles.unbalanced}>
                  {totals.balanced ? '✓ 차대변 일치' : '✗ 차대변 불일치'}
                </span>
              </td>
              <td colSpan="6"></td>
            </tr>

            {/* 새 라인 입력 헤더 - 항상 표시 */}
            <>
                <tr className={styles.inputHeaderRow}>
                  <td>월</td>
                  <td>일</td>
                  <td>전표유형</td>
                  <td>차대변</td>
                  <td>계정코드</td>
                  <td>계정명</td>
                  <td>거래처코드</td>
                  <td>거래처명</td>
                  <td>사업자번호</td>
                  <td>차변</td>
                  <td>대변</td>
                  <td>전자여부</td>
                  <td>적요코드</td>
                  <td>적요</td>
                  <td></td>
                </tr>

                {/* 새 라인 입력 */}
                <tr className={styles.newLineRow}>
              <td>
                <input
                  ref={monthInputRef}
                  type="text"
                  value={currentLine.month}
                  onChange={(e) => handleCurrentLineChange('month', e.target.value)}
                  className={styles.input}
                  placeholder="월"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={currentLine.day}
                  onChange={(e) => handleCurrentLineChange('day', e.target.value)}
                  className={styles.input}
                  placeholder="일"
                />
              </td>
              <td>
                <select
                  value={currentLine.voucherType}
                  onChange={(e) => handleCurrentLineChange('voucherType', e.target.value)}
                  className={styles.input}
                >
                  {voucherTypeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={currentLine.debitCredit}
                  onChange={(e) => handleCurrentLineChange('debitCredit', e.target.value)}
                  className={styles.input}
                >
                  <option value="차변">차변</option>
                  <option value="대변">대변</option>
                </select>
              </td>
              <SearchInput
                items={accounts}
                codeValue={currentLine.accountCode}
                nameValue={currentLine.accountName}
                onChange={handleAccountChange}
                onOpenModal={() => setShowAccountModal(true)}
                codeField="account_code"
                nameField="account_name"
                idField="account_id"
                outputCodeField="accountCode"
                outputNameField="accountName"
                outputIdField="accountId"
              />
              <SearchInput
                items={clients}
                codeValue={currentLine.clientCode}
                nameValue={currentLine.clientName}
                onChange={handleClientChange}
                onOpenModal={() => setShowClientModal(true)}
                codeField="client_code"
                nameField="client_name"
                idField="client_id"
                outputCodeField="clientCode"
                outputNameField="clientName"
                outputIdField="clientId"
                namePlaceholder="거래처 (F2)"
              />
              <td>
                <input
                  type="text"
                  value={formatBusinessNumber(currentLine.clientBusinessNo)}
                  readOnly
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={formatAmount(currentLine.debitAmount)}
                  onChange={(e) => handleCurrentLineChange('debitAmount', e.target.value.replace(/,/g, ''))}
                  className={styles.input}
                  placeholder="차변"
                  disabled={currentLine.debitCredit === '대변'}
                  style={currentLine.debitCredit === '대변' ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={formatAmount(currentLine.creditAmount)}
                  onChange={(e) => handleCurrentLineChange('creditAmount', e.target.value.replace(/,/g, ''))}
                  className={styles.input}
                  placeholder="대변"
                  disabled={currentLine.debitCredit === '차변'}
                  style={currentLine.debitCredit === '차변' ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={currentLine.taxInvoiceYn ? '전자' : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleCurrentLineChange('taxInvoiceYn', value === '1' || value === '전자');
                  }}
                  className={styles.input}
                  placeholder="1"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={currentLine.descriptionCode}
                  onChange={(e) => handleCurrentLineChange('descriptionCode', e.target.value)}
                  className={styles.input}
                  placeholder="적요코드"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={currentLine.description}
                  onChange={(e) => handleCurrentLineChange('description', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'description')}
                  className={styles.input}
                  placeholder="적요"
                />
              </td>
              <td>
                <button
                  className={styles.addButton}
                  onClick={handleAddLine}
                >
                  추가
                </button>
              </td>
            </tr>
            </>
          </tbody>
        </table>
      </div>

      {/* 액션 버튼 - 수정 모드가 아닐 때만 */}
      {!editingVoucherId && tempLines.length > 0 && (
        <div className={styles.actionButtons}>
          <button
            className={styles.cancelButton}
            onClick={handleCancelTempLines}
          >
            취소
          </button>
          <button
            className={styles.saveVoucherButton}
            onClick={handleSaveVoucher}
            disabled={!totals.balanced}
          >
            전표 저장
          </button>
        </div>
      )}

      {showAccountModal && (
        <AccountSearchModal
          onSelect={handleAccountSelect}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {showClientModal && (
        <ClientSearchModal
          onSelect={handleClientSelect}
          onClose={() => setShowClientModal(false)}
        />
      )}
    </>
  );
}

export default SalesPurchaseTable;
