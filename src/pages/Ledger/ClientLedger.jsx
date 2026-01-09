import React, { useState, useEffect, useRef } from 'react';
import AccountSearchModal from '../Voucher/AccountSearchModal';
import ClientSearchModal from '../Voucher/ClientSearchModal';
import styles from './ClientLedger.module.css';

function ClientLedger() {
  const [filters, setFilters] = useState({
    startMonth: '',
    startDay: '',
    endMonth: '',
    endDay: '',
    accountCode: '',
    accountName: '',
    startClientCode: '',
    endClientCode: ''
  });

  const [clientSummary, setClientSummary] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [accountSuggestions, setAccountSuggestions] = useState([]);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'detail'
  const [fiscalYearDisplay, setFiscalYearDisplay] = useState('');

  const accountCodeRef = useRef(null);
  const clientCodeRef = useRef(null);

  // 사업자번호 포맷팅 함수
  const formatBusinessNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return number;
  };

  // 금액 포맷팅 함수
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('ko-KR');
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
    }
  };

  const fetchClients = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:8000/api/clients?companyId=${user.companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (error) {
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
    // 계정코드 필수 체크
    if (!filters.accountCode) {
      alert('계정코드를 입력해주세요');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
      const fiscalYear = fiscalPeriodInfo.fiscalYear || null;

      // 날짜 처리 로직
      let startMonth = filters.startMonth;
      let startDay = filters.startDay;
      let endMonth = filters.endMonth;
      let endDay = filters.endDay;

      // 월만 입력된 경우
      if (startMonth && !startDay && !endMonth && !endDay) {
        startDay = '1';
        endMonth = startMonth;
        endDay = '31';
      }

      // 거래처코드 처리
      const startClientCode = filters.startClientCode || '00001';
      const endClientCode = filters.endClientCode || '99999';

      const queryParams = new URLSearchParams({
        companyId: user.companyId,
        startMonth: startMonth,
        startDay: startDay,
        endMonth: endMonth,
        endDay: endDay,
        accountCode: filters.accountCode,
        startClientCode: startClientCode,
        endClientCode: endClientCode
      });

      // fiscalYear가 있으면 추가
      if (fiscalYear) {
        queryParams.append('fiscalYear', fiscalYear);
      }

      const response = await fetch(`http://localhost:8000/api/ledger/client?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setClientSummary(data.summary || []);
        setActiveTab('list'); // 검색 시 목록 탭으로 이동
        setSelectedClient(null); // 선택 초기화
        setLedgerData([]); // 상세 데이터 초기화
      }
    } catch (error) {
      alert('거래처별 원장 조회에 실패했습니다');
      setClientSummary([]);
    }
  };

  const fetchLedgerDetail = async (clientId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
      const fiscalYear = fiscalPeriodInfo.fiscalYear || null;

      // 날짜 처리 로직
      let startMonth = filters.startMonth;
      let startDay = filters.startDay;
      let endMonth = filters.endMonth;
      let endDay = filters.endDay;

      // 월만 입력된 경우
      if (startMonth && !startDay && !endMonth && !endDay) {
        startDay = '1';
        endMonth = startMonth;
        endDay = '31';
      }

      const queryParams = new URLSearchParams({
        companyId: user.companyId,
        startMonth: startMonth,
        startDay: startDay,
        endMonth: endMonth,
        endDay: endDay,
        accountCode: filters.accountCode,
        clientId: clientId
      });

      // fiscalYear가 있으면 추가
      if (fiscalYear) {
        queryParams.append('fiscalYear', fiscalYear);
      }

      const response = await fetch(`http://localhost:8000/api/ledger/client/detail?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setLedgerData(data.ledger || []);
      }
    } catch (error) {
      alert('거래처별 원장 상세 조회에 실패했습니다');
      setLedgerData([]);
    }
  };

  const handleClientSelect = async (client) => {
    setSelectedClient(client);
    setActiveTab('detail');
    await fetchLedgerDetail(client.client_id);
  };

  const handlePreviousClient = () => {
    if (!selectedClient) return;
    const currentIndex = clientSummary.findIndex(c => c.client_id === selectedClient.client_id);
    if (currentIndex > 0) {
      handleClientSelect(clientSummary[currentIndex - 1]);
    }
  };

  const handleNextClient = () => {
    if (!selectedClient) return;
    const currentIndex = clientSummary.findIndex(c => c.client_id === selectedClient.client_id);
    if (currentIndex < clientSummary.length - 1) {
      handleClientSelect(clientSummary[currentIndex + 1]);
    }
  };

  const handleAccountCodeChange = (value) => {
    setFilters(prev => ({ ...prev, accountCode: value }));

    if (value) {
      const filtered = accounts.filter(acc =>
        acc.account_code.startsWith(value)
      );
      setAccountSuggestions(filtered);
      setShowAccountSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);

      // 3자리 입력 시 정확히 일치하는 계정이 있으면 자동 선택
      if (value.length === 3) {
        const exactMatch = accounts.find(acc => acc.account_code === value);
        if (exactMatch) {
          handleSelectAccountSuggestion(exactMatch);
        }
      }
    } else {
      setShowAccountSuggestions(false);
      setAccountSuggestions([]);
      setFilters(prev => ({ ...prev, accountName: '' }));
    }
  };

  const handleSelectAccountSuggestion = (account) => {
    setFilters(prev => ({
      ...prev,
      accountCode: account.account_code,
      accountName: account.account_name
    }));
    setShowAccountSuggestions(false);
    setAccountSuggestions([]);
  };

  const handleAccountKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setShowAccountModal(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showAccountSuggestions && accountSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev =>
          prev < accountSuggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showAccountSuggestions && accountSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showAccountSuggestions && selectedSuggestionIndex >= 0 && accountSuggestions[selectedSuggestionIndex]) {
        handleSelectAccountSuggestion(accountSuggestions[selectedSuggestionIndex]);
      }
    }
  };

  const handleStartClientCodeChange = (value) => {
    setFilters(prev => ({ ...prev, startClientCode: value }));

    if (value) {
      const filtered = clients.filter(client =>
        client.client_code.startsWith(value)
      );
      setClientSuggestions(filtered);
      setShowClientSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowClientSuggestions(false);
      setClientSuggestions([]);
    }
  };

  const handleEndClientCodeChange = (value) => {
    setFilters(prev => ({ ...prev, endClientCode: value }));
  };

  const handleSelectClientSuggestion = (client, isStart = true) => {
    if (isStart) {
      setFilters(prev => ({
        ...prev,
        startClientCode: client.client_code
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        endClientCode: client.client_code
      }));
    }
    setShowClientSuggestions(false);
    setClientSuggestions([]);
  };

  // 전표 구분 표시
  const getVoucherTypeLabel = (voucherType) => {
    if (voucherType === 'general') return '일반';
    if (voucherType === '매출') return '매출';
    if (voucherType === '매입') return '매입';
    return voucherType;
  };

  const handleStartClientKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setShowClientModal(true);
      setClientModalTarget('start');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showClientSuggestions && clientSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev =>
          prev < clientSuggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showClientSuggestions && clientSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showClientSuggestions && selectedSuggestionIndex >= 0 && clientSuggestions[selectedSuggestionIndex]) {
        handleSelectClientSuggestion(clientSuggestions[selectedSuggestionIndex], true);
      }
    }
  };

  const handleEndClientKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setShowClientModal(true);
      setClientModalTarget('end');
    }
  };

  const handleAccountModalSelect = (account) => {
    setFilters(prev => ({
      ...prev,
      accountCode: account.account_code,
      accountName: account.account_name
    }));
    setShowAccountModal(false);
  };

  const handleClientModalSelect = (client) => {
    if (clientModalTarget === 'start') {
      setFilters(prev => ({
        ...prev,
        startClientCode: client.client_code
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        endClientCode: client.client_code
      }));
    }
    setShowClientModal(false);
    setClientModalTarget(null);
  };

  return (
    <div className={styles.container}>
      {/* 검색 필터 */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h2>거래처별 원장</h2>
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
                onChange={(e) => setFilters(prev => ({ ...prev, startMonth: e.target.value }))}
                maxLength="2"
              />
              <input
                type="text"
                placeholder="일"
                value={filters.startDay}
                onChange={(e) => setFilters(prev => ({ ...prev, startDay: e.target.value }))}
                maxLength="2"
              />
              <span>부터</span>
              <input
                type="text"
                placeholder="월"
                value={filters.endMonth}
                onChange={(e) => setFilters(prev => ({ ...prev, endMonth: e.target.value }))}
                maxLength="2"
              />
              <input
                type="text"
                placeholder="일"
                value={filters.endDay}
                onChange={(e) => setFilters(prev => ({ ...prev, endDay: e.target.value }))}
                maxLength="2"
              />
              <span>까지</span>
            </div>
          </div>

          <div className={styles.filterGroup} style={{ position: 'relative' }}>
            <label>계정코드</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={accountCodeRef}
                type="text"
                value={filters.accountCode}
                onChange={(e) => handleAccountCodeChange(e.target.value)}
                onKeyDown={handleAccountKeyDown}
                onBlur={() => {
                  setTimeout(() => setShowAccountSuggestions(false), 200);
                }}
                placeholder="F2"
                maxLength="5"
              />
              {showAccountSuggestions && accountSuggestions.length > 0 && (
                <div className={styles.autocompleteDropdown}>
                  {accountSuggestions.map((acc, idx) => (
                    <div
                      key={acc.account_id}
                      className={`${styles.autocompleteItem} ${idx === selectedSuggestionIndex ? styles.selected : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectAccountSuggestion(acc);
                      }}
                    >
                      {acc.account_code} - {acc.account_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>계정과목명</label>
            <input
              type="text"
              value={filters.accountName}
              readOnly
              style={{ width: '150px', backgroundColor: '#f8f9fa' }}
            />
          </div>

          <div className={styles.filterGroup} style={{ position: 'relative' }}>
            <label>거래처코드</label>
            <div className={styles.accountCodeInputs}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={filters.startClientCode}
                  onChange={(e) => handleStartClientCodeChange(e.target.value)}
                  onKeyDown={handleStartClientKeyDown}
                  onBlur={() => {
                    setTimeout(() => setShowClientSuggestions(false), 200);
                  }}
                  placeholder="처음(F2)"
                  maxLength="5"
                />
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div className={styles.autocompleteDropdown}>
                    {clientSuggestions.map((client, idx) => (
                      <div
                        key={client.client_id}
                        className={`${styles.autocompleteItem} ${idx === selectedSuggestionIndex ? styles.selected : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectClientSuggestion(client, true);
                        }}
                      >
                        {client.client_code} - {client.client_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span>~</span>
              <input
                type="text"
                value={filters.endClientCode}
                onChange={(e) => handleEndClientCodeChange(e.target.value)}
                onKeyDown={handleEndClientKeyDown}
                placeholder="끝(F2)"
                maxLength="5"
              />
            </div>
          </div>

          <button onClick={handleSearch} className={styles.searchButton}>
            조회
          </button>
        </div>
      </div>

      {/* 탭 영역 */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('list')}
        >
          목록
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'detail' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('detail')}
          disabled={!selectedClient}
        >
          상세
        </button>
      </div>

      {/* 목록 탭 */}
      {activeTab === 'list' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>거래처코드</th>
                <th>거래처명</th>
                <th>전기이월</th>
                <th>차변</th>
                <th>대변</th>
                <th>잔액</th>
                <th>거래처사업자번호</th>
              </tr>
            </thead>
            <tbody>
              {clientSummary.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.noData}>
                    조회된 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                clientSummary.map((client) => (
                  <tr
                    key={client.client_id}
                    onClick={() => handleClientSelect(client)}
                    className={styles.clickableRow}
                  >
                    <td>{client.client_code}</td>
                    <td>{client.client_name}</td>
                    <td className={styles.amount}>{formatAmount(client.previous_balance)}</td>
                    <td className={styles.amount}>{formatAmount(client.debit_total)}</td>
                    <td className={styles.amount}>{formatAmount(client.credit_total)}</td>
                    <td className={styles.amount}>{formatAmount(client.balance)}</td>
                    <td>{formatBusinessNumber(client.business_number) || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 탭 */}
      {activeTab === 'detail' && selectedClient && (
        <div className={styles.detailSection}>
          <div className={styles.detailHeader}>
            <h3>{selectedClient.client_code} - {selectedClient.client_name}</h3>
            <div className={styles.navigationButtons}>
              <button
                onClick={handlePreviousClient}
                disabled={clientSummary.findIndex(c => c.client_id === selectedClient.client_id) === 0}
                className={styles.navButton}
              >
                이전 거래처
              </button>
              <button
                onClick={handleNextClient}
                disabled={clientSummary.findIndex(c => c.client_id === selectedClient.client_id) === clientSummary.length - 1}
                className={styles.navButton}
              >
                다음 거래처
              </button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>월</th>
                  <th>일</th>
                  <th>전표유형</th>
                  <th>전표번호</th>
                  <th>차변</th>
                  <th>대변</th>
                  <th>잔액</th>
                  <th>적요</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.noData}>
                      조회된 데이터가 없습니다
                    </td>
                  </tr>
                ) : (
                  ledgerData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.month}</td>
                      <td>{item.day}</td>
                      <td>{getVoucherTypeLabel(item.voucher_type)}</td>
                      <td>{item.voucher_no}</td>
                      <td className={styles.amount}>{formatAmount(item.debit_amount)}</td>
                      <td className={styles.amount}>{formatAmount(item.credit_amount)}</td>
                      <td className={styles.amount}>{formatAmount(item.balance)}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 계정과목 검색 모달 */}
      {showAccountModal && (
        <AccountSearchModal
          onClose={() => setShowAccountModal(false)}
          onSelect={handleAccountModalSelect}
        />
      )}

      {/* 거래처 검색 모달 */}
      {showClientModal && (
        <ClientSearchModal
          onClose={() => setShowClientModal(false)}
          onSelect={handleClientModalSelect}
        />
      )}
    </div>
  );
}

export default ClientLedger;
