import { useState, useEffect } from 'react';
import styles from './Settlement.module.css';

function SettlementVoucher() {
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(null);
  const [settlementData, setSettlementData] = useState(null);

  // 재고 입력 필드
  const [inventory, setInventory] = useState({
    endingProductInventory: 0,      // 기말 상품 재고액
    endingMaterialInventory: 0,     // 기말 원재료 재고액
    endingFinishedGoodsInventory: 0 // 기말 제품 재고액
  });

  useEffect(() => {
    const periodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || 'null');
    if (periodInfo) {
      setFiscalYear(periodInfo.fiscalYear);
      fetchSettlementData(periodInfo.fiscalYear);
    }
  }, []);

  const fetchSettlementData = async (year) => {
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
        setSettlementData(data);

        // 기존 재고 값이 있으면 설정
        if (data.inventory) {
          setInventory({
            endingProductInventory: data.inventory.endingProductInventory || 0,
            endingMaterialInventory: data.inventory.endingMaterialInventory || 0,
            endingFinishedGoodsInventory: data.inventory.endingFinishedGoodsInventory || 0
          });
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryChange = (field, value) => {
    const numValue = value.replace(/,/g, '');
    setInventory(prev => ({
      ...prev,
      [field]: numValue === '' ? 0 : parseFloat(numValue) || 0
    }));
  };

  const handleSaveSettlement = async () => {
    if (!fiscalYear) {
      alert('회계기수를 선택해주세요');
      return;
    }

    const confirmMessage = `${fiscalYear}기 결산전표를 생성하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));

      const response = await fetch(
        `/api/settlement/voucher/${user.companyId}/${fiscalYear}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inventory
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('결산전표가 생성되었습니다');
        fetchSettlementData(fiscalYear);
      } else {
        alert(data.message || '결산전표 생성에 실패했습니다');
      }
    } catch (error) {
      alert('결산전표 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) => {
    if (!value && value !== 0) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('ko-KR');
  };

  // 매출원가 계산
  const calculateCOGS = () => {
    if (!settlementData) return { product: 0, goods: 0, total: 0 };

    // 상품매출원가 = 기초상품재고 + 당기상품매입 - 기말상품재고
    const productCOGS =
      (settlementData.beginningProductInventory || 0) +
      (settlementData.productPurchases || 0) -
      inventory.endingProductInventory;

    // 제품매출원가 계산
    // 원재료비 = 기초원재료 + 당기원재료매입 - 기말원재료
    const materialCost =
      (settlementData.beginningMaterialInventory || 0) +
      (settlementData.materialPurchases || 0) -
      inventory.endingMaterialInventory;

    const laborCost = settlementData.laborCost || 0;
    const overheadCost = settlementData.overheadCost || 0;

    // 당기제조원가 = 원재료비 + 노무비 + 경비
    const manufacturingCost = materialCost + laborCost + overheadCost;

    // 제품매출원가 = 기초제품재고 + 당기제조원가 - 기말제품재고
    const goodsCOGS =
      (settlementData.beginningFinishedGoodsInventory || 0) +
      manufacturingCost -
      inventory.endingFinishedGoodsInventory;

    return {
      product: productCOGS,
      goods: goodsCOGS,
      material: materialCost,
      labor: laborCost,
      overhead: overheadCost,
      total: productCOGS + goodsCOGS
    };
  };

  const cogs = calculateCOGS();
  const totalRevenue = settlementData?.totalRevenue || 0;
  const grossProfit = totalRevenue - cogs.total;
  const netIncome = grossProfit - (settlementData?.operatingExpenses || 0);
  const profitRatio = totalRevenue > 0 ? (netIncome / totalRevenue * 100) : 0;

  if (loading && !settlementData) {
    return (
      <div className={styles.container}>
        <h1>결산전표 입력</h1>
        <div className={styles.content}>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>결산전표 입력</h1>

      <div className={styles.infoBox}>
        <p>선택된 회계기수: {fiscalYear ? `${fiscalYear}기` : '선택되지 않음'}</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.itemColumn}>항목</th>
              <th className={styles.amountColumn}>금액</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. 매출액 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">1. 매출액</td>
            </tr>
            {settlementData?.revenues?.map((revenue, index) => (
              <tr key={`revenue-${index}`}>
                <td className={styles.indent1}>{revenue.accountName}</td>
                <td className={styles.amount}>{formatAmount(revenue.amount)}</td>
              </tr>
            ))}
            <tr className={styles.subtotalRow}>
              <td>매출액 합계</td>
              <td className={styles.amount}>{formatAmount(totalRevenue)}</td>
            </tr>

            {/* 2. 매출원가 */}
            <tr className={styles.sectionHeader}>
              <td colSpan="2">2. 매출원가</td>
            </tr>

            {/* 상품매출원가 */}
            <tr className={styles.subsectionHeader}>
              <td className={styles.indent1}>상품매출원가</td>
              <td></td>
            </tr>
            <tr>
              <td className={styles.indent2}>기초 상품 재고액</td>
              <td className={styles.amount}>{formatAmount(settlementData?.beginningProductInventory)}</td>
            </tr>
            <tr>
              <td className={styles.indent2}>당기 상품 매입액</td>
              <td className={styles.amount}>{formatAmount(settlementData?.productPurchases)}</td>
            </tr>
            <tr className={styles.inputRow}>
              <td className={styles.indent2}>기말 상품 재고액</td>
              <td className={styles.inputCell}>
                <input
                  type="text"
                  value={formatAmount(inventory.endingProductInventory)}
                  onChange={(e) => handleInventoryChange('endingProductInventory', e.target.value)}
                  className={styles.inventoryInput}
                />
              </td>
            </tr>
            <tr className={styles.calculationRow}>
              <td className={styles.indent2}>= 상품매출원가</td>
              <td className={styles.amount}>{formatAmount(cogs.product)}</td>
            </tr>

            {/* 제품매출원가 */}
            <tr className={styles.subsectionHeader}>
              <td className={styles.indent1}>제품매출원가</td>
              <td></td>
            </tr>
            <tr>
              <td className={styles.indent2}>원재료비</td>
              <td></td>
            </tr>
            <tr>
              <td className={styles.indent3}>기초 원재료 재고액</td>
              <td className={styles.amount}>{formatAmount(settlementData?.beginningMaterialInventory)}</td>
            </tr>
            <tr>
              <td className={styles.indent3}>당기 원재료 매입액</td>
              <td className={styles.amount}>{formatAmount(settlementData?.materialPurchases)}</td>
            </tr>
            <tr className={styles.inputRow}>
              <td className={styles.indent3}>기말 원재료 재고액</td>
              <td className={styles.inputCell}>
                <input
                  type="text"
                  value={formatAmount(inventory.endingMaterialInventory)}
                  onChange={(e) => handleInventoryChange('endingMaterialInventory', e.target.value)}
                  className={styles.inventoryInput}
                />
              </td>
            </tr>
            <tr className={styles.calculationRow}>
              <td className={styles.indent3}>= 원재료비</td>
              <td className={styles.amount}>{formatAmount(cogs.material)}</td>
            </tr>

            {/* 노무비 (금액이 있는 경우만) */}
            {cogs.labor > 0 && (
              <>
                <tr>
                  <td className={styles.indent2}>노무비</td>
                  <td></td>
                </tr>
                {settlementData?.laborDetails?.map((detail, index) => (
                  <tr key={`labor-${index}`}>
                    <td className={styles.indent3}>{detail.accountName}</td>
                    <td className={styles.amount}>{formatAmount(detail.amount)}</td>
                  </tr>
                ))}
                <tr className={styles.calculationRow}>
                  <td className={styles.indent3}>= 노무비 계</td>
                  <td className={styles.amount}>{formatAmount(cogs.labor)}</td>
                </tr>
              </>
            )}

            {/* 경비 (금액이 있는 경우만) */}
            {cogs.overhead > 0 && (
              <>
                <tr>
                  <td className={styles.indent2}>경비</td>
                  <td></td>
                </tr>
                {settlementData?.overheadDetails?.map((detail, index) => (
                  <tr key={`overhead-${index}`}>
                    <td className={styles.indent3}>{detail.accountName}</td>
                    <td className={styles.amount}>{formatAmount(detail.amount)}</td>
                  </tr>
                ))}
                <tr className={styles.calculationRow}>
                  <td className={styles.indent3}>= 경비 계</td>
                  <td className={styles.amount}>{formatAmount(cogs.overhead)}</td>
                </tr>
              </>
            )}

            <tr>
              <td className={styles.indent2}>기초 제품 재고액</td>
              <td className={styles.amount}>{formatAmount(settlementData?.beginningFinishedGoodsInventory)}</td>
            </tr>
            <tr className={styles.inputRow}>
              <td className={styles.indent2}>기말 제품 재고액</td>
              <td className={styles.inputCell}>
                <input
                  type="text"
                  value={formatAmount(inventory.endingFinishedGoodsInventory)}
                  onChange={(e) => handleInventoryChange('endingFinishedGoodsInventory', e.target.value)}
                  className={styles.inventoryInput}
                />
              </td>
            </tr>
            <tr className={styles.calculationRow}>
              <td className={styles.indent2}>= 제품매출원가</td>
              <td className={styles.amount}>{formatAmount(cogs.goods)}</td>
            </tr>

            <tr className={styles.subtotalRow}>
              <td>매출원가 합계</td>
              <td className={styles.amount}>{formatAmount(cogs.total)}</td>
            </tr>

            {/* 매출총이익 */}
            <tr className={styles.totalRow}>
              <td>매출총이익</td>
              <td className={styles.amount}>{formatAmount(grossProfit)}</td>
            </tr>

            {/* 3. 판매비와관리비 (금액이 있는 경우만) */}
            {settlementData?.operatingExpenses > 0 && (
              <>
                <tr className={styles.sectionHeader}>
                  <td colSpan="2">3. 판매비와관리비</td>
                </tr>
                {settlementData?.expenseDetails?.map((expense, index) => (
                  <tr key={`expense-${index}`}>
                    <td className={styles.indent1}>{expense.accountName}</td>
                    <td className={styles.amount}>{formatAmount(expense.amount)}</td>
                  </tr>
                ))}
                <tr className={styles.subtotalRow}>
                  <td>판매비와관리비 합계</td>
                  <td className={styles.amount}>{formatAmount(settlementData.operatingExpenses)}</td>
                </tr>
              </>
            )}
          </tbody>

          <tfoot>
            <tr className={styles.footerRow}>
              <td>매출액</td>
              <td className={styles.amount}>{formatAmount(totalRevenue)} 원</td>
            </tr>
            <tr className={styles.footerRow}>
              <td>당기순이익</td>
              <td className={styles.amount}>{formatAmount(netIncome)} 원</td>
            </tr>
            <tr className={styles.footerRow}>
              <td>소득평율</td>
              <td className={styles.amount}>{profitRatio.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
            </tr>
          </tfoot>
        </table>

        <div className={styles.actionButtons}>
          <button
            className={styles.saveButton}
            onClick={handleSaveSettlement}
            disabled={loading}
          >
            {loading ? '처리 중...' : '결산전표 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettlementVoucher;
