import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';

const OTT_PLATFORMS = [
  { name: '넷플릭스 (스탠다드)', price: 13500 },
  { name: '넷플릭스 (프리미엄)', price: 17000 },
  { name: '유튜브 프리미엄', price: 14900 },
  { name: '티빙 (베이직)', price: 9500 },
  { name: '쿠팡플레이 (와우)', price: 7890 },
  { name: '디즈니+ (프리미엄)', price: 13900 },
];

export default function App() {
  const [selectedOTT, setSelectedOTT] = useState(OTT_PLATFORMS[0].name);
  const [monthlyPrice, setMonthlyPrice] = useState(OTT_PLATFORMS[0].price);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyHours, setDailyHours] = useState('');
  
  // 입력 모드 (캘린더 상세 입력 vs 간편 일괄 입력)
  const [inputMode, setInputMode] = useState('calendar'); 
  const [quickDays, setQuickDays] = useState('7'); 
  const [quickAvgHours, setQuickAvgHours] = useState(''); 

  const [ottRecords, setOttRecords] = useState(() => {
    const saved = localStorage.getItem('ott_multi_records');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('ott_multi_records', JSON.stringify(ottRecords));
  }, [ottRecords]);

  // 전체 데이터 초기화 기능
  const handleClearAllData = () => {
    if (window.confirm('모든 OTT 시청 기록을 초기화하시겠습니까?')) {
      setOttRecords({});
      localStorage.removeItem('ott_multi_records');
    }
  };

  const handleOTTChange = (e) => {
    const platformName = e.target.value;
    setSelectedOTT(platformName);
    const target = OTT_PLATFORMS.find((item) => item.name === platformName);
    if (target) setMonthlyPrice(target.price);
  };

  const currentOttData = ottRecords[selectedOTT] || {};
  const currentDateKey = format(selectedDate, 'yyyy-MM-dd');

  // 1. 캘린더 기반 등록/수정/삭제
  const handleAddRecord = () => {
    if (!dailyHours || isNaN(dailyHours) || parseFloat(dailyHours) <= 0) return;
    const addedHours = parseFloat(dailyHours);
    setOttRecords((prev) => {
      const ottData = prev[selectedOTT] || {};
      const newOttData = {
        ...ottData,
        [currentDateKey]: (ottData[currentDateKey] || 0) + addedHours,
      };
      return { ...prev, [selectedOTT]: newOttData };
    });
    setDailyHours('');
  };

  const handleSetRecord = () => {
    if (!dailyHours || isNaN(dailyHours) || parseFloat(dailyHours) < 0) return;
    const newHours = parseFloat(dailyHours);
    setOttRecords((prev) => {
      const ottData = prev[selectedOTT] || {};
      const newOttData = { ...ottData, [currentDateKey]: newHours };
      return { ...prev, [selectedOTT]: newOttData };
    });
    setDailyHours('');
  };

  const handleDeleteRecord = () => {
    setOttRecords((prev) => {
      const ottData = { ...(prev[selectedOTT] || {}) };
      delete ottData[currentDateKey];
      return { ...prev, [selectedOTT]: ottData };
    });
    setDailyHours('');
  };

  // 2. 간편 일괄 입력
  const handleQuickBatchInput = () => {
    if (!quickAvgHours || isNaN(quickAvgHours) || parseFloat(quickAvgHours) <= 0) return;
    const avg = parseFloat(quickAvgHours);
    const days = parseInt(quickDays, 10);
    const today = new Date();

    setOttRecords((prev) => {
      const ottData = { ...(prev[selectedOTT] || {}) };
      for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        ottData[dateStr] = avg;
      }
      return { ...prev, [selectedOTT]: ottData };
    });
    alert(`최근 ${days}일간 매일 ${avg}시간 시청한 기록이 입력되었습니다!`);
    setQuickAvgHours('');
  };

  // 캘린더 날짜 구분 표시 (기록이 있는 날짜에 파란 점 찍기)
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (currentOttData[dateStr] && currentOttData[dateStr] > 0) {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
            <span style={{ height: '6px', width: '6px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'inline-block' }}></span>
          </div>
        );
      }
    }
    return null;
  };

  // 통계 연산
  const currentTotalHours = Object.values(currentOttData).reduce((acc, cur) => acc + cur, 0);
  const currentCostPerHour = currentTotalHours > 0 ? Math.round(monthlyPrice / currentTotalHours) : 0;

  const activePlatforms = OTT_PLATFORMS.filter((ott) => {
    const records = ottRecords[ott.name] || {};
    return Object.values(records).reduce((acc, cur) => acc + cur, 0) > 0;
  });

  const grandTotalCost = activePlatforms.reduce((acc, cur) => acc + cur.price, 0);
  const grandTotalHours = Object.keys(ottRecords).reduce((acc, ottKey) => {
    const hours = Object.values(ottRecords[ottKey]).reduce((a, b) => a + b, 0);
    return acc + hours;
  }, 0);
  const grandCostPerHour = grandTotalHours > 0 ? Math.round(grandTotalCost / grandTotalHours) : 0;

  const getEfficiencyStatus = (cost, hours) => {
    if (hours === 0) return { label: '위험 (시청 기록 없음)', color: '#ef4444' };
    if (cost > 5000) return { label: '경고 (가성비 낮음)', color: '#f59e0b' };
    return { label: '양호 (효율적 소비)', color: '#10b981' };
  };

  const status = getEfficiencyStatus(currentCostPerHour, currentTotalHours);

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* 상단 타이틀 영역 (겹침 현상 방지 및 간격 조정) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🎬</span> OTT 다이어트 대시보드
        </h1>
        <button
          onClick={handleClearAllData}
          style={{
            padding: '8px 14px',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          🔄 데이터 전체 초기화
        </button>
      </div>

      {/* 1. 전체 OTT 통합 대시보드 */}
      <section style={{ background: '#1e293b', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
        <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>📊 전체 OTT 통합 소비 대시보드</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '15px' }}>
          <div>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>등록된 OTT</span>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '22px' }}>{activePlatforms.length} 개</h3>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>총 구독료 지출</span>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '22px' }}>{grandTotalCost.toLocaleString()} 원</h3>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>총 시청 시간</span>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '22px' }}>{grandTotalHours} 시간</h3>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>통합 시간당 비용</span>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '22px', color: '#facc15' }}>{grandCostPerHour.toLocaleString()} 원/시간</h3>
          </div>
        </div>
      </section>

      {/* 2. OTT 선택 */}
      <section style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#334155' }}>1. 이용 중인 OTT 선택</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedOTT} onChange={handleOTTChange} style={{ padding: '8px', fontSize: '16px' }}>
            {OTT_PLATFORMS.map((ott) => (
              <option key={ott.name} value={ott.name}>
                {ott.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            월 구독료: {monthlyPrice.toLocaleString()}원
          </span>
        </div>
      </section>

      {/* 3. 입력 방식 모드 전환 탭 (UX 개선 글자 제거됨) */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => setInputMode('calendar')}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              backgroundColor: inputMode === 'calendar' ? '#2563eb' : '#e2e8f0',
              color: inputMode === 'calendar' ? 'white' : '#475569',
            }}
          >
            📅 캘린더 상세 입력
          </button>
          <button
            onClick={() => setInputMode('quick')}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              backgroundColor: inputMode === 'quick' ? '#2563eb' : '#e2e8f0',
              color: inputMode === 'quick' ? 'white' : '#475569',
            }}
          >
            ⚡ 간편 일괄 입력
          </button>
        </div>

        {/* 캘린더 입력 모드 */}
        {inputMode === 'calendar' ? (
          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <Calendar onChange={setSelectedDate} value={selectedDate} tileContent={tileContent} />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>* 날짜 아래 🔵 파란 점이 있는 날은 시청 기록이 있는 날입니다.</p>
            </div>

            <div style={{ flex: 1, minWidth: '250px', background: '#fafafa', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginTop: 0, fontSize: '16px' }}>선택 날짜: {currentDateKey}</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>시청 시간 (시간 단위):</label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  placeholder="예: 2.5"
                  style={{ padding: '8px', width: '100px', fontSize: '15px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={handleAddRecord} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>➕ 시간에 더하기</button>
                <button onClick={handleSetRecord} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>✏️ 이 값으로 수정</button>
                <button onClick={handleDeleteRecord} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>🗑️ 기록 삭제</button>
              </div>

              <h4 style={{ marginTop: '20px', color: '#1f2937', fontSize: '15px' }}>
                이날 기록된 시간: <span style={{ color: '#2563eb' }}>{currentOttData[currentDateKey] || 0} 시간</span>
              </h4>
            </div>
          </div>
        ) : (
          /* 간편 입력 모드 */
          <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '25px' }}>
            <h3 style={{ marginTop: 0, color: '#166534', fontSize: '16px' }}>⚡ 빠른 평균 일괄 입력</h3>
            <p style={{ fontSize: '14px', color: '#15803d' }}>매일 입력하기 번거로우신가요? 최근 기간과 평균 시청 시간만 선택하면 자동으로 날짜별 데이터가 입력됩니다.</p>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '15px' }}>
              <div>
                <label style={{ marginRight: '8px', fontWeight: 'bold', fontSize: '14px' }}>적용 기간:</label>
                <select value={quickDays} onChange={(e) => setQuickDays(e.target.value)} style={{ padding: '8px', fontSize: '15px' }}>
                  <option value="7">최근 7일 (1주일)</option>
                  <option value="14">최근 14일 (2주일)</option>
                  <option value="30">최근 30일 (1개월)</option>
                </select>
              </div>

              <div>
                <label style={{ marginRight: '8px', fontWeight: 'bold', fontSize: '14px' }}>하루 평균 시청 시간:</label>
                <input
                  type="number"
                  step="0.5"
                  value={quickAvgHours}
                  onChange={(e) => setQuickAvgHours(e.target.value)}
                  placeholder="예: 2"
                  style={{ padding: '8px', width: '80px', fontSize: '15px' }}
                /> 시간
              </div>

              <button
                style={{ padding: '9px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={handleQuickBatchInput}
              >
                🚀 일괄 기록 적용
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. 개별 OTT 리포트 */}
      <section style={{ border: '2px solid #e5e7eb', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>[{selectedOTT}] 리포트</h3>
        <p>총 누적 시청 시간: <strong>{currentTotalHours} 시간</strong></p>
        <p>시간당 지출 비용: <strong>{currentCostPerHour.toLocaleString()} 원 / 시간</strong></p>
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: status.color, color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
          가성비 상태: {status.label}
        </div>
      </section>

      {/* 5. 시청 패턴 시각화 (바 차트) */}
      <section style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>📈 OTT별 시청 비중 통계 (시각화 차트)</h3>
        {grandTotalHours === 0 ? (
          <p style={{ color: '#64748b' }}>기록된 시청 시간이 없습니다. 달력이나 간편 입력으로 시간을 추가해 보세요!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {OTT_PLATFORMS.map((ott) => {
              const records = ottRecords[ott.name] || {};
              const hours = Object.values(records).reduce((a, b) => a + b, 0);
              const percentage = grandTotalHours > 0 ? Math.round((hours / grandTotalHours) * 100) : 0;

              return (
                <div key={ott.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                    <span>{ott.name}</span>
                    <span>{hours}시간 ({percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', height: '16px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: percentage > 0 ? '#3b82f6' : 'transparent',
                        height: '100%',
                        transition: 'width 0.4s ease-in-out',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}