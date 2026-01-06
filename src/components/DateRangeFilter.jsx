import React, { useState, useEffect } from 'react';
import styles from './DateRangeFilter.module.css';

/**
 * 통합 날짜 범위 검색 컴포넌트
 * @param {function} onSearch - 검색 실행 시 호출되는 콜백 (startDate, endDate를 인자로 받음)
 * @param {string} fiscalYear - 회계연도 (readonly)
 */
function DateRangeFilter({ onSearch, fiscalYear }) {
  const [filters, setFilters] = useState({
    startMonth: '',
    startDay: '',
    endMonth: '',
    endDay: ''
  });

  const [fiscalYearDisplay, setFiscalYearDisplay] = useState('');

  useEffect(() => {
    // fiscalYear prop이 있으면 사용, 없으면 localStorage에서 가져오기
    if (fiscalYear) {
      setFiscalYearDisplay(fiscalYear);
    } else {
      const fiscalPeriodInfo = JSON.parse(localStorage.getItem('selectedFiscalPeriodInfo') || '{}');
      if (fiscalPeriodInfo.startDate) {
        const startYear = new Date(fiscalPeriodInfo.startDate).getFullYear();
        setFiscalYearDisplay(startYear);
      }
    }
  }, [fiscalYear]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    const { startMonth, startDay, endMonth, endDay } = filters;

    // 유효성 검사
    if (!startMonth || !endMonth) {
      alert('시작월과 종료월을 입력해주세요');
      return;
    }

    // 날짜 범위 생성
    let startDate, endDate;

    // 월만 입력한 경우: 해당 월의 전체 기간
    if (startMonth && !startDay && endMonth && !endDay) {
      startDate = `${fiscalYearDisplay}-${String(startMonth).padStart(2, '0')}-01`;
      // 종료월의 마지막 날 계산
      const endMonthDate = new Date(fiscalYearDisplay, parseInt(endMonth), 0);
      const lastDay = endMonthDate.getDate();
      endDate = `${fiscalYearDisplay}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
    // 월/일 모두 입력한 경우: 해당 날짜부터 해당 날짜까지
    else if (startMonth && startDay && endMonth && endDay) {
      startDate = `${fiscalYearDisplay}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      endDate = `${fiscalYearDisplay}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    }
    // 시작은 월만, 종료는 월/일 또는 그 반대의 경우
    else {
      alert('월만 입력하거나, 월/일을 모두 입력해주세요');
      return;
    }

    // 날짜 유효성 검사
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('올바른 날짜를 입력해주세요');
      return;
    }

    if (start > end) {
      alert('시작일이 종료일보다 늦을 수 없습니다');
      return;
    }

    // 검색 콜백 호출
    onSearch(startDate, endDate);
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterRow}>
        <label>조회기간:</label>
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
          className={styles.monthInput}
        />
        <input
          type="text"
          placeholder="일"
          value={filters.startDay}
          onChange={(e) => handleFilterChange('startDay', e.target.value)}
          min="1"
          max="31"
          className={styles.dayInput}
        />
        <span>부터</span>
        <input
          type="text"
          placeholder="월"
          value={filters.endMonth}
          onChange={(e) => handleFilterChange('endMonth', e.target.value)}
          min="1"
          max="12"
          className={styles.monthInput}
        />
        <input
          type="text"
          placeholder="일"
          value={filters.endDay}
          onChange={(e) => handleFilterChange('endDay', e.target.value)}
          min="1"
          max="31"
          className={styles.dayInput}
        />
        <span>까지</span>
        <button className={styles.searchButton} onClick={handleSearch}>
          조회
        </button>
      </div>
    </div>
  );
}

export default DateRangeFilter;
