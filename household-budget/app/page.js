'use client'

import { useState, useEffect, useCallback } from 'react'
import { FIXED_EXPENSES, FIXED_TOTAL, VARIABLE_CATEGORIES, formatKRW, getCategoryById } from './constants'

// ─── date helpers ────────────────────────────────────────────────────────────
const today = () => new Date()
const key = (y, m) => `budget_${y}_${m < 10 ? '0' + m : m}`

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

// ─── local storage hooks ──────────────────────────────────────────────────────
function useMonthData(year, month) {
  const [data, setData] = useState({})
  const storageKey = key(year, month)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setData(raw ? JSON.parse(raw) : {})
    } catch { setData({}) }
  }, [storageKey])

  const save = useCallback((newData) => {
    setData(newData)
    try { localStorage.setItem(storageKey, JSON.stringify(newData)) } catch {}
  }, [storageKey])

  const addEntry = useCallback((day, entry) => {
    setData(prev => {
      const dayKey = String(day)
      const updated = {
        ...prev,
        [dayKey]: [...(prev[dayKey] || []), { ...entry, id: Date.now() }],
      }
      try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [storageKey])

  const deleteEntry = useCallback((day, entryId) => {
    setData(prev => {
      const dayKey = String(day)
      const updated = {
        ...prev,
        [dayKey]: (prev[dayKey] || []).filter(e => e.id !== entryId),
      }
      try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [storageKey])

  const monthTotal = Object.values(data).flat().reduce((s, e) => s + (e.amount || 0), 0)

  return { data, addEntry, deleteEntry, monthTotal }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function EntryModal({ day, year, month, onAdd, onClose }) {
  const [category, setCategory] = useState(VARIABLE_CATEGORIES[0].id)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [who, setWho] = useState('공동')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount.replace(/,/g, '')))) return
    onAdd(day, {
      category,
      amount: Number(amount.replace(/,/g, '')),
      memo,
      who,
    })
    onClose()
  }

  const formatInput = (v) => {
    const num = v.replace(/[^0-9]/g, '')
    return num ? Number(num).toLocaleString() : ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#2c2415' }}>
              {month + 1}월 {day}일 지출 추가
            </h3>
            <p className="text-sm mt-0.5" style={{ color: '#7a6e5a' }}>누가 어디에 썼나요?</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ background: '#f0e9d2', color: '#7a6e5a' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Who */}
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>사용자</label>
            <div className="flex gap-2">
              {['공동', '남규', '와이프'].map(w => (
                <button key={w} type="button"
                  onClick={() => setWho(w)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: who === w ? '#5d8a62' : '#f0e9d2',
                    color: who === w ? '#fff' : '#7a6e5a',
                    border: who === w ? '1.5px solid #5d8a62' : '1.5px solid #e8e0d0',
                  }}>
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>카테고리</label>
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {VARIABLE_CATEGORIES.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => setCategory(cat.id)}
                  className="py-2 px-1 rounded-xl text-center transition-all"
                  style={{
                    background: category === cat.id ? cat.color + '20' : '#f9f5eb',
                    border: category === cat.id ? `1.5px solid ${cat.color}` : '1.5px solid transparent',
                  }}>
                  <div className="text-lg">{cat.icon}</div>
                  <div className="text-[10px] mt-0.5 font-medium" style={{ color: category === cat.id ? cat.color : '#7a6e5a' }}>
                    {cat.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>금액</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: '#7a6e5a' }}>₩</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(formatInput(e.target.value))}
                placeholder="0"
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl text-right text-lg font-bold outline-none"
                style={{ background: '#f0e9d2', border: '1.5px solid #e8e0d0', color: '#2c2415' }}
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>메모 (선택)</label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="어디서 썼나요?"
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#f0e9d2', border: '1.5px solid #e8e0d0', color: '#2c2415' }}
            />
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #5d8a62, #4a7050)' }}>
            추가하기
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayPanel({ day, month, year, entries, onAdd, onDelete, onClose }) {
  const dayTotal = (entries || []).reduce((s, e) => s + e.amount, 0)
  const d = new Date(year, month, day)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[d.getDay()]
  const isWeekend = d.getDay() === 0 || d.getDay() === 6

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#f9f5eb', borderBottom: '1px solid #e8e0d0' }}>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black" style={{ color: isWeekend ? '#b06a4e' : '#2c2415' }}>{day}</span>
              <span className="text-sm font-medium" style={{ color: '#7a6e5a' }}>{month + 1}월 {dayName}요일</span>
            </div>
            {dayTotal > 0 && (
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#b06a4e' }}>
                합계 {formatKRW(dayTotal)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onAdd}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: '#5d8a62' }}>
              + 추가
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#e8e0d0', color: '#7a6e5a' }}>✕</button>
          </div>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(!entries || entries.length === 0) ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">🌿</div>
              <p className="text-sm font-medium" style={{ color: '#7a6e5a' }}>이날은 지출이 없어요</p>
              <p className="text-xs mt-1" style={{ color: '#b0a890' }}>+ 추가 버튼으로 기록해보세요</p>
            </div>
          ) : entries.map(entry => {
            const cat = getCategoryById(entry.category)
            const whoColors = { '남규': '#4a90b8', '와이프': '#e05a7a', '공동': '#5d8a62' }
            return (
              <div key={entry.id}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{ background: '#fff', border: '1px solid #e8e0d0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: cat.color + '18' }}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#2c2415' }}>{cat.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: (whoColors[entry.who] || '#5d8a62') + '18', color: whoColors[entry.who] || '#5d8a62' }}>
                      {entry.who}
                    </span>
                  </div>
                  {entry.memo && <p className="text-xs mt-0.5 truncate" style={{ color: '#9a8e78' }}>{entry.memo}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: '#b06a4e' }}>{formatKRW(entry.amount)}</p>
                  <button onClick={() => onDelete(entry.id)}
                    className="text-xs mt-0.5" style={{ color: '#b0a890' }}>삭제</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Fixed Expenses Panel ─────────────────────────────────────────────────────
function FixedPanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#f9f5eb', borderBottom: '1px solid #e8e0d0' }}>
          <div>
            <h3 className="text-lg font-black" style={{ color: '#2c2415' }}>📌 고정비 내역</h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#b06a4e' }}>
              월 합계 {formatKRW(FIXED_TOTAL)}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#e8e0d0', color: '#7a6e5a' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {FIXED_EXPENSES.map(exp => (
            <div key={exp.id} className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: '#fff', border: '1px solid #e8e0d0' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: exp.color + '18' }}>
                {exp.icon}
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: '#2c2415' }}>{exp.name}</span>
              <span className="font-bold text-sm" style={{ color: '#7a6e5a' }}>{formatKRW(exp.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Statistics ───────────────────────────────────────────────────────────────
function StatsPanel({ data, onClose }) {
  const entries = Object.values(data).flat()
  const byCategory = {}
  entries.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  })
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, e) => s + e.amount, 0)

  const byWho = {}
  entries.forEach(e => {
    byWho[e.who] = (byWho[e.who] || 0) + e.amount
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#f9f5eb', borderBottom: '1px solid #e8e0d0' }}>
          <div>
            <h3 className="text-lg font-black" style={{ color: '#2c2415' }}>📊 이번달 통계</h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#b06a4e' }}>
              변동비 합계 {formatKRW(total)}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#e8e0d0', color: '#7a6e5a' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 인별 */}
          {Object.keys(byWho).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7a6e5a' }}>인별 사용</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(byWho).map(([who, amt]) => {
                  const colors = { '남규': '#4a90b8', '와이프': '#e05a7a', '공동': '#5d8a62' }
                  return (
                    <div key={who} className="p-3 rounded-xl text-center"
                      style={{ background: (colors[who] || '#5d8a62') + '12', border: `1px solid ${(colors[who] || '#5d8a62')}30` }}>
                      <p className="text-xs font-bold" style={{ color: colors[who] || '#5d8a62' }}>{who}</p>
                      <p className="text-sm font-black mt-1" style={{ color: '#2c2415' }}>{formatKRW(amt)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 카테고리별 */}
          {sorted.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7a6e5a' }}>카테고리별</h4>
              <div className="space-y-2">
                {sorted.map(([catId, amt]) => {
                  const cat = getCategoryById(catId)
                  const pct = total > 0 ? (amt / total * 100) : 0
                  return (
                    <div key={catId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-sm font-medium" style={{ color: '#2c2415' }}>{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#b06a4e' }}>{formatKRW(amt)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e8e0d0' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-sm" style={{ color: '#7a6e5a' }}>아직 이번달 기록이 없어요</p>
            </div>
          )}

          {/* 총합 */}
          {total > 0 && (
            <div className="p-4 rounded-xl" style={{ background: '#f0e9d2', border: '1px solid #e0d4b8' }}>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: '#7a6e5a' }}>변동비</span>
                <span className="font-bold" style={{ color: '#2c2415' }}>{formatKRW(total)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: '#7a6e5a' }}>고정비</span>
                <span className="font-bold" style={{ color: '#2c2415' }}>{formatKRW(FIXED_TOTAL)}</span>
              </div>
              <div className="h-px my-2" style={{ background: '#d4c9b4' }} />
              <div className="flex justify-between">
                <span className="text-sm font-bold" style={{ color: '#7a6e5a' }}>이번달 총 지출</span>
                <span className="font-black text-base" style={{ color: '#b06a4e' }}>{formatKRW(total + FIXED_TOTAL)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const now = today()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFixed, setShowFixed] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [addDay, setAddDay] = useState(null)

  const { data, addEntry, deleteEntry, monthTotal } = useMonthData(year, month)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
  }

  const handleAddFromDay = (day) => {
    setAddDay(day)
    setShowAddModal(true)
    setSelectedDay(null)
  }

  const handleAddEntry = (day, entry) => {
    addEntry(day, entry)
  }

  const totalWithFixed = monthTotal + FIXED_TOTAL

  return (
    <div className="min-h-screen" style={{ background: '#fdfcf7' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e0d0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black" style={{ color: '#2c2415' }}>🏡 우리집 가계부</h1>
              <p className="text-xs" style={{ color: '#9a8e78' }}>남규 & 와이프의 기록장</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFixed(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: '#f0e9d2', color: '#7a6e5a', border: '1px solid #e0d4b8' }}>
                📌 고정비
              </button>
              <button onClick={() => setShowStats(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: '#f0e9d2', color: '#7a6e5a', border: '1px solid #e0d4b8' }}>
                📊 통계
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Month summary */}
        <div className="mt-4 p-4 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #5d8a62, #4a7050)', color: '#fff' }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all">
              ←
            </button>
            <h2 className="text-xl font-black">{year}년 {monthNames[month]}</h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all">
              →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-xs opacity-80 mb-1">변동비</p>
              <p className="text-lg font-black">{formatKRW(monthTotal)}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-xs opacity-80 mb-1">고정비</p>
              <p className="text-lg font-black">{formatKRW(FIXED_TOTAL)}</p>
            </div>
          </div>
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-80">이번달 총 지출</span>
              <span className="text-xl font-black">{formatKRW(totalWithFixed)}</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mt-4 rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #e8e0d0' }}>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e8e0d0' }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className="py-2.5 text-center text-xs font-bold"
                style={{ color: i === 0 ? '#b06a4e' : i === 6 ? '#4a90b8' : '#9a8e78' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[60px] border-r border-b last:border-r-0"
                style={{ borderColor: '#f0e9d2', background: '#fdfcf7' }} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const col = (firstDay + day - 1) % 7
              const entries = data[String(day)] || []
              const dayTotal = entries.reduce((s, e) => s + e.amount, 0)
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
              const isSelected = selectedDay === day
              const isSun = col === 0
              const isSat = col === 6

              return (
                <div key={day}
                  onClick={() => handleDayClick(day)}
                  className="min-h-[60px] p-1.5 cursor-pointer transition-all relative border-r border-b last:border-r-0"
                  style={{
                    borderColor: '#f0e9d2',
                    background: isSelected ? '#f0e9d2' : 'transparent',
                  }}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${isToday ? 'text-white' : ''}`}
                    style={{
                      background: isToday ? '#5d8a62' : 'transparent',
                      color: isToday ? '#fff' : isSun ? '#b06a4e' : isSat ? '#4a90b8' : '#2c2415',
                    }}>
                    {day}
                  </div>
                  {dayTotal > 0 && (
                    <div className="text-[10px] font-bold leading-tight"
                      style={{ color: '#b06a4e' }}>
                      {dayTotal >= 10000
                        ? `${(dayTotal / 10000).toFixed(dayTotal >= 100000 ? 0 : 1)}만`
                        : formatKRW(dayTotal)}
                    </div>
                  )}
                  {entries.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {entries.slice(0, 3).map(e => {
                        const cat = getCategoryById(e.category)
                        return <span key={e.id} className="text-[10px]">{cat.icon}</span>
                      })}
                      {entries.length > 3 && <span className="text-[10px]" style={{ color: '#9a8e78' }}>+{entries.length - 3}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick add button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => { setAddDay(now.getDate()); setShowAddModal(true) }}
            className="px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #b06a4e, #8f5239)' }}>
            <span className="text-lg">+</span>
            오늘 지출 추가
          </button>
        </div>
      </div>

      {/* Day Panel */}
      {selectedDay && (
        <DayPanel
          day={selectedDay}
          month={month}
          year={year}
          entries={data[String(selectedDay)]}
          onAdd={() => handleAddFromDay(selectedDay)}
          onDelete={(id) => { deleteEntry(selectedDay, id) }}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <EntryModal
          day={addDay}
          year={year}
          month={month}
          onAdd={handleAddEntry}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Fixed Panel */}
      {showFixed && <FixedPanel onClose={() => setShowFixed(false)} />}

      {/* Stats Panel */}
      {showStats && <StatsPanel data={data} onClose={() => setShowStats(false)} />}
    </div>
  )
}
