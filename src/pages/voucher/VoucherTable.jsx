import { useState, useEffect, useRef } from 'react';
import { createVoucherWithLines, updateVoucherWithLines, deleteVoucherLine } from '../../api/voucherApi';
import { getAccountsByCompany } from '../../api/accountApi';
import { getClientsByCompany } from '../../api/clientApi';
import AccountSearchModal from './AccountSearchModal';
import ClientSearchModal from './ClientSearchModal';
import styles from './VoucherTable.module.css';

function VoucherTable({ lines, onLineUpdate }) {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);

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

  // 수정 모드
  const [editMode, setEditMode] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState(null);

  // 모달 상태
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // 계정과목 자동완성
  const [accountSuggestions, setAccountSuggestions] = useState([]);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const accountInputRef = useRef(null);
  const accountNameInputRef = useRef(null);
  const [suggestionType, setSuggestionType] = useState('code'); // 'code' or 'name'
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

  // 계정코드 입력 변경 (자동완성 - 코드만)
  const handleAccountCodeChange = (value) => {
    setCurrentLine(prev => ({ ...prev, accountCode: value, accountName: '', accountId: null }));
    setSuggestionType('code');

    if (value) {
      // 계정코드로만 필터링
      const filtered = accounts.filter(a => a.account_code.startsWith(value));

      // 정확히 일치하는 항목이 있으면 자동 선택
      const exactMatch = accounts.find(a => a.account_code === value);
      if (exactMatch) {
        setCurrentLine(prev => ({
          ...prev,
          accountId: exactMatch.account_id,
          accountCode: exactMatch.account_code,
          accountName: exactMatch.account_name
        }));
        setShowAccountSuggestions(false);
        setAccountSuggestions([]);
      } else {
        setAccountSuggestions(filtered);
        setShowAccountSuggestions(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      setAccountSuggestions([]);
      setShowAccountSuggestions(false);
    }
  };

  // 계정과목명 입력 변경 (자동완성 - 과목명만)
  const handleAccountNameChange = (value) => {
    setCurrentLine(prev => ({ ...prev, accountName: value, accountCode: '', accountId: null }));
    setSuggestionType('name');

    if (value) {
      // 계정과목명으로만 필터링
      const filtered = accounts.filter(a => a.account_name.includes(value));

      // 정확히 일치하는 항목이 있으면 자동 선택
      const exactMatch = accounts.find(a => a.account_name === value);
      if (exactMatch) {
        setCurrentLine(prev => ({
          ...prev,
          accountId: exactMatch.account_id,
          accountCode: exactMatch.account_code,
          accountName: exactMatch.account_name
        }));
        setShowAccountSuggestions(false);
        setAccountSuggestions([]);
      } else {
        setAccountSuggestions(filtered);
        setShowAccountSuggestions(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      setAccountSuggestions([]);
      setShowAccountSuggestions(false);
    }
  };

  // 계정과목 자동완성 선택
  const handleSelectAccountSuggestion = (account) => {
    setCurrentLine(prev => ({
      ...prev,
      accountId: account.account_id,
      accountCode: account.account_code,
      accountName: account.account_name
    }));
    setShowAccountSuggestions(false);
    setAccountSuggestions([]);
  };

  // 방향키로 자동완성 항목 선택 (계정코드용)
  const handleAccountKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setShowAccountModal(true);
      return;
    }

    if (!showAccountSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex < accountSuggestions.length - 1 ? selectedSuggestionIndex + 1 : selectedSuggestionIndex;
      setSelectedSuggestionIndex(newIndex);
      // 화살표로 이동하면 즉시 계정과목명 표시
      if (newIndex >= 0 && accountSuggestions[newIndex]) {
        setCurrentLine(prev => ({
          ...prev,
          accountId: accountSuggestions[newIndex].account_id,
          accountCode: accountSuggestions[newIndex].account_code,
          accountName: accountSuggestions[newIndex].account_name
        }));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : 0;
      setSelectedSuggestionIndex(newIndex);
      // 화살표로 이동하면 즉시 계정과목명 표시
      if (newIndex >= 0 && accountSuggestions[newIndex]) {
        setCurrentLine(prev => ({
          ...prev,
          accountId: accountSuggestions[newIndex].account_id,
          accountCode: accountSuggestions[newIndex].account_code,
          accountName: accountSuggestions[newIndex].account_name
        }));
      }
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectAccountSuggestion(accountSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowAccountSuggestions(false);
    }
  };

  // 방향키로 자동완성 항목 선택 (계정과목명용)
  const handleAccountNameKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setShowAccountModal(true);
      return;
    }

    if (!showAccountSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex < accountSuggestions.length - 1 ? selectedSuggestionIndex + 1 : selectedSuggestionIndex;
      setSelectedSuggestionIndex(newIndex);
      // 화살표로 이동하면 즉시 계정코드 표시
      if (newIndex >= 0 && accountSuggestions[newIndex]) {
        setCurrentLine(prev => ({
          ...prev,
          accountId: accountSuggestions[newIndex].account_id,
          accountCode: accountSuggestions[newIndex].account_code,
          accountName: accountSuggestions[newIndex].account_name
        }));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : 0;
      setSelectedSuggestionIndex(newIndex);
      // 화살표로 이동하면 즉시 계정코드 표시
      if (newIndex >= 0 && accountSuggestions[newIndex]) {
        setCurrentLine(prev => ({
          ...prev,
          accountId: accountSuggestions[newIndex].account_id,
          accountCode: accountSuggestions[newIndex].account_code,
          accountName: accountSuggestions[newIndex].account_name
        }));
      }
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectAccountSuggestion(accountSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowAccountSuggestions(false);
    }
  };

  // 현재 라인 입력 변경
  const handleCurrentLineChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      const numValue = value.replace(/,/g, '');
      setCurrentLine(prev => ({ ...prev, [name]: numValue }));
      return;
    }

    if (name === 'clientCode') {
      const client = clients.find(c => c.client_code === value);
      if (client) {
        setCurrentLine(prev => ({
          ...prev,
          clientCode: value,
          clientName: client.client_name,
          clientId: client.client_id
        }));
      } else {
        // 거래처코드가 없어도 입력값은 유지
        setCurrentLine(prev => ({
          ...prev,
          clientCode: value
          // clientName과 clientId는 그대로 유지
        }));
      }
    } else if (name === 'clientName') {
      // 거래처명 직접 입력 가능 (거래처코드 없이도 저장 가능)
      setCurrentLine(prev => ({
        ...prev,
        clientName: value
      }));
    } else {
      setCurrentLine(prev => ({ ...prev, [name]: value }));
    }
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

    // 차대변이 일치해야 저장
    if (balanced && newTempLines.length > 0) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const year = new Date().getFullYear();

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

        if (editMode) {
          await updateVoucherWithLines(editingVoucherId, voucherData);
          alert('전표가 수정되었습니다');
          setEditMode(false);
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

        onLineUpdate();

        // 월 입력칸으로 포커스 이동
        setTimeout(() => {
          if (monthInputRef.current) {
            monthInputRef.current.focus();
          }
        }, 0);

      } catch (error) {
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
      const year = new Date().getFullYear();
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

      if (editMode && editingVoucherId) {
        await updateVoucherWithLines(editingVoucherId, voucherData);
        alert('전표가 수정되었습니다');
      } else {
        await createVoucherWithLines(voucherData);
        alert('전표가 저장되었습니다');
      }

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
      setEditMode(false);
      setEditingVoucherId(null);

      onLineUpdate();

    } catch (error) {
      alert(error.response?.data?.error || '저장 실패');
    }
  };

  // 전표 수정 모드 진입
  const handleEditVoucher = (voucherNo) => {
    const voucherLines = lines.filter(line => line.voucher_no === voucherNo);
    if (voucherLines.length === 0) return;

    setEditMode(true);
    setEditingVoucherId(voucherLines[0].voucher_id);
    setTempLines(voucherLines.map(line => ({
      month: new Date(line.voucher_date).getMonth() + 1,
      day: new Date(line.voucher_date).getDate(),
      voucherType: line.voucher_type,
      accountCode: line.account_code,
      accountName: line.account_name,
      accountId: line.account_id,
      clientCode: line.client_code || '',
      clientName: line.client_name || '',
      clientId: line.client_id || null,
      amount: String(line.amount),
      descriptionCode: line.description_code || '',
      description: line.description || ''
    })));
  };

  // 수정 모드 취소
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingVoucherId(null);
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

      onLineUpdate();
      alert('전표가 삭제되었습니다');
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

  const handleKeyDown = (e, field) => {
    if (e.key === 'F2') {
      e.preventDefault();
      if (field === 'client') {
        setShowClientModal(true);
      }
    }
  };

  const getVoucherTypeLabel = (type) => {
    const option = voucherTypeOptions.find(o => o.value === type);
    return option ? option.label : type;
  };

  const isDebitType = (type) => ['3', '5'].includes(type); // 차변(3), 결차(5)

  const formatAmount = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('ko-KR');
  };

  // 전표번호별로 그룹화
  const groupedLines = lines.reduce((acc, line) => {
    if (!acc[line.voucher_no]) {
      acc[line.voucher_no] = [];
    }
    acc[line.voucher_no].push(line);
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
          {Object.entries(groupedLines).flatMap(([voucherNo, voucherLines]) => [
            // 전표번호 헤더
            <tr key={`voucher-${voucherNo}-header`} className={styles.voucherHeader}>
              <td colSpan="13">
                <div className={styles.voucherHeaderContent}>
                  <span>전표번호: {voucherNo}</span>
                  <div className={styles.voucherActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditVoucher(voucherNo)}
                    >
                      수정
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteVoucher(voucherNo)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </td>
            </tr>,
            // 전표 라인들
            ...voucherLines.map(line => (
              <tr key={line.line_id}>
                <td>{new Date(line.voucher_date).getMonth() + 1}</td>
                <td>{new Date(line.voucher_date).getDate()}</td>
                <td>{getVoucherTypeLabel(line.voucher_type)}</td>
                <td>{line.voucher_no}</td>
                <td>{line.account_code}</td>
                <td>{line.account_name}</td>
                <td>{line.client_code || '-'}</td>
                <td>{line.client_name || '-'}</td>
                <td>{line.debit_amount > 0 ? Math.round(line.debit_amount).toLocaleString('ko-KR') : ''}</td>
                <td>{line.credit_amount > 0 ? Math.round(line.credit_amount).toLocaleString('ko-KR') : ''}</td>
                <td>{line.description_code || '-'}</td>
                <td>{line.description}</td>
                <td></td>
              </tr>
            ))
          ])}

          {/* 구분선 */}
          {lines.length > 0 && tempLines.length > 0 && (
            <tr className={styles.separator}>
              <td colSpan="13"></td>
            </tr>
          )}

          {/* 임시 라인들 (수정 가능) */}
          {tempLines.map((line, index) => (
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

          {/* 차대변 합계 표시 */}
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

          {/* 새 라인 입력 */}
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
            <td style={{ position: 'relative' }}>
              <input
                ref={accountInputRef}
                type="text"
                name="accountCode"
                value={currentLine.accountCode}
                onChange={(e) => handleAccountCodeChange(e.target.value)}
                onKeyDown={handleAccountKeyDown}
                className={styles.input}
                placeholder="F2"
              />
              {showAccountSuggestions && suggestionType === 'code' && (
                <div className={styles.autocompleteDropdown}>
                  {accountSuggestions.map((account, index) => (
                    <div
                      key={account.account_id}
                      className={`${styles.autocompleteItem} ${index === selectedSuggestionIndex ? styles.selected : ''}`}
                      onClick={() => handleSelectAccountSuggestion(account)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      {account.account_code}
                    </div>
                  ))}
                </div>
              )}
            </td>
            <td style={{ position: 'relative' }}>
              <input
                ref={accountNameInputRef}
                type="text"
                name="accountName"
                value={currentLine.accountName}
                onChange={(e) => handleAccountNameChange(e.target.value)}
                onKeyDown={handleAccountNameKeyDown}
                className={styles.input}
                placeholder="F2"
              />
              {showAccountSuggestions && suggestionType === 'name' && (
                <div className={styles.autocompleteDropdown}>
                  {accountSuggestions.map((account, index) => (
                    <div
                      key={account.account_id}
                      className={`${styles.autocompleteItem} ${index === selectedSuggestionIndex ? styles.selected : ''}`}
                      onClick={() => handleSelectAccountSuggestion(account)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      {account.account_name}
                    </div>
                  ))}
                </div>
              )}
            </td>
            <td>
              <input
                type="text"
                name="clientCode"
                value={currentLine.clientCode}
                onChange={handleCurrentLineChange}
                onKeyDown={(e) => handleKeyDown(e, 'client')}
                className={styles.input}
                placeholder="F2"
              />
            </td>
            <td>
              <input
                type="text"
                name="clientName"
                value={currentLine.clientName}
                onChange={handleCurrentLineChange}
                onKeyDown={(e) => handleKeyDown(e, 'client')}
                className={styles.input}
                placeholder="거래처명 (F2)"
              />
            </td>
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
        </tbody>
      </table>

      {/* 전표 저장/수정 버튼 */}
      <div className={styles.actionButtons}>
        {editMode && (
          <button
            className={styles.cancelButton}
            onClick={handleCancelEdit}
          >
            수정 취소
          </button>
        )}
        <button
          className={styles.saveVoucherButton}
          onClick={handleSaveVoucher}
          disabled={!totals.balanced || tempLines.length === 0}
        >
          {editMode ? '전표 수정 저장' : '전표 저장'}
        </button>
      </div>

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
