import { useState, useEffect, useRef } from 'react';
import { createVoucherWithLines, updateVoucherWithLines, deleteVoucherLine, getVoucherLinesByDate } from '../../api/voucherApi';
import { getAccountsByCompany } from '../../api/accountApi';
import { getClientsByCompany } from '../../api/clientApi';
import AccountSearchModal from './AccountSearchModal';
import ClientSearchModal from './ClientSearchModal';
import SearchInput from '../../components/SearchInput';
import styles from './VoucherTable.module.css';

function VoucherTable({ searchDates }) {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [lines, setLines] = useState([]);

  // 임시 라인들 (아직 DB에 저장 안 된 상태)
  const [tempLines, setTempLines] = useState([]);

  // 현재 입력 중인 라인
  const [currentLine, setCurrentLine] = useState({
    month: '',
    day: '',
    voucherType: '3',
    accountCode: '',
    accountName: '',
    accountId: null,
    clientCode: '',
    clientName: '',
    clientId: null,
    amount: '',
    descriptionCode: '',
    description: ''
  });

  // 수정 모드 - 전표 ID로 관리
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [editFormData, setEditFormData] = useState([]);

  // 모달 상태
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  const monthInputRef = useRef(null);

  const voucherTypeOptions = [
    { value: '3', label: '차변' },
    { value: '4', label: '대변' },
    { value: '5', label: '결차' },
    { value: '6', label: '결대' }
  ];

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
      const response = await getVoucherLinesByDate(
        user.companyId,
        searchDates.startDate,
        searchDates.endDate
      );
      setLines(response.lines || []);
    } catch (error) {
      console.error('전표 조회 실패:', error);
      setLines([]);
    }
  };

  // 차대변 합계 계산
  const calculateTotals = () => {
    let debit = 0;
    let credit = 0;

    tempLines.forEach(line => {
      const amount = parseFloat(line.amount) || 0;
      if (['3', '5'].includes(line.voucherType)) {
        // 차변(3), 결차(5) -> 차변
        debit += amount;
      } else {
        // 대변(4), 결대(6) -> 대변
        credit += amount;
      }
    });

    // 현재 입력 중인 라인도 포함
    if (currentLine.amount) {
      const amount = parseFloat(currentLine.amount) || 0;
      if (['3', '5'].includes(currentLine.voucherType)) {
        // 차변(3), 결차(5) -> 차변
        debit += amount;
      } else {
        // 대변(4), 결대(6) -> 대변
        credit += amount;
      }
    }

    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 };
  };

  const totals = calculateTotals();

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
    setCurrentLine(prev => ({
      ...prev,
      clientId: clientData.clientId,
      clientCode: clientData.clientCode || '',
      clientName: clientData.clientName || ''
    }));
  };

  // 현재 라인 입력 변경
  const handleCurrentLineChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      const numValue = value.replace(/,/g, '');
      setCurrentLine(prev => ({ ...prev, [name]: numValue }));
      return;
    }

    setCurrentLine(prev => ({ ...prev, [name]: value }));
  };

  // 라인 추가 (임시 저장)
  const handleAddLine = async () => {
    if (!currentLine.accountCode || !currentLine.accountId) {
      alert('계정과목을 선택해주세요');
      return;
    }

    if (!currentLine.amount || parseFloat(currentLine.amount) === 0) {
      alert('금액을 입력해주세요');
      return;
    }

    // 현재 라인을 임시로 추가
    const newTempLines = [...tempLines, { ...currentLine }];
    console.log('[추가 버튼 클릭]');
    console.log('newTempLines:', newTempLines);

    // 새로운 라인을 포함한 차대변 계산
    let debit = 0;
    let credit = 0;
    newTempLines.forEach(line => {
      const amount = parseFloat(line.amount) || 0;
      if (['3', '5'].includes(line.voucherType)) {
        // 차변(3), 결차(5) -> 차변
        debit += amount;
      } else {
        // 대변(4), 결대(6) -> 대변
        credit += amount;
      }
    });

    const balanced = Math.abs(debit - credit) < 0.01;
    console.log('차대변 계산:', { debit, credit, balanced });

    // 차대변이 일치해야 저장
    if (balanced && newTempLines.length > 0) {
      console.log('[자동 저장 시작]');
      try {
        const user = JSON.parse(localStorage.getItem('user'));

        // 회계기수 정보에서 연도 가져오기 (UTC 타임존 변환 없이 직접 추출)
        const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo'));
        if (!fiscalPeriodInfo) {
          alert('회계기수 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }
        const year = parseInt(fiscalPeriodInfo.startDate.substring(0, 4));

        const voucherData = {
          companyId: user.companyId,
          voucherDate: `${year}-${String(currentLine.month).padStart(2, '0')}-${String(currentLine.day).padStart(2, '0')}`,
          voucherNo: null,
          lines: newTempLines.map(line => ({
            voucherType: line.voucherType,
            accountId: line.accountId,
            clientId: line.clientId,
            clientName: line.clientName || null,
            amount: parseFloat(line.amount),
            descriptionCode: line.descriptionCode || null,
            description: line.description || null
          }))
        };

        if (editingVoucherId) {
          await updateVoucherWithLines(editingVoucherId, voucherData);
          alert('전표가 수정되었습니다');
          setEditingVoucherId(null);
        } else {
          await createVoucherWithLines(voucherData);
          alert('전표가 저장되었습니다');
        }

        // 초기화
        setTempLines([]);
        setCurrentLine({
          month: currentLine.month,
          day: currentLine.day,
          voucherType: '3',
          accountCode: '',
          accountName: '',
          accountId: null,
          clientCode: '',
          clientName: '',
          clientId: null,
          amount: '',
          descriptionCode: '',
          description: ''
        });

        // 전표 목록 새로고침
        if (searchDates.startDate && searchDates.endDate) {
          await fetchVouchers();
        }

        // 월 입력칸으로 포커스 이동
        setTimeout(() => {
          if (monthInputRef.current) {
            monthInputRef.current.focus();
          }
        }, 0);

      } catch (error) {
        console.error('자동 저장 실패:', error);
        console.error('에러 상세:', error.response?.data);
        alert(error.response?.data?.error || '저장 실패');
      }
    } else {
      // 차대변이 일치하지 않으면 임시 저장만
      setTempLines(newTempLines);

      // 현재 라인 초기화 (월/일은 유지)
      setCurrentLine({
        month: currentLine.month,
        day: currentLine.day,
        voucherType: '3',
        accountCode: '',
        accountName: '',
        accountId: null,
        clientCode: '',
        clientName: '',
        clientId: null,
        amount: '',
        descriptionCode: '',
        description: ''
      });

      // 월 입력칸으로 포커스 이동
      setTimeout(() => {
        if (monthInputRef.current) {
          monthInputRef.current.focus();
        }
      }, 0);
    }
  };

  // 임시 라인 삭제
  const handleRemoveTempLine = (index) => {
    setTempLines(prev => prev.filter((_, i) => i !== index));
  };

  // 임시 라인 수정
  const handleUpdateTempLine = (index, field, value) => {
    setTempLines(prev => {
      const updated = [...prev];

      if (field === 'amount') {
        const numValue = value.replace(/,/g, '');
        updated[index] = { ...updated[index], [field]: numValue };
      } else if (field === 'accountCode') {
        const account = accounts.find(a => a.account_code === value);
        if (account) {
          updated[index] = {
            ...updated[index],
            accountCode: value,
            accountName: account.account_name,
            accountId: account.account_id
          };
        } else {
          updated[index] = { ...updated[index], accountCode: value };
        }
      } else if (field === 'clientCode') {
        const client = clients.find(c => c.client_code === value);
        if (client) {
          updated[index] = {
            ...updated[index],
            clientCode: value,
            clientName: client.client_name,
            clientId: client.client_id
          };
        } else {
          updated[index] = { ...updated[index], clientCode: value };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }

      return updated;
    });
  };

  // 전표 저장 (여러 라인 한 번에)
  const handleSaveVoucher = async () => {
    if (tempLines.length === 0) {
      alert('저장할 라인이 없습니다');
      return;
    }

    if (!totals.balanced) {
      alert('차대변 합계가 일치하지 않습니다');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));

      // 회계기수 정보에서 연도 가져오기
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo'));

      if (!fiscalPeriodInfo) {
        alert('회계기수 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        return;
      }

      // UTC 타임존 변환 없이 문자열에서 직접 연도 추출
      const year = parseInt(fiscalPeriodInfo.startDate.substring(0, 4));
      const month = tempLines[0].month || new Date().getMonth() + 1;
      const day = tempLines[0].day || new Date().getDate();
      const voucherDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const voucherData = {
        companyId: user.companyId,
        voucherDate,
        voucherNo: null, // 항상 자동 생성
        description: '',
        lines: tempLines.map(line => ({
          voucherType: line.voucherType,
          amount: parseFloat(line.amount),
          descriptionCode: line.descriptionCode || null,
          accountId: line.accountId,
          clientId: line.clientId || null,
          description: line.description || ''
        }))
      };

      console.log('전송할 데이터:', JSON.stringify(voucherData, null, 2));
      console.log('tempLines:', tempLines);

      const response = await createVoucherWithLines(voucherData);
      alert('전표가 저장되었습니다');

      // 초기화
      setTempLines([]);
      setCurrentLine({
        month: '',
        day: '',
        voucherType: '3',
        accountCode: '',
        accountName: '',
        accountId: null,
        clientCode: '',
        clientName: '',
        clientId: null,
        amount: '',
        descriptionCode: '',
        description: ''
      });

      // 전표 목록 새로고침 (검색 날짜가 설정되어 있을 때만)
      if (searchDates.startDate && searchDates.endDate) {
        await fetchVouchers();
      }

    } catch (error) {
      console.error('전표 저장 실패:', error);
      console.error('에러 상세:', error.response?.data);
      alert(error.response?.data?.error || error.message || '저장 실패');
    }
  };

  // 전표 수정 모드 진입
  const handleEditVoucher = (voucherNo) => {
    const voucherLines = lines.filter(line => line.voucher_no === voucherNo);
    if (voucherLines.length === 0) return;

    setEditingVoucherId(voucherLines[0].voucher_id);

    const mappedLines = voucherLines.map(line => ({
      line_id: line.line_id,
      voucher_date: line.voucher_date,
      month: new Date(line.voucher_date).getMonth() + 1,
      day: new Date(line.voucher_date).getDate(),
      voucherType: line.voucher_type,
      accountCode: line.account_code,
      accountName: line.account_name,
      accountId: line.account_id,
      clientCode: line.client_code || '',
      clientName: line.client_name || '',
      clientId: line.client_id || null,
      debitAmount: line.debit_amount || 0,
      creditAmount: line.credit_amount || 0,
      descriptionCode: line.description_code || '',
      description: line.description || ''
    }));

    setEditFormData(mappedLines);
  };

  // 수정 중인 라인 데이터 업데이트
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
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        clientId: clientData.clientId,
        clientCode: clientData.clientCode || '',
        clientName: clientData.clientName || ''
      };
      return newData;
    });
  };

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

    // 마지막 라인의 차대변을 확인하여 반대쪽으로 추가
    const lastLine = editFormData[editFormData.length - 1];
    const lastVoucherType = lastLine.voucherType;
    const isLastDebit = ['3', '5'].includes(lastVoucherType); // 차변(3), 결차(5)

    // 반대편 전표유형 결정
    let newVoucherType;
    if (isLastDebit) {
      newVoucherType = '4'; // 대변(4)
    } else {
      newVoucherType = '3'; // 차변(3)
    }

    const newLine = {
      line_id: null,
      voucher_date: firstLine.voucher_date,
      month: firstLine.month,
      day: firstLine.day,
      voucherType: newVoucherType,
      accountCode: '',
      accountName: '',
      accountId: null,
      clientCode: '',
      clientName: '',
      clientId: null,
      debitAmount: newVoucherType === '3' || newVoucherType === '5' ? 0 : 0,
      creditAmount: newVoucherType === '4' || newVoucherType === '6' ? 0 : 0,
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

      const voucherData = {
        companyId: user.companyId,
        voucherDate,
        voucherNo: null,
        lines: editFormData.map(line => ({
          voucherType: line.voucherType,
          accountId: line.accountId,
          clientId: line.clientId,
          clientName: line.clientName || null,
          amount: parseFloat(['3', '5'].includes(line.voucherType) ? line.debitAmount : line.creditAmount),
          descriptionCode: line.descriptionCode || null,
          description: line.description || null
        }))
      };

      await updateVoucherWithLines(editingVoucherId, voucherData);
      alert('전표가 수정되었습니다');

      setEditingVoucherId(null);
      setEditFormData([]);

      // 전표 목록 새로고침 (검색 날짜가 설정되어 있을 때만)
      if (searchDates.startDate && searchDates.endDate) {
        await fetchVouchers();
      }
    } catch (error) {
      alert(error.response?.data?.error || '수정 실패');
    }
  };

  // 수정 모드 취소
  const handleCancelEdit = () => {
    setEditingVoucherId(null);
    setEditFormData([]);
  };

  // 전표 전체 삭제
  const handleDeleteVoucher = async (voucherNo) => {
    if (!window.confirm(`전표번호 ${voucherNo}의 모든 라인을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const voucherLines = lines.filter(line => line.voucher_no === voucherNo);

      for (const line of voucherLines) {
        await deleteVoucherLine(line.line_id, user.companyId);
      }

      alert('전표가 삭제되었습니다');

      // 전표 목록 새로고침 (검색 날짜가 설정되어 있을 때만)
      if (searchDates.startDate && searchDates.endDate) {
        await fetchVouchers();
      }
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
      clientName: client.client_name
    }));
    setShowClientModal(false);
  };

  const getVoucherTypeLabel = (type) => {
    const option = voucherTypeOptions.find(o => o.value === type);
    return option ? option.label : type;
  };

  const isDebitType = (type) => ['3', '5'].includes(type); // 차변(3), 결차(5)

  const formatAmount = (value) => {
    if (!value || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  // 날짜 + 전표번호별로 그룹화
  const groupedLines = lines.reduce((acc, line) => {
    const key = `${line.voucher_date}_${line.voucher_no}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(line);
    return acc;
  }, {});

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>월</th>
            <th>일</th>
            <th>구분</th>
            <th>전표번호</th>
            <th>계정코드</th>
            <th>계정과목</th>
            <th>거래처코드</th>
            <th>거래처</th>
            <th>차변</th>
            <th>대변</th>
            <th>적요코드</th>
            <th>적요</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {/* 저장된 전표 라인들 */}
          {Object.entries(groupedLines).flatMap(([voucherKey, voucherLines]) => {
            // voucherKey는 "날짜_전표번호" 형식이므로 실제 전표번호만 추출
            const fullVoucherNo = voucherLines[0]?.voucher_no || voucherKey.split('_')[1];
            // YYYYMMDD-001 형식에서 001만 추출 (하이픈이 있으면 뒷부분만, 없으면 그대로)
            const displayVoucherNo = fullVoucherNo.includes('-')
              ? fullVoucherNo.split('-')[1]
              : fullVoucherNo;
            return [
            // 전표번호 헤더
            <tr key={`voucher-${voucherKey}-header`} className={styles.voucherHeader}>
              <td colSpan="13">
                <div className={styles.voucherHeaderContent}>
                  <span>전표번호: {displayVoucherNo}</span>
                  <div className={styles.voucherActions}>
                    {editingVoucherId === voucherLines[0].voucher_id ? (
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
                          onClick={() => handleEditVoucher(fullVoucherNo)}
                        >
                          수정
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteVoucher(fullVoucherNo)}
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </td>
            </tr>,
            // 전표 라인들
            ...voucherLines.map((line, lineIdx) => {
              const lineDisplayNo = line.voucher_no && line.voucher_no.includes('-')
                ? line.voucher_no.split('-')[1]
                : (line.voucher_no || '');

              const isEditing = editingVoucherId === line.voucher_id;
              const editLine = isEditing ? editFormData[lineIdx] : null;

              return (
              <tr key={line.line_id} className={isEditing ? styles.editingLine : ''}>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLine.month}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'month', e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    new Date(line.voucher_date).getMonth() + 1
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLine.day}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'day', e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    new Date(line.voucher_date).getDate()
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      value={editLine.voucherType}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'voucherType', e.target.value)}
                      className={styles.input}
                    >
                      {voucherTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    getVoucherTypeLabel(line.voucher_type)
                  )}
                </td>
                <td>{lineDisplayNo}</td>
                {isEditing ? (
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
                ) : (
                  <>
                    <td>{line.account_code}</td>
                    <td>{line.account_name}</td>
                  </>
                )}
                {isEditing ? (
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
                ) : (
                  <>
                    <td>{line.client_code || '-'}</td>
                    <td>{line.client_name || '-'}</td>
                  </>
                )}
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formatAmount(editLine.debitAmount)}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'debitAmount', e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    line.debit_amount > 0 ? Math.round(line.debit_amount).toLocaleString('ko-KR') : ''
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formatAmount(editLine.creditAmount)}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'creditAmount', e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    line.credit_amount > 0 ? Math.round(line.credit_amount).toLocaleString('ko-KR') : ''
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLine.descriptionCode}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'descriptionCode', e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    line.description_code || '-'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLine.description}
                      onChange={(e) => handleUpdateEditLine(lineIdx, 'description', e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    line.description
                  )}
                </td>
                <td>
                  {isEditing && (
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleRemoveEditLine(lineIdx)}
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
              );
            }),
            // 수정 모드일 때 라인 추가 버튼
            editingVoucherId === voucherLines[0].voucher_id && (
              <tr key={`voucher-${voucherKey}-add`} className={styles.addLineRow}>
                <td colSpan="13" style={{ textAlign: 'center', padding: '8px' }}>
                  <button
                    className={styles.addButton}
                    onClick={handleAddEditLine}
                  >
                    + 라인 추가
                  </button>
                </td>
              </tr>
            )
          ].filter(Boolean);
          })}

          {/* 구분선 */}
          {lines.length > 0 && tempLines.length > 0 && !editingVoucherId && (
            <tr className={styles.separator}>
              <td colSpan="13"></td>
            </tr>
          )}

          {/* 임시 라인들 (새 전표 입력용) - 수정 모드가 아닐 때만 표시 */}
          {!editingVoucherId && tempLines.map((line, index) => (
            <tr key={`temp-${index}`} className={styles.tempLine}>
              <td>{line.month}</td>
              <td>{line.day}</td>
              <td>
                <select
                  value={line.voucherType}
                  onChange={(e) => handleUpdateTempLine(index, 'voucherType', e.target.value)}
                  className={styles.input}
                >
                  {voucherTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>(임시)</td>
              <td>
                <input
                  type="text"
                  value={line.accountCode}
                  onChange={(e) => handleUpdateTempLine(index, 'accountCode', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={line.accountName}
                  onChange={(e) => handleUpdateTempLine(index, 'accountName', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={line.clientCode || ''}
                  onChange={(e) => handleUpdateTempLine(index, 'clientCode', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={line.clientName || ''}
                  onChange={(e) => handleUpdateTempLine(index, 'clientName', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={isDebitType(line.voucherType) ? formatAmount(line.amount) : ''}
                  onChange={(e) => handleUpdateTempLine(index, 'amount', e.target.value)}
                  disabled={!isDebitType(line.voucherType)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={!isDebitType(line.voucherType) ? formatAmount(line.amount) : ''}
                  onChange={(e) => handleUpdateTempLine(index, 'amount', e.target.value)}
                  disabled={isDebitType(line.voucherType)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={line.descriptionCode || ''}
                  onChange={(e) => handleUpdateTempLine(index, 'descriptionCode', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={line.description || ''}
                  onChange={(e) => handleUpdateTempLine(index, 'description', e.target.value)}
                  className={styles.input}
                />
              </td>
              <td>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleRemoveTempLine(index)}
                >
                  제거
                </button>
              </td>
            </tr>
          ))}

          {/* 차대변 합계 표시 - 수정 모드가 아닐 때만 */}
          {!editingVoucherId && (
            <tr>
              <td colSpan="13" style={{ padding: 0 }}>
                <div className={styles.totalsSection}>
                  <div>차변 합계: <strong>{formatAmount(totals.debit)}</strong></div>
                  <div>대변 합계: <strong>{formatAmount(totals.credit)}</strong></div>
                  <div className={totals.balanced ? styles.balanced : styles.unbalanced}>
                    {totals.balanced ? '✓ 차대변 일치' : '✗ 차대변 불일치'}
                  </div>
                </div>
              </td>
            </tr>
          )}

          {/* 새 라인 입력 - 수정 모드가 아닐 때만 */}
          {!editingVoucherId && (
            <tr className={styles.newLineRow}>
            <td>
              <input
                ref={monthInputRef}
                type="text"
                name="month"
                value={currentLine.month}
                onChange={handleCurrentLineChange}
                className={styles.input}
                placeholder="월"
              />
            </td>
            <td>
              <input
                type="text"
                name="day"
                value={currentLine.day}
                onChange={handleCurrentLineChange}
                className={styles.input}
                placeholder="일"
              />
            </td>
            <td>
              <select
                name="voucherType"
                value={currentLine.voucherType}
                onChange={handleCurrentLineChange}
                className={styles.input}
              >
                {voucherTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </td>
            <td>-</td>
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
              namePlaceholder="거래처명 (F2)"
            />
            <td>
              <input
                type="text"
                name="amount"
                value={isDebitType(currentLine.voucherType) ? formatAmount(currentLine.amount) : ''}
                onChange={handleCurrentLineChange}
                disabled={!isDebitType(currentLine.voucherType)}
                className={styles.input}
              />
            </td>
            <td>
              <input
                type="text"
                name="amount"
                value={!isDebitType(currentLine.voucherType) ? formatAmount(currentLine.amount) : ''}
                onChange={handleCurrentLineChange}
                disabled={isDebitType(currentLine.voucherType)}
                className={styles.input}
              />
            </td>
            <td>
              <input
                type="text"
                name="descriptionCode"
                value={currentLine.descriptionCode}
                onChange={handleCurrentLineChange}
                className={styles.input}
              />
            </td>
            <td>
              <input
                type="text"
                name="description"
                value={currentLine.description}
                onChange={handleCurrentLineChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLine();
                  }
                }}
                className={styles.input}
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
          )}
        </tbody>
      </table>

      {/* 전표 저장 버튼 - 수정 모드가 아닐 때만 표시 */}
      {!editingVoucherId && (
        <div className={styles.actionButtons}>
          <button
            className={styles.saveVoucherButton}
            onClick={handleSaveVoucher}
            disabled={!totals.balanced || tempLines.length === 0}
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
    </div>
  );
}

export default VoucherTable;
