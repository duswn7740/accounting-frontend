import { useState, useEffect } from 'react';
import styles from './Settlement.module.css';

function ManufacturingCost() {
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(null);
  const [costData, setCostData] = useState(null);

  // 재공품 재고 입력
  const [wipInventory, setWipInventory] = useState({
    beginningWIP: 0,
    endingWIP: 0
  });

  useEffect(() => {
    const periodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || 'null');
    if (periodInfo) {
      setFiscalYear(periodInfo.fiscalYear);
      fetchManufacturingCostData(periodInfo.fiscalYear);
    }
  }, []);

  const fetchManufacturingCostData = async (year) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `/api/settlement/voucher-data/${user.companyId}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCostData(data);
      }
    } catch (error) {
      console.error('제조원가 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWIPChange = (field, value) => {
    const numValue = value.replace(/,/g, '');
    setWipInventory(prev => ({
      ...prev,
      [field]: numValue === '' ? 0 : parseFloat(numValue) || 0
    }));
  };

  const formatAmount = (value) => {
    if (!value && value !== 0) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('ko-KR');
  };

  // 원재료비 계산
  const materialCost =
    (costData?.beginningMaterialInventory || 0) +
    (costData?.materialPurchases || 0) -
    (costData?.endingMaterialInventory || 0);

  const laborCost = costData?.laborCost || 0;
  const overheadCost = costData?.overheadCost || 0;

  // 당기총제조원가
  const totalManufacturingCost = materialCost + laborCost + overheadCost;

  // 당기제품제조원가
  const costOfGoodsManufactured =
    totalManufacturingCost +
    wipInventory.beginningWIP -
    wipInventory.endingWIP;

  if (loading && !costData) {
    return (
      <div className={styles.container}>
        <h1>제조원가명세서</h1>
        <div className={styles.content}>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>제조원가명세서</h1>

      <div className={styles.infoBox}>
        <p>선택된 회계기수: {fiscalYear ? `${fiscalYear}기` : '선택되지 않음'}</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.itemColumn}>과목</th>
              <th className={styles.amountColumn}>금액</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. 원재료비 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">1. 원재료비</td>
            </tr>
            <tr>
              <td className={styles.indent1}>기초원재료 재고액</td>
              <td className={styles.amount}>{formatAmount(costData?.beginningMaterialInventory)}</td>
            </tr>
            <tr>
              <td className={styles.indent1}>당기원재료 매입액</td>
              <td className={styles.amount}>{formatAmount(costData?.materialPurchases)}</td>
            </tr>
            <tr className={styles.inputRow}>
              <td className={styles.indent1}>기말원재료 재고액</td>
              <td className={styles.inputCell}>
                <input
                  type="text"
                  value={formatAmount(costData?.endingMaterialInventory || 0)}
                  readOnly
                  className={styles.inventoryInput}
                />
              </td>
            </tr>
            <tr className={styles.calculationRow}>
              <td className={styles.indent1}>= 원재료비</td>
              <td className={styles.amount}>{formatAmount(materialCost)}</td>
            </tr>

            {/* 2. 노무비 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">2. 노무비</td>
            </tr>
            {costData?.laborDetails && costData.laborDetails.length > 0 ? (
              <>
                {costData.laborDetails.map((detail, index) => (
                  <tr key={`labor-${index}`}>
                    <td className={styles.indent1}>{detail.accountName}</td>
                    <td className={styles.amount}>{formatAmount(detail.amount)}</td>
                  </tr>
                ))}
                <tr className={styles.calculationRow}>
                  <td className={styles.indent1}>= 노무비 계</td>
                  <td className={styles.amount}>{formatAmount(laborCost)}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td className={styles.indent1}>노무비 내역 없음</td>
                <td className={styles.amount}>0</td>
              </tr>
            )}

            {/* 3. 경비 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">3. 경비</td>
            </tr>
            {costData?.overheadDetails && costData.overheadDetails.length > 0 ? (
              <>
                {costData.overheadDetails.map((detail, index) => (
                  <tr key={`overhead-${index}`}>
                    <td className={styles.indent1}>{detail.accountName}</td>
                    <td className={styles.amount}>{formatAmount(detail.amount)}</td>
                  </tr>
                ))}
                <tr className={styles.calculationRow}>
                  <td className={styles.indent1}>= 경비 계</td>
                  <td className={styles.amount}>{formatAmount(overheadCost)}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td className={styles.indent1}>경비 내역 없음</td>
                <td className={styles.amount}>0</td>
              </tr>
            )}

            {/* 당기 총 제조원가 */}
            <tr className={styles.subtotalRow}>
              <td>4. 당기 총 제조원가</td>
              <td className={styles.amount}>{formatAmount(totalManufacturingCost)}</td>
            </tr>

            {/* 재공품 재고 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">5. 기초재공품 재고액</td>
            </tr>
            <tr className={styles.inputRow}>
              <td className={styles.indent1}>기초재공품</td>
              <td className={styles.inputCell}>
                <input
                  type="text"
                  value={formatAmount(wipInventory.beginningWIP)}
                  onChange={(e) => handleWIPChange('beginningWIP', e.target.value)}
                  className={styles.inventoryInput}
                />
              </td>
            </tr>

            <tr className={styles.sectionHeader}>
              <td colSpan="2">6. 기말재공품 재고액</td>
            </tr>
            <tr className={styles.inputRow}>
              <td className={styles.indent1}>기말재공품</td>
              <td className={styles.inputCell}>
                <input
                  type="text"
                  value={formatAmount(wipInventory.endingWIP)}
                  onChange={(e) => handleWIPChange('endingWIP', e.target.value)}
                  className={styles.inventoryInput}
                />
              </td>
            </tr>

            {/* 당기제품 제조원가 */}
            <tr className={styles.totalRow}>
              <td>7. 당기제품 제조원가</td>
              <td className={styles.amount}>{formatAmount(costOfGoodsManufactured)}</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.actionButtons}>
          <button
            className={styles.saveButton}
            onClick={() => alert('제조원가 결산 기능은 준비 중입니다')}
            disabled={loading}
          >
            {loading ? '처리 중...' : '결산 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManufacturingCost;
