import React, { useState, useEffect, useRef } from 'react';
import { getAccountLedger, getAccountSummary, updateVoucherLine, addVoucherLine, deleteVoucherLine } from '../../api/ledgerApi';
import { deleteVoucher as deleteSalesPurchaseVoucher } from '../../api/salesPurchaseApi';
import { deleteVoucher as deleteGeneralVoucher } from '../../api/voucherApi';
import { getClientsByCompany } from '../../api/clientApi';
import AccountSearchModal from '../Voucher/AccountSearchModal';
import ClientSearchModal from '../Voucher/ClientSearchModal';
import SearchInput from '../../components/SearchInput';
import styles from './AccountLedger.module.css';

function AccountLedger() {
  const [filters, setFilters] = useState({
    startMonth: '',
    startDay: '',
    endMonth: '',
    endDay: '',
    startAccountCode: '',
    endAccountCode: ''
  });

  const [accountSummary, setAccountSummary] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [expandedVouchers, setExpandedVouchers] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [accountModalTarget, setAccountModalTarget] = useState(null);
  const [clientModalTarget, setClientModalTarget] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [editFormData, setEditFormData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const inputRefs = useRef({});
  const [fiscalYearDisplay, setFiscalYearDisplay] = useState('');

  // 자동완성 관련 상태
  const [showAccountSuggestions, setShowAccountSuggestions] = useState({});
  const [accountSuggestions, setAccountSuggestions] = useState({});
  const [showClientSuggestions, setShowClientSuggestions] = useState({});
  const [clientSuggestions, setClientSuggestions] = useState({});
  const [suggestionType, setSuggestionType] = useState({});
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({});

  const fetchAccountSummary = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
      const fiscalYear = fiscalPeriodInfo.fiscalYear || null;

      const response = await getAccountSummary(user.companyId, { ...filters, fiscalYear });
      setAccountSummary(response.summary || []);
    } catch (error) {
      console.error('계정 요약 조회 실패:', error);
      alert('계정 요약 조회에 실패했습니다');
      setAccountSummary([]);
    }
  };

  const fetchLedger = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
      const fiscalYear = fiscalPeriodInfo.fiscalYear || null;

      const response = await getAccountLedger(user.companyId, { ...filters, fiscalYear });
      setLedgerData(response.ledger || []);
      setExpandedVouchers([]);
    } catch (error) {
      console.error('원장 조회 실패:', error);
      alert('원장 조회에 실패했습니다');
      setLedgerData([]);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/accounts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('계정과목 조회 실패:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await getClientsByCompany(user.companyId);
      setClients(response.clients || []);
    } catch (error) {
      console.error('거래처 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchClients();

    // localStorage에서 회계기수 정보 가져오기
    const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
    if (fiscalPeriodInfo.startDate) {
      const startYear = new Date(fiscalPeriodInfo.startDate).getFullYear();
      setFiscalYearDisplay(startYear);
    }
  }, []);

  const handleSearch = async () => {
    await fetchAccountSummary();
    if (selectedAccount) {
      await fetchLedger();
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccountClick = (account) => {
    // 수정 중이면 취소
    if (editingVoucher) {
      handleCancelEdit();
    }

    setSelectedAccount(account);
  };

  // 계정 선택 시 원장 조회
  useEffect(() => {
    if (selectedAccount) {
      fetchLedger();
    }
  }, [selectedAccount]);

  // 컴포넌트 언마운트 시 수정모드 취소
  useEffect(() => {
    return () => {
      if (editingVoucher) {
        setEditingVoucher(null);
        setEditFormData([]);
      }
    };
  }, []);

  const handleToggleVoucher = (voucherKey) => {
    setExpandedVouchers(prev => {
      if (prev.includes(voucherKey)) {
        // 상세보기를 닫을 때 해당 전표의 수정모드도 취소
        if (editingVoucher === voucherKey) {
          handleCancelEdit();
        }
        return prev.filter(key => key !== voucherKey);
      } else {
        return [...prev, voucherKey];
      }
    });
  };

  const handleStartEdit = (voucher) => {
    const voucherKey = `${voucher.voucher_id}-${voucher.voucher_type}`;

    console.log('handleStartEdit - voucher:', voucher);
    console.log('handleStartEdit - voucher.lines:', voucher.lines);

    // 상세보기가 닫혀있으면 열기
    if (!expandedVouchers.includes(voucherKey)) {
      setExpandedVouchers(prev => [...prev, voucherKey]);
    }

    setEditingVoucher(voucherKey);
    const formData = voucher.lines.map(line => ({
      line_no: line.line_no,
      account_code: line.account_code,
      account_name: line.account_name,
      client_code: line.client_code || '',
      client_name: line.client_name || '',
      debit_credit: line.debit_credit,
      amount: line.amount,
      description_code: line.description_code || '',
      description: line.description || '',
      isNew: false,
      isDeleted: false,
      originalLineNo: line.line_no
    }));

    console.log('handleStartEdit - formData:', formData);
    setEditFormData(formData);
  };

  const handleCancelEdit = () => {
    setEditingVoucher(null);
    setEditFormData([]);
  };

  const handleSaveEdit = async (voucherId, voucherType) => {
    try {
      // 차변과 대변 합계 검증
      const totalDebit = editFormData
        .filter(line => !line.isDeleted)
        .reduce((sum, line) => {
          return sum + (line.debit_credit === '차변' ? Number(line.amount) : 0);
        }, 0);

      const totalCredit = editFormData
        .filter(line => !line.isDeleted)
        .reduce((sum, line) => {
          return sum + (line.debit_credit === '대변' ? Number(line.amount) : 0);
        }, 0);

      if (totalDebit !== totalCredit) {
        alert(`차변 합계(${totalDebit.toLocaleString()})와 대변 합계(${totalCredit.toLocaleString()})가 일치하지 않습니다.`);
        return;
      }

      // 1. 삭제된 라인 처리
      const deletedLines = editFormData.filter(line => line.isDeleted && !line.isNew);
      for (const lineData of deletedLines) {
        await deleteVoucherLine(voucherType, voucherId, lineData.originalLineNo);
      }

      // 2. 새로 추가된 라인 처리
      const newLines = editFormData.filter(line => line.isNew && !line.isDeleted);
      for (const lineData of newLines) {
        await addVoucherLine(voucherType, voucherId, {
          line_no: lineData.line_no,
          account_code: lineData.account_code,
          client_code: lineData.client_code || null,
          debit_credit: lineData.debit_credit,
          amount: lineData.amount,
          description_code: lineData.description_code,
          description: lineData.description
        });
      }

      // 3. 기존 라인 업데이트
      const updatedLines = editFormData.filter(line => !line.isNew && !line.isDeleted);
      console.log('handleSaveEdit - updatedLines:', updatedLines);
      for (const lineData of updatedLines) {
        const updateData = {
          account_code: lineData.account_code,
          client_code: lineData.client_code || null,
          debit_credit: lineData.debit_credit,
          amount: lineData.amount,
          description_code: lineData.description_code,
          description: lineData.description
        };
        console.log('handleSaveEdit - updating line:', lineData.originalLineNo, updateData);
        await updateVoucherLine(voucherType, voucherId, lineData.originalLineNo, updateData);
      }

      alert('전표가 수정되었습니다.');
      handleCancelEdit();

      // 원장 다시 조회
      await fetchLedger();
      await fetchAccountSummary();
    } catch (error) {
      console.error('전표 수정 실패:', error);
      alert('전표 수정에 실패했습니다.');
    }
  };

  const handleEditFormChange = (lineIndex, field, value) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        [field]: value
      };
      return newData;
    });
  };

  // SearchInput을 위한 계정 변경 핸들러
  const handleEditAccountChange = (lineIndex, accountData) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        account_code: accountData.account_code || '',
        account_name: accountData.account_name || ''
      };
      return newData;
    });
  };

  // SearchInput을 위한 거래처 변경 핸들러
  const handleEditClientChange = (lineIndex, clientData) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        client_code: clientData.client_code || '',
        client_name: clientData.client_name || ''
      };
      return newData;
    });
  };

  const calculateDropdownPosition = (inputElement, key) => {
    if (!inputElement) return;
    const rect = inputElement.getBoundingClientRect();
    setDropdownPosition(prev => ({
      ...prev,
      [key]: {
        top: rect.bottom,
        left: rect.left
      }
    }));
  };

  const handleAccountCodeChange = (lineIndex, value) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        account_code: value,
        account_name: ''
      };
      return newData;
    });
    setSuggestionType(prev => ({ ...prev, [lineIndex]: 'code' }));

    if (value) {
      const filtered = accounts.filter(a => a.account_code.includes(value));
      const exactMatch = accounts.find(a => a.account_code === value);

      if (exactMatch) {
        setEditFormData(prev => {
          const newData = [...prev];
          newData[lineIndex] = {
            ...newData[lineIndex],
            account_code: exactMatch.account_code,
            account_name: exactMatch.account_name
          };
          return newData;
        });
        setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: false }));
        setAccountSuggestions(prev => ({ ...prev, [lineIndex]: [] }));
      } else {
        setAccountSuggestions(prev => ({ ...prev, [lineIndex]: filtered }));
        setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: filtered.length > 0 }));
        setSelectedSuggestionIndex(prev => ({ ...prev, [lineIndex]: -1 }));
      }
    } else {
      setAccountSuggestions(prev => ({ ...prev, [lineIndex]: [] }));
      setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: false }));
    }
  };

  const handleAccountNameChange = (lineIndex, value) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        account_name: value,
        account_code: ''
      };
      return newData;
    });
    setSuggestionType(prev => ({ ...prev, [lineIndex]: 'name' }));

    if (value) {
      const filtered = accounts.filter(a => a.account_name.includes(value));
      const exactMatch = accounts.find(a => a.account_name === value);

      if (exactMatch) {
        setEditFormData(prev => {
          const newData = [...prev];
          newData[lineIndex] = {
            ...newData[lineIndex],
            account_code: exactMatch.account_code,
            account_name: exactMatch.account_name
          };
          return newData;
        });
        setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: false }));
        setAccountSuggestions(prev => ({ ...prev, [lineIndex]: [] }));
      } else {
        setAccountSuggestions(prev => ({ ...prev, [lineIndex]: filtered }));
        setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: filtered.length > 0 }));
        setSelectedSuggestionIndex(prev => ({ ...prev, [lineIndex]: -1 }));
      }
    } else {
      setAccountSuggestions(prev => ({ ...prev, [lineIndex]: [] }));
      setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: false }));
    }
  };

  const handleSelectAccountSuggestion = (lineIndex, account) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        account_code: account.account_code,
        account_name: account.account_name
      };
      return newData;
    });
    setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: false }));
    setAccountSuggestions(prev => ({ ...prev, [lineIndex]: [] }));
  };

  const handleAccountKeyDown = (e, lineIndex) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setAccountModalTarget(lineIndex);
      setShowAccountModal(true);
      return;
    }

    if (!showAccountSuggestions[lineIndex]) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = selectedSuggestionIndex[lineIndex] ?? -1;
      const suggestions = accountSuggestions[lineIndex] || [];
      const newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : currentIndex;
      setSelectedSuggestionIndex(prev => ({ ...prev, [lineIndex]: newIndex }));
      if (newIndex >= 0 && suggestions[newIndex]) {
        setEditFormData(prev => {
          const newData = [...prev];
          newData[lineIndex] = {
            ...newData[lineIndex],
            account_code: suggestions[newIndex].account_code,
            account_name: suggestions[newIndex].account_name
          };
          return newData;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = selectedSuggestionIndex[lineIndex] ?? -1;
      const suggestions = accountSuggestions[lineIndex] || [];
      const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      setSelectedSuggestionIndex(prev => ({ ...prev, [lineIndex]: newIndex }));
      if (newIndex >= 0 && suggestions[newIndex]) {
        setEditFormData(prev => {
          const newData = [...prev];
          newData[lineIndex] = {
            ...newData[lineIndex],
            account_code: suggestions[newIndex].account_code,
            account_name: suggestions[newIndex].account_name
          };
          return newData;
        });
      }
    } else if (e.key === 'Enter' && (selectedSuggestionIndex[lineIndex] ?? -1) >= 0) {
      e.preventDefault();
      const suggestions = accountSuggestions[lineIndex] || [];
      handleSelectAccountSuggestion(lineIndex, suggestions[selectedSuggestionIndex[lineIndex]]);
    } else if (e.key === 'Escape') {
      setShowAccountSuggestions(prev => ({ ...prev, [lineIndex]: false }));
    }
  };

  const handleClientCodeChange = (lineIndex, value) => {
    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        client_code: value
      };
      return newData;
    });

    if (value) {
      const filtered = clients.filter(c => c.client_code.includes(value));
      const exactMatch = clients.find(c => c.client_code === value);
      if (exactMatch) {
        setEditFormData(prev => {
          const newData = [...prev];
          newData[lineIndex] = {
            ...newData[lineIndex],
            client_code: value,
            client_name: exactMatch.client_name
          };
          return newData;
        });
        setShowClientSuggestions(prev => ({ ...prev, [lineIndex]: false }));
      } else {
        setClientSuggestions(prev => ({ ...prev, [lineIndex]: filtered }));
        setShowClientSuggestions(prev => ({ ...prev, [lineIndex]: filtered.length > 0 }));
      }
    } else {
      setShowClientSuggestions(prev => ({ ...prev, [lineIndex]: false }));
    }
  };

  const handleClientKeyDown = (e, lineIndex) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setClientModalTarget(lineIndex);
      setShowClientModal(true);
    }
  };

  const handleAmountChange = (lineIndex, debitCredit, value) => {
    // 숫자만 추출 (콤마 제거)
    const numericValue = value.replace(/[^0-9]/g, '');

    setEditFormData(prev => {
      const newData = [...prev];
      newData[lineIndex] = {
        ...newData[lineIndex],
        debit_credit: debitCredit,
        amount: numericValue
      };
      return newData;
    });
  };

  const handleAddLine = () => {
    setEditFormData(prev => {
      const maxLineNo = Math.max(...prev.map(line => line.line_no), 0);
      return [
        ...prev,
        {
          line_no: maxLineNo + 1,
          account_code: '',
          account_name: '',
          client_code: '',
          client_name: '',
          debit_credit: '차변',
          amount: 0,
          description_code: '',
          description: '',
          isNew: true
        }
      ];
    });
  };

  // 라인 삭제
  const handleDeleteLine = (lineIndex) => {
    const activeLines = editFormData.filter(line => !line.isDeleted);
    if (activeLines.length <= 2) {
      alert('최소 2개의 라인이 필요합니다.');
      return;
    }

    setEditFormData(prev => {
      const newData = [...prev];
      const line = newData[lineIndex];

      // 새로 추가된 라인이면 배열에서 제거, 기존 라인이면 삭제 플래그만 설정
      if (line.isNew) {
        return prev.filter((_, idx) => idx !== lineIndex);
      } else {
        newData[lineIndex] = {
          ...newData[lineIndex],
          isDeleted: true
        };
        return newData;
      }
    });
  };

  const formatAmountInput = (amount) => {
    if (!amount) return '';
    return Number(amount).toLocaleString();
  };

  const handleDeleteVoucher = async (voucherId, voucherType) => {
    if (!window.confirm('이 전표를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));

      if (voucherType === 'general') {
        await deleteGeneralVoucher(voucherId, user.companyId);
      } else {
        await deleteSalesPurchaseVoucher(voucherId);
      }

      alert('전표가 삭제되었습니다');
      await fetchLedger();
      await fetchAccountSummary();
    } catch (error) {
      console.error('전표 삭제 실패:', error);
      alert('전표 삭제에 실패했습니다');
    }
  };

  const formatAmount = (amount) => {
    return Number(amount).toLocaleString();
  };

  // 전표 구분 표시
  const getVoucherTypeLabel = (voucherType) => {
    if (voucherType === 'general') return '일반';
    if (voucherType === '매출') return '매출';
    if (voucherType === '매입') return '매입';
    return voucherType;
  };

  // F2 키 핸들러 (필터용)
  const handleFilterAccountKeyDown = (e, target) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setAccountModalTarget(target);
      setShowAccountModal(true);
    }
  };

  const handleAccountSelect = (account) => {
    if (accountModalTarget === 'start') {
      handleFilterChange('startAccountCode', account.account_code);
    } else if (accountModalTarget === 'end') {
      handleFilterChange('endAccountCode', account.account_code);
    } else if (typeof accountModalTarget === 'number') {
      setEditFormData(prev => {
        const newData = [...prev];
        newData[accountModalTarget] = {
          ...newData[accountModalTarget],
          account_code: account.account_code,
          account_name: account.account_name
        };
        return newData;
      });
    }
    setShowAccountModal(false);
    setAccountModalTarget(null);
  };

  const handleClientSelect = (client) => {
    if (typeof clientModalTarget === 'number') {
      setEditFormData(prev => {
        const newData = [...prev];
        newData[clientModalTarget] = {
          ...newData[clientModalTarget],
          client_code: client.client_code,
          client_name: client.client_name
        };
        return newData;
      });
    }
    setShowClientModal(false);
    setClientModalTarget(null);
  };

  // 전표별로 그룹화
  const groupedLedger = ledgerData.reduce((acc, line) => {
    const key = `${line.voucher_id}-${line.voucher_type}`;
    if (!acc[key]) {
      acc[key] = {
        voucher_id: line.voucher_id,
        voucher_type: line.voucher_type,
        voucher_date: line.voucher_date,
        voucher_no: line.voucher_no,
        lines: []
      };
    }
    acc[key].lines.push(line);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      {/* 검색 필터 */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h2>계정별 원장</h2>
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>기간</label>
            <div className={styles.dateInputs}>
              <input
                type="text"
                value={fiscalYearDisplay}
                readOnly
                className={styles.yearDisplay}
                style={{ width: '60px', backgroundColor: '#f5f5f5', textAlign: 'center' }}
              />
              <span>년</span>
              <input
                type="text"
                placeholder="월"
                value={filters.startMonth}
                onChange={(e) => handleFilterChange('startMonth', e.target.value)}
                min="1"
                max="12"
              />
              <input
                type="text"
                placeholder="일"
                value={filters.startDay}
                onChange={(e) => handleFilterChange('startDay', e.target.value)}
                min="1"
                max="31"
              />
              <span>부터</span>
              <input
                type="text"
                placeholder="월"
                value={filters.endMonth}
                onChange={(e) => handleFilterChange('endMonth', e.target.value)}
                min="1"
                max="12"
              />
              <input
                type="text"
                placeholder="일"
                value={filters.endDay}
                onChange={(e) => handleFilterChange('endDay', e.target.value)}
                min="1"
                max="31"
              />
              <span>까지</span>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>계정코드</label>
            <div className={styles.accountCodeInputs}>
              <input
                type="text"
                placeholder="처음(F2)"
                value={filters.startAccountCode}
                onChange={(e) => handleFilterChange('startAccountCode', e.target.value)}
                onKeyDown={(e) => handleFilterAccountKeyDown(e, 'start')}
              />
              <span>~</span>
              <input
                type="text"
                placeholder="끝(F2)"
                value={filters.endAccountCode}
                onChange={(e) => handleFilterChange('endAccountCode', e.target.value)}
                onKeyDown={(e) => handleFilterAccountKeyDown(e, 'end')}
              />
            </div>
          </div>

          <button className={styles.searchButton} onClick={handleSearch}>
            조회
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* 사이드바: 계정 목록 */}
        <div className={styles.sidebar}>
          <h3>계정 목록</h3>
          <div className={styles.accountList}>
            {accountSummary.map(account => (
              <div
                key={account.account_id}
                className={`${styles.accountItem} ${selectedAccount?.account_id === account.account_id ? styles.selected : ''}`}
                onClick={() => handleAccountClick(account)}
              >
                <div className={styles.accountInfo}>
                  <span className={styles.accountCode}>{account.account_code}</span>
                  <span className={styles.accountName}>{account.account_name}</span>
                </div>
                <div className={styles.accountSummary}>
                  <div>전표: {account.voucher_count}건</div>
                  <div>차변: {formatAmount(account.total_debit)}</div>
                  <div>대변: {formatAmount(account.total_credit)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 메인: 원장 테이블 */}
        <div className={styles.main}>
          {selectedAccount ? (
            <>
              <div className={styles.ledgerHeader}>
                <h3>
                  {selectedAccount.account_code} - {selectedAccount.account_name}
                </h3>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{width: '90px'}}>전표일자</th>
                      <th style={{width: '60px'}}>번호</th>
                      <th style={{width: '50px'}}>구분</th>
                      <th style={{width: '70px'}}>계정코드</th>
                      <th style={{width: '120px'}}>계정과목</th>
                      <th style={{width: '70px'}}>거래처코드</th>
                      <th style={{width: '100px'}}>거래처명</th>
                      <th style={{width: '90px'}}>차변</th>
                      <th style={{width: '90px'}}>대변</th>
                      <th style={{width: '70px'}}>적요코드</th>
                      <th style={{width: '150px'}}>적요</th>
                      <th style={{width: '150px'}}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(groupedLedger).map(voucher => {
                      const voucherKey = `${voucher.voucher_id}-${voucher.voucher_type}`;
                      const isExpanded = expandedVouchers.includes(voucherKey);

                      // 선택된 계정과목의 라인들만 필터링
                      const selectedAccountLines = voucher.lines.filter(
                        line => line.account_id === selectedAccount.account_id
                      );

                      // 선택된 계정의 라인이 없으면 렌더링하지 않음
                      if (selectedAccountLines.length === 0) {
                        return null;
                      }

                      const displayLine = selectedAccountLines[0];

                      return (
                        <React.Fragment key={voucherKey}>
                          {/* 선택된 계정의 모든 라인들 */}
                          {selectedAccountLines.map((line, idx) => (
                            <tr
                              key={`${voucher.voucher_id}-main-${idx}`}
                              className={styles.voucherRow}
                              onClick={() => handleToggleVoucher(voucherKey)}
                            >
                              <td>{voucher.voucher_date.substring(0, 10)}</td>
                              <td>{voucher.voucher_type === 'carry_forward' ? '' : String(voucher.voucher_no).padStart(3, '0')}</td>
                              <td>{voucher.voucher_type === 'carry_forward' ? '이월' : getVoucherTypeLabel(voucher.voucher_type)}</td>
                              <td>{voucher.voucher_type === 'carry_forward' ? '' : line.account_code}</td>
                              <td>{voucher.voucher_type === 'carry_forward' ? '' : line.account_name}</td>
                              <td>{line.client_code || '-'}</td>
                              <td>{line.client_name || '-'}</td>
                              <td className={styles.amount}>
                                {line.debit_credit === '차변' ? formatAmount(line.amount) : '-'}
                              </td>
                              <td className={styles.amount}>
                                {line.debit_credit === '대변' ? formatAmount(line.amount) : '-'}
                              </td>
                              <td>{line.description_code || '-'}</td>
                              <td>{line.description || '-'}</td>
                              <td>
                                {idx === 0 && !editingVoucher && (
                                  <div className={styles.actionButtons}>
                                    <button
                                      className={styles.editButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEdit(voucher);
                                      }}
                                    >
                                      수정
                                    </button>
                                    <button
                                      className={styles.deleteButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteVoucher(voucher.voucher_id, voucher.voucher_type);
                                      }}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                                {idx === 0 && editingVoucher === voucherKey && (
                                  <div className={styles.actionButtons}>
                                    <button
                                      className={styles.saveButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveEdit(voucher.voucher_id, voucher.voucher_type);
                                      }}
                                    >
                                      저장
                                    </button>
                                    <button
                                      className={styles.cancelButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelEdit();
                                      }}
                                    >
                                      취소
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* 상세보기: 전체 전표 라인들 */}
                          {isExpanded && (() => {
                            const isVoucherEditing = editingVoucher === voucherKey;
                            const linesToDisplay = isVoucherEditing
                              ? editFormData.filter(line => !line.isDeleted)
                              : voucher.lines;

                            return linesToDisplay.map((line, idx) => {
                              // 편집 모드일 때는 editFormData의 실제 인덱스를 찾아야 함
                              const editLineIndex = isVoucherEditing
                                ? editFormData.findIndex(item =>
                                    !item.isDeleted &&
                                    (item.isNew ? item.line_no === line.line_no : item.originalLineNo === line.line_no)
                                  )
                                : -1;
                              const currentEditData = isVoucherEditing ? editFormData[editLineIndex] : null;

                              return (
                              <tr key={`${voucher.voucher_id}-detail-${idx}`} className={styles.detailLine}>
                                <td></td>
                                <td></td>
                                <td></td>
                                {isVoucherEditing ? (
                                  <SearchInput
                                    items={accounts}
                                    codeValue={currentEditData.account_code}
                                    nameValue={currentEditData.account_name}
                                    idValue={null}
                                    onChange={(accountData) => handleEditAccountChange(editLineIndex, accountData)}
                                    onOpenModal={() => setShowAccountModal(true)}
                                    codeField="account_code"
                                    nameField="account_name"
                                    idField="account_id"
                                  />
                                ) : (
                                  <>
                                    <td>{line.account_code}</td>
                                    <td>{line.account_name}</td>
                                  </>
                                )}
                                {isVoucherEditing ? (
                                  <SearchInput
                                    items={clients}
                                    codeValue={currentEditData.client_code || ''}
                                    nameValue={currentEditData.client_name || ''}
                                    idValue={null}
                                    onChange={(clientData) => handleEditClientChange(editLineIndex, clientData)}
                                    onOpenModal={() => setShowClientModal(true)}
                                    codeField="client_code"
                                    nameField="client_name"
                                    idField="client_id"
                                    namePlaceholder="거래처명 (F2)"
                                  />
                                ) : (
                                  <>
                                    <td>{line.client_code || '-'}</td>
                                    <td>{line.client_name || '-'}</td>
                                  </>
                                )}
                                <td className={styles.amount}>
                                  {isVoucherEditing ? (
                                    <input
                                      type="text"
                                      value={currentEditData.debit_credit === '차변' ? formatAmountInput(currentEditData.amount) : ''}
                                      onChange={(e) => handleAmountChange(editLineIndex, '차변', e.target.value)}
                                      className={styles.editInput}
                                      style={{width: '80px', textAlign: 'right'}}
                                    />
                                  ) : (
                                    line.debit_credit === '차변' ? formatAmount(line.amount) : '-'
                                  )}
                                </td>
                                <td className={styles.amount}>
                                  {isVoucherEditing ? (
                                    <input
                                      type="text"
                                      value={currentEditData.debit_credit === '대변' ? formatAmountInput(currentEditData.amount) : ''}
                                      onChange={(e) => handleAmountChange(editLineIndex, '대변', e.target.value)}
                                      className={styles.editInput}
                                      style={{width: '80px', textAlign: 'right'}}
                                    />
                                  ) : (
                                    line.debit_credit === '대변' ? formatAmount(line.amount) : '-'
                                  )}
                                </td>
                                <td>
                                  {isVoucherEditing ? (
                                    <input
                                      type="text"
                                      value={currentEditData.description_code}
                                      onChange={(e) => handleEditFormChange(editLineIndex, 'description_code', e.target.value)}
                                      className={styles.editInput}
                                      style={{width: '60px'}}
                                    />
                                  ) : (
                                    line.description_code || '-'
                                  )}
                                </td>
                                <td>
                                  {isVoucherEditing ? (
                                    <input
                                      type="text"
                                      value={currentEditData.description}
                                      onChange={(e) => handleEditFormChange(editLineIndex, 'description', e.target.value)}
                                      className={styles.editInput}
                                      style={{width: '140px'}}
                                    />
                                  ) : (
                                    line.description || '-'
                                  )}
                                </td>
                                <td>
                                  {isVoucherEditing && (
                                    <button
                                      className={styles.deleteLineButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLine(editLineIndex);
                                      }}
                                    >
                                      X
                                    </button>
                                  )}
                                </td>
                              </tr>
                              );
                            });
                          })()}

                          {/* 편집 모드일 때 라인 추가 버튼 */}
                          {isExpanded && editingVoucher === voucherKey && (
                            <tr className={styles.addLineRow}>
                              <td colSpan="12" style={{textAlign: 'center', padding: '12px'}}>
                                <button
                                  className={styles.addLineButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddLine();
                                  }}
                                >
                                  + 라인 추가
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>좌측에서 계정과목을 선택해주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 계정 검색 모달 */}
      {showAccountModal && (
        <AccountSearchModal
          onSelect={handleAccountSelect}
          onClose={() => {
            setShowAccountModal(false);
            setAccountModalTarget(null);
          }}
        />
      )}

      {/* 거래처 검색 모달 */}
      {showClientModal && (
        <ClientSearchModal
          onSelect={handleClientSelect}
          onClose={() => {
            setShowClientModal(false);
            setClientModalTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default AccountLedger;
