import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as salesPurchaseApi from '@/api/salesPurchaseApi';
import * as accountApi from '@/api/accountApi';
import AccountSearchModal from '../Voucher/AccountSearchModal';
import ClientSearchModal from '../Voucher/ClientSearchModal';
import Button from '../../components/Button';
import styles from './SalesPurchaseVoucher.module.css';

function SalesPurchaseVoucher() {
  const nav = useNavigate();

  const [currentCompany, setCurrentCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // 전표 기본 정보
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherType, setVoucherType] = useState('매출');
  const [selectedClient, setSelectedClient] = useState(null);
  const [taxInvoiceYn, setTaxInvoiceYn] = useState(false);
  const [taxInvoiceNo, setTaxInvoiceNo] = useState('');

  // 전표 라인
  const [lines, setLines] = useState([
    {
      debitCredit: '차변',
      accountId: null,
      accountCode: '',
      accountName: '',
      clientId: null,
      clientCode: '',
      clientName: '',
      supplyAmount: '',
      vatAmount: '',
      amount: '',
      description: ''
    }
  ]);

  // 모달
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState(null);

  // 회사 정보 가져오기
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const companyName = localStorage.getItem('currentCompanyName');

    if (!user || !user.companyId || !companyName) {
      alert('작업 중인 회사를 먼저 선택해주세요');
      nav('/mypage/company/manage');
      return;
    }

    setCurrentCompany({
      companyId: user.companyId,
      companyName: companyName
    });

    setUserRole(user.userType === 'BUSINESS' ? 'ADMIN' : 'ACCOUNTANT');
  }, [nav]);

  // 거래처 선택
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setShowClientModal(false);
  };

  // 계정과목 선택
  const handleAccountSelect = (account) => {
    const newLines = [...lines];
    newLines[editingLineIndex] = {
      ...newLines[editingLineIndex],
      accountId: account.account_id,
      accountCode: account.account_code,
      accountName: account.account_name
    };
    setLines(newLines);
    setShowAccountModal(false);
  };

  // 계정과목 검색 모달 열기
  const handleOpenAccountModal = (index) => {
    setEditingLineIndex(index);
    setShowAccountModal(true);
  };

  // 라인 추가
  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        debitCredit: '대변',
        accountId: null,
        accountCode: '',
        accountName: '',
        clientId: null,
        clientCode: '',
        clientName: '',
        supplyAmount: '',
        vatAmount: '',
        amount: '',
        description: ''
      }
    ]);
  };

  // 라인 삭제
  const handleRemoveLine = (index) => {
    if (lines.length === 1) {
      alert('최소 1개의 행은 있어야 합니다');
      return;
    }
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
  };

  // 라인 필드 변경
  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  // 공급가액 입력 시 부가세 자동 계산
  const handleSupplyAmountBlur = (index) => {
    const newLines = [...lines];
    const supplyAmount = parseFloat(newLines[index].supplyAmount) || 0;

    // 면세 또는 불공인 경우 부가세 0
    if (voucherType === '면세매출' || voucherType === '면세매입' || voucherType === '불공') {
      newLines[index].vatAmount = '0';
      newLines[index].amount = String(supplyAmount);
    } else {
      // 일반 매출/매입은 10% 부가세
      const vatAmount = Math.round(supplyAmount * 0.1);
      newLines[index].vatAmount = String(vatAmount);
      newLines[index].amount = String(supplyAmount + vatAmount);
    }

    setLines(newLines);
  };

  // 부가세 수동 변경 시 합계 재계산
  const handleVatAmountChange = (index, value) => {
    const newLines = [...lines];
    newLines[index].vatAmount = value;

    const supplyAmount = parseFloat(newLines[index].supplyAmount) || 0;
    const vatAmount = parseFloat(value) || 0;
    newLines[index].amount = String(supplyAmount + vatAmount);

    setLines(newLines);
  };

  // 저장
  const handleSubmit = async () => {
    // 유효성 검사
    if (!selectedClient) {
      alert('거래처를 선택해주세요');
      return;
    }

    if (!voucherDate) {
      alert('전표일자를 입력해주세요');
      return;
    }

    // 모든 라인에 계정과목이 있는지 확인
    const hasEmptyAccount = lines.some(line => !line.accountId);
    if (hasEmptyAccount) {
      alert('모든 행의 계정과목을 선택해주세요');
      return;
    }

    // 모든 라인에 금액이 있는지 확인
    const hasEmptyAmount = lines.some(line => !line.amount || parseFloat(line.amount) === 0);
    if (hasEmptyAmount) {
      alert('모든 행의 금액을 입력해주세요');
      return;
    }

    // 차대변 합계 검증
    const debitTotal = lines
      .filter(l => l.debitCredit === '차변')
      .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

    const creditTotal = lines
      .filter(l => l.debitCredit === '대변')
      .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

    if (Math.abs(debitTotal - creditTotal) > 0.01) {
      alert(`차변과 대변 합계가 일치하지 않습니다\n차변: ${debitTotal.toLocaleString()}원\n대변: ${creditTotal.toLocaleString()}원`);
      return;
    }

    try {
      // 전표 데이터 구성
      const totalSupplyAmount = lines.reduce((sum, l) => sum + parseFloat(l.supplyAmount || 0), 0);
      const totalVatAmount = lines.reduce((sum, l) => sum + parseFloat(l.vatAmount || 0), 0);
      const totalAmount = lines.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

      const voucherData = {
        companyId: currentCompany.companyId,
        voucherDate,
        voucherType,
        clientId: selectedClient.client_id,
        taxInvoiceYn,
        taxInvoiceNo: taxInvoiceNo || null,
        totalSupplyAmount,
        totalVatAmount,
        totalAmount,
        status: '확정'
      };

      const voucherLines = lines.map(line => ({
        debitCredit: line.debitCredit,
        accountId: line.accountId,
        clientId: line.clientId || selectedClient.client_id,
        amount: parseFloat(line.amount),
        description: line.description || null,
        descriptionCode: null,
        departmentCode: null,
        projectCode: null
      }));

      await salesPurchaseApi.createVoucher(voucherData, voucherLines);
      alert('매입매출 전표가 등록되었습니다');

      // 초기화
      setSelectedClient(null);
      setTaxInvoiceYn(false);
      setTaxInvoiceNo('');
      setLines([
        {
          debitCredit: '차변',
          accountId: null,
          accountCode: '',
          accountName: '',
          clientId: null,
          clientCode: '',
          clientName: '',
          supplyAmount: '',
          vatAmount: '',
          amount: '',
          description: ''
        }
      ]);

    } catch (error) {
      alert(error.response?.data?.error || '전표 등록 실패');
    }
  };

  // 합계 계산
  const calculateTotal = (debitCredit) => {
    return lines
      .filter(l => l.debitCredit === debitCredit)
      .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  };

  if (!currentCompany) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>매입매출 전표 입력</h1>
      </div>

      {/* 전표 기본 정보 */}
      <div className={styles.voucherInfo}>
        <div className={styles.infoRow}>
          <div className={styles.infoGroup}>
            <label className={styles.label}>전표일자</label>
            <input
              type="date"
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.infoGroup}>
            <label className={styles.label}>전표유형</label>
            <select
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value)}
              className={styles.select}
            >
              <option value="매출">매출</option>
              <option value="매입">매입</option>
              <option value="면세매출">면세매출</option>
              <option value="면세매입">면세매입</option>
              <option value="불공">불공</option>
            </select>
          </div>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoGroup}>
            <label className={styles.label}>거래처</label>
            <div className={styles.clientSelect}>
              <input
                type="text"
                value={selectedClient ? `[${selectedClient.client_code}] ${selectedClient.client_name}` : ''}
                readOnly
                placeholder="거래처를 선택하세요"
                className={styles.input}
              />
              <Button
                onClick={() => setShowClientModal(true)}
                variant="search"
              >
                검색
              </Button>
            </div>
          </div>

          <div className={styles.infoGroup}>
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={taxInvoiceYn}
                onChange={(e) => setTaxInvoiceYn(e.target.checked)}
              />
              {' '}전자세금계산서
            </label>
            {taxInvoiceYn && (
              <input
                type="text"
                value={taxInvoiceNo}
                onChange={(e) => setTaxInvoiceNo(e.target.value)}
                placeholder="세금계산서번호"
                className={styles.input}
              />
            )}
          </div>
        </div>
      </div>

      {/* 전표 라인 테이블 */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>차대구분</th>
              <th>계정과목코드</th>
              <th>계정과목</th>
              <th>공급가액</th>
              <th>부가세</th>
              <th>합계금액</th>
              <th>적요</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={line.debitCredit}
                    onChange={(e) => handleLineChange(index, 'debitCredit', e.target.value)}
                    className={styles.selectSmall}
                  >
                    <option value="차변">차변</option>
                    <option value="대변">대변</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={line.accountCode}
                    readOnly
                    onClick={() => handleOpenAccountModal(index)}
                    placeholder="검색"
                    className={styles.inputSmall}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={line.accountName}
                    readOnly
                    onClick={() => handleOpenAccountModal(index)}
                    placeholder="계정과목 선택"
                    className={styles.inputMedium}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={line.supplyAmount}
                    onChange={(e) => handleLineChange(index, 'supplyAmount', e.target.value)}
                    onBlur={() => handleSupplyAmountBlur(index)}
                    placeholder="0"
                    className={styles.inputSmall}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={line.vatAmount}
                    onChange={(e) => handleVatAmountChange(index, e.target.value)}
                    placeholder="0"
                    className={styles.inputSmall}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={line.amount}
                    readOnly
                    className={styles.inputSmall}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                    placeholder="적요"
                    className={styles.inputLarge}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleRemoveLine(index)}
                    className={styles.deleteButton}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                차변 합계: {calculateTotal('차변').toLocaleString()}원
              </td>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                대변 합계: {calculateTotal('대변').toLocaleString()}원
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 버튼 */}
      <div className={styles.buttonGroup}>
        <button onClick={handleAddLine} className={styles.addButton}>
          + 행 추가
        </button>
        <button onClick={handleSubmit} className={styles.saveButton}>
          저장
        </button>
      </div>

      {/* 계정과목 검색 모달 */}
      {showAccountModal && (
        <AccountSearchModal
          onSelect={handleAccountSelect}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {/* 거래처 검색 모달 */}
      {showClientModal && (
        <ClientSearchModal
          onSelect={handleClientSelect}
          onClose={() => setShowClientModal(false)}
        />
      )}
    </div>
  );
}

export default SalesPurchaseVoucher;
