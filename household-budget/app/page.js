'use client'

import { useState, useEffect, useCallback } from 'react'
import { FIXED_EXPENSES, VARIABLE_CATEGORIES, formatKRW, getCategoryById } from './constants'

const today = () => new Date()
const key = (y, m) => `budget_${y}_${m < 10 ? '0' + m : m}`
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOfWeek(year, month) { return new Date(year, month, 1).getDay() }

// ─── 고정비 hook ──────────────────────────────────────────────────────────────
function useFixedExpenses() {
  const [fixed, setFixed] = useState(FIXED_EXPENSES)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fixed_expenses')
      if (raw) setFixed(JSON.parse(raw))
    } catch {}
  }, [])

  const persist = (data) => {
    try { localStorage.setItem('fixed_expenses', JSON.stringify(data)) } catch {}
  }

  const updateItem = useCallback((id, fields) => {
    setFixed(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...fields } : e)
      persist(next); return next
    })
  }, [])

  const addItem = useCallback((item) => {
    setFixed(prev => { const next = [...prev, item]; persist(next); return next })
  }, [])

  const removeItem = useCallback((id) => {
    setFixed(prev => { const next = prev.filter(e => e.id !== id); persist(next); return next })
  }, [])

  return { fixed, updateItem, addItem, removeItem }
}

// ─── 저축 hook ───────────────────────────────────────────────────────────────
function useSavings() {
  const [monthSavings, setMonthSavings] = useState({}) // { '2026_05': 300000, ... }
  const [targetAmount, setTargetAmount] = useState(200000000) // 매매자금 목표

  useEffect(() => {
    try {
      const ms = localStorage.getItem('month_savings')
      const ta = localStorage.getItem('target_amount')
      if (ms) setMonthSavings(JSON.parse(ms))
      if (ta) setTargetAmount(Number(ta))
    } catch {}
  }, [])

  const setMonthSaving = useCallback((year, month, amount) => {
    setMonthSavings(prev => {
      const k = `${year}_${String(month + 1).padStart(2, '0')}`
      const next = { ...prev, [k]: amount }
      try { localStorage.setItem('month_savings', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const getMonthSaving = useCallback((year, month) => {
    const k = `${year}_${String(month + 1).padStart(2, '0')}`
    return monthSavings[k] || 0
  }, [monthSavings])

  const totalSavings = Object.values(monthSavings).reduce((s, v) => s + v, 0)

  const updateTarget = useCallback((amount) => {
    setTargetAmount(amount)
    try { localStorage.setItem('target_amount', String(amount)) } catch {}
  }, [])

  return { getMonthSaving, setMonthSaving, totalSavings, targetAmount, updateTarget }
}

// ─── 변동비 월 데이터 hook ────────────────────────────────────────────────────
function useMonthData(year, month) {
  const [data, setData] = useState({})
  const storageKey = key(year, month)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setData(raw ? JSON.parse(raw) : {})
    } catch { setData({}) }
  }, [storageKey])

  const addEntry = useCallback((day, entry) => {
    setData(prev => {
      const next = { ...prev, [String(day)]: [...(prev[String(day)] || []), { ...entry, id: Date.now() }] }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [storageKey])

  const deleteEntry = useCallback((day, entryId) => {
    setData(prev => {
      const next = { ...prev, [String(day)]: (prev[String(day)] || []).filter(e => e.id !== entryId) }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [storageKey])

  const monthTotal = Object.values(data).flat().reduce((s, e) => s + (e.amount || 0), 0)
  return { data, addEntry, deleteEntry, monthTotal }
}

// ─── 지출 추가 모달 ───────────────────────────────────────────────────────────
function EntryModal({ day, year, month, onAdd, onClose }) {
  const [category, setCategory] = useState(VARIABLE_CATEGORIES[0].id)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [who, setWho] = useState('공동')

  const fmt = (v) => { const n = v.replace(/[^0-9]/g, ''); return n ? Number(n).toLocaleString() : '' }

  const handleSubmit = (e) => {
    e.preventDefault()
    const amt = Number(amount.replace(/,/g, ''))
    if (!amt) return
    onAdd(day, { category, amount: amt, memo, who })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#2c2415' }}>{month + 1}월 {day}일 지출 추가</h3>
            <p className="text-sm mt-0.5" style={{ color: '#7a6e5a' }}>누가 어디에 썼나요?</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#f0e9d2', color: '#7a6e5a' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>사용자</label>
            <div className="flex gap-2">
              {['공동', '남규', '다경'].map(w => (
                <button key={w} type="button" onClick={() => setWho(w)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: who === w ? '#5d8a62' : '#f0e9d2', color: who === w ? '#fff' : '#7a6e5a', border: who === w ? '1.5px solid #5d8a62' : '1.5px solid #e8e0d0' }}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>카테고리</label>
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {VARIABLE_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                  className="py-2 px-1 rounded-xl text-center transition-all"
                  style={{ background: category === cat.id ? cat.color + '20' : '#f9f5eb', border: category === cat.id ? `1.5px solid ${cat.color}` : '1.5px solid transparent' }}>
                  <div className="text-lg">{cat.icon}</div>
                  <div className="text-[10px] mt-0.5 font-medium" style={{ color: category === cat.id ? cat.color : '#7a6e5a' }}>{cat.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>금액</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: '#7a6e5a' }}>₩</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(fmt(e.target.value))}
                placeholder="0" required className="w-full pl-9 pr-4 py-3 rounded-xl text-right text-lg font-bold outline-none"
                style={{ background: '#f0e9d2', border: '1.5px solid #e8e0d0', color: '#2c2415' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#7a6e5a' }}>메모 (선택)</label>
            <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="어디서 썼나요?"
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#f0e9d2', border: '1.5px solid #e8e0d0', color: '#2c2415' }} />
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-white active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #5d8a62, #4a7050)' }}>추가하기</button>
        </form>
      </div>
    </div>
  )
}

// ─── 날짜 상세 패널 ───────────────────────────────────────────────────────────
function DayPanel({ day, month, year, entries, onAdd, onDelete, onClose }) {
  const dayTotal = (entries || []).reduce((s, e) => s + e.amount, 0)
  const d = new Date(year, month, day)
  const dayName = ['일','월','화','수','목','금','토'][d.getDay()]
  const isWeekend = d.getDay() === 0 || d.getDay() === 6

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#f9f5eb', borderBottom: '1px solid #e8e0d0' }}>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black" style={{ color: isWeekend ? '#b06a4e' : '#2c2415' }}>{day}</span>
              <span className="text-sm font-medium" style={{ color: '#7a6e5a' }}>{month + 1}월 {dayName}요일</span>
            </div>
            {dayTotal > 0 && <p className="text-sm font-semibold mt-0.5" style={{ color: '#b06a4e' }}>합계 {formatKRW(dayTotal)}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onAdd} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#5d8a62' }}>+ 추가</button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e8e0d0', color: '#7a6e5a' }}>✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(!entries || entries.length === 0) ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">🌿</div>
              <p className="text-sm font-medium" style={{ color: '#7a6e5a' }}>이날은 지출이 없어요</p>
            </div>
          ) : entries.map(entry => {
            const cat = getCategoryById(entry.category)
            const whoColors = { '남규': '#4a90b8', '다경': '#e05a7a', '공동': '#5d8a62' }
            return (
              <div key={entry.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{ background: '#fff', border: '1px solid #e8e0d0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: cat.color + '18' }}>{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#2c2415' }}>{cat.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: (whoColors[entry.who] || '#5d8a62') + '18', color: whoColors[entry.who] || '#5d8a62' }}>{entry.who}</span>
                  </div>
                  {entry.memo && <p className="text-xs mt-0.5 truncate" style={{ color: '#9a8e78' }}>{entry.memo}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: '#b06a4e' }}>{formatKRW(entry.amount)}</p>
                  <button onClick={() => onDelete(entry.id)} className="text-xs mt-0.5" style={{ color: '#b0a890' }}>삭제</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── 고정비 관리 패널 ─────────────────────────────────────────────────────────
const ICON_OPTIONS = ['🏠','📡','🚗','📱','📺','💡','🔥','💧','📷','🧹','🏥','🍽️','📦','💳','🎓','🐾','🎬','✂️','🏋️','🎁','💰','📌','📝','🎵','🌿','⚡']

function FixedPanel({ fixed, fixedTotal, onUpdate, onAdd, onRemove, onClose }) {
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newIcon, setNewIcon] = useState('📝')
  const [showNewIconPicker, setShowNewIconPicker] = useState(false)

  const fmt = (v) => { const n = v.replace(/[^0-9]/g, ''); return n ? Number(n).toLocaleString() : '' }

  const startEdit = (exp) => {
    setEditId(exp.id); setEditName(exp.name)
    setEditAmount(exp.amount.toLocaleString()); setEditIcon(exp.icon)
    setShowIconPicker(false); setShowAdd(false)
  }

  const saveEdit = () => {
    const amt = Number(editAmount.replace(/,/g, ''))
    if (!editName || !amt) return
    onUpdate(editId, { name: editName, amount: amt, icon: editIcon })
    setEditId(null)
  }

  const handleAdd = () => {
    const amt = Number(newAmount.replace(/,/g, ''))
    if (!newName || !amt) return
    onAdd({ id: `custom_${Date.now()}`, name: newName, amount: amt, icon: newIcon, color: '#7a9e7e' })
    setNewName(''); setNewAmount(''); setNewIcon('📝'); setShowAdd(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: '#f9f5eb', borderBottom: '1px solid #e8e0d0' }}>
          <div>
            <h3 className="text-lg font-black" style={{ color: '#2c2415' }}>📌 고정비 관리</h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#b06a4e' }}>월 합계 {formatKRW(fixedTotal)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(v => !v); setEditId(null) }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: showAdd ? '#5d8a62' : '#e8e0d0', color: showAdd ? '#fff' : '#7a6e5a' }}>
              {showAdd ? '취소' : '+ 추가'}
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#e8e0d0', color: '#7a6e5a' }}>✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">

          {/* 새 항목 추가 폼 */}
          {showAdd && (
            <div className="p-4 rounded-2xl space-y-3 animate-slideUp"
              style={{ background: '#fff', border: '2px solid #5d8a62' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5d8a62' }}>새 고정비 추가</p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7a6e5a' }}>아이콘</label>
                <button type="button" onClick={() => setShowNewIconPicker(v => !v)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
                  style={{ background: '#f0e9d2', border: '1.5px solid #e0d4b8' }}>{newIcon}</button>
                {showNewIconPicker && (
                  <div className="mt-2 p-2 rounded-xl flex flex-wrap gap-1.5"
                    style={{ background: '#f9f5eb', border: '1px solid #e8e0d0' }}>
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => { setNewIcon(ic); setShowNewIconPicker(false) }}
                        className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                        style={{ background: newIcon === ic ? '#5d8a62' : '#fff' }}>{ic}</button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7a6e5a' }}>항목명</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="예: 헬스장, 넷플릭스..."
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{ background: '#f0e9d2', border: '1.5px solid #e8e0d0', color: '#2c2415' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7a6e5a' }}>월 금액</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: '#7a6e5a' }}>₩</span>
                  <input type="text" inputMode="numeric" value={newAmount} onChange={e => setNewAmount(fmt(e.target.value))}
                    placeholder="0" className="w-full pl-8 pr-3 py-2.5 rounded-xl text-right outline-none font-bold text-sm"
                    style={{ background: '#f0e9d2', border: '1.5px solid #e8e0d0', color: '#2c2415' }} />
                </div>
              </div>
              <button onClick={handleAdd} className="w-full py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#5d8a62' }}>추가하기</button>
            </div>
          )}

          {/* 기존 항목 목록 */}
          {fixed.map(exp => (
            <div key={exp.id}>
              {editId === exp.id ? (
                /* 수정 모드 */
                <div className="p-4 rounded-2xl space-y-3 animate-slideUp"
                  style={{ background: '#fff', border: '2px solid #c9943a' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#c9943a' }}>수정 중</p>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7a6e5a' }}>아이콘</label>
                    <button type="button" onClick={() => setShowIconPicker(v => !v)}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
                      style={{ background: '#f0e9d2', border: '1.5px solid #c9943a' }}>{editIcon}</button>
                    {showIconPicker && (
                      <div className="mt-2 p-2 rounded-xl flex flex-wrap gap-1.5"
                        style={{ background: '#f9f5eb', border: '1px solid #e8e0d0' }}>
                        {ICON_OPTIONS.map(ic => (
                          <button key={ic} onClick={() => { setEditIcon(ic); setShowIconPicker(false) }}
                            className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                            style={{ background: editIcon === ic ? '#c9943a' : '#fff' }}>{ic}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7a6e5a' }}>항목명</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                      style={{ background: '#f0e9d2', border: '1.5px solid #c9943a', color: '#2c2415' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7a6e5a' }}>월 금액</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: '#7a6e5a' }}>₩</span>
                      <input type="text" inputMode="numeric" value={editAmount} onChange={e => setEditAmount(fmt(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-right outline-none font-bold text-sm"
                        style={{ background: '#f0e9d2', border: '1.5px solid #c9943a', color: '#2c2415' }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: '#f0e9d2', color: '#7a6e5a' }}>취소</button>
                    <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: '#c9943a' }}>저장</button>
                  </div>
                </div>
              ) : (
                /* 일반 표시 */
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: '#fff', border: '1px solid #e8e0d0' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: (exp.color || '#7a9e7e') + '18' }}>{exp.icon}</div>
                  <span className="flex-1 text-sm font-medium" style={{ color: '#2c2415' }}>{exp.name}</span>
                  <span className="font-bold text-sm mr-1" style={{ color: '#7a6e5a' }}>{formatKRW(exp.amount)}</span>
                  <button onClick={() => startEdit(exp)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: '#fef3e2', color: '#c9943a' }}>✏️</button>
                  <button onClick={() => onRemove(exp.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: '#fef0ee', color: '#b06a4e' }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 통계 패널 ────────────────────────────────────────────────────────────────
function StatsPanel({ data, fixedTotal, onClose }) {
  const entries = Object.values(data).flat()
  const byCategory = {}
  entries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount })
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, e) => s + e.amount, 0)
  const byWho = {}
  entries.forEach(e => { byWho[e.who] = (byWho[e.who] || 0) + e.amount })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(44,36,21,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-slideUp"
        style={{ background: '#fdfcf7', border: '1px solid #e8e0d0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#f9f5eb', borderBottom: '1px solid #e8e0d0' }}>
          <div>
            <h3 className="text-lg font-black" style={{ color: '#2c2415' }}>📊 이번달 통계</h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#b06a4e' }}>변동비 합계 {formatKRW(total)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#e8e0d0', color: '#7a6e5a' }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(byWho).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7a6e5a' }}>인별 사용</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(byWho).map(([who, amt]) => {
                  const colors = { '남규': '#4a90b8', '다경': '#e05a7a', '공동': '#5d8a62' }
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
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
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
          {total > 0 && (
            <div className="p-4 rounded-xl" style={{ background: '#f0e9d2', border: '1px solid #e0d4b8' }}>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: '#7a6e5a' }}>변동비</span>
                <span className="font-bold" style={{ color: '#2c2415' }}>{formatKRW(total)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: '#7a6e5a' }}>고정비</span>
                <span className="font-bold" style={{ color: '#2c2415' }}>{formatKRW(fixedTotal)}</span>
              </div>
              <div className="h-px my-2" style={{ background: '#d4c9b4' }} />
              <div className="flex justify-between">
                <span className="text-sm font-bold" style={{ color: '#7a6e5a' }}>이번달 총 지출</span>
                <span className="font-black text-base" style={{ color: '#b06a4e' }}>{formatKRW(total + fixedTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 메인 앱 ──────────────────────────────────────────────────────────────────
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
  const { fixed, updateItem, addItem, removeItem } = useFixedExpenses()
  const fixedTotal = fixed.reduce((s, e) => s + e.amount, 0)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(now.getFullYear())
  const { getMonthSaving, setMonthSaving, totalSavings, targetAmount, updateTarget } = useSavings()
  const [editSaving, setEditSaving] = useState(false)
  const [editTarget, setEditTarget] = useState(false)
  const [savingInput, setSavingInput] = useState('')
  const [targetInput, setTargetInput] = useState('')

  const thisMonthSaving = getMonthSaving(year, month)
  const savingPct = targetAmount > 0 ? Math.min(100, (totalSavings / targetAmount) * 100) : 0
  const fmt = (v) => { const n = v.replace(/[^0-9]/g,''); return n ? Number(n).toLocaleString() : '' }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  return (
    <div className="min-h-screen" style={{ background: '#fdfcf7' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e0d0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black" style={{ color: '#2c2415' }}>🏡 우리집 가계부</h1>
              <p className="text-xs" style={{ color: '#9a8e78' }}>남규 & 다경의 기록장</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFixed(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: '#f0e9d2', color: '#7a6e5a', border: '1px solid #e0d4b8' }}>📌 고정비</button>
              <button onClick={() => setShowStats(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: '#f0e9d2', color: '#7a6e5a', border: '1px solid #e0d4b8' }}>📊 통계</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* 요약 카드 */}
        <div className="mt-4 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #5d8a62, #4a7050)', color: '#fff' }}>

          {/* 연월 네비게이션 */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">←</button>
            <button onClick={() => { setShowMonthPicker(v => !v); setPickerYear(year) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-xl font-black">{year}년 {monthNames[month]}</span>
              <span className="text-sm opacity-70">{showMonthPicker ? '▲' : '▼'}</span>
            </button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">→</button>
          </div>

          {/* 연월 피커 드롭다운 */}
          {showMonthPicker && (
            <div className="mx-4 mb-3 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center justify-between px-3 py-2">
                <button onClick={() => setPickerYear(y => y - 1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">←</button>
                <span className="text-sm font-bold">{pickerYear}년</span>
                <button onClick={() => setPickerYear(y => y + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">→</button>
              </div>
              <div className="grid grid-cols-6 gap-1 px-2 pb-2">
                {monthNames.map((mn, mi) => (
                  <button key={mi}
                    onClick={() => { setYear(pickerYear); setMonth(mi); setShowMonthPicker(false); setSelectedDay(null) }}
                    className="py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: pickerYear === year && mi === month ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                      color: pickerYear === year && mi === month ? '#4a7050' : '#fff',
                    }}>{mi + 1}월</button>
                ))}
              </div>
            </div>
          )}

          {/* 변동비 / 고정비 */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-xs opacity-80 mb-1">변동비</p>
              <p className="text-lg font-black">{formatKRW(monthTotal)}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-xs opacity-80 mb-1">고정비</p>
              <p className="text-lg font-black">{formatKRW(fixedTotal)}</p>
            </div>
          </div>

          {/* 총 지출 */}
          <div className="px-4 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-80">이번달 총 지출</span>
              <span className="text-xl font-black">{formatKRW(monthTotal + fixedTotal)}</span>
            </div>
          </div>

          {/* 이번달 저축 / 총 저축 */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
            {/* 이번달 저축 */}
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-xs opacity-80 mb-1">이번달 저축</p>
              {editSaving ? (
                <div className="flex items-center gap-1">
                  <input autoFocus type="text" inputMode="numeric"
                    value={savingInput}
                    onChange={e => setSavingInput(fmt(e.target.value))}
                    onBlur={() => { setMonthSaving(year, month, Number(savingInput.replace(/,/g,''))); setEditSaving(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') { setMonthSaving(year, month, Number(savingInput.replace(/,/g,''))); setEditSaving(false) } }}
                    className="w-full bg-transparent outline-none font-black text-sm text-white border-b border-white/50"
                    placeholder="0"
                    style={{ color: '#fff' }}
                  />
                </div>
              ) : (
                <button onClick={() => { setSavingInput(thisMonthSaving.toLocaleString()); setEditSaving(true) }}
                  className="text-left w-full">
                  <p className="text-lg font-black">{formatKRW(thisMonthSaving)}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">탭하여 수정 ✏️</p>
                </button>
              )}
            </div>

            {/* 총 저축 */}
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-xs opacity-80 mb-1">총 저축액</p>
              <p className="text-lg font-black">{formatKRW(totalSavings)}</p>
              <p className="text-[10px] opacity-60 mt-0.5">전체 누적</p>
            </div>
          </div>

          {/* 매매자금 목표 게이지 */}
          <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold opacity-90">🏠 매매자금 목표</span>
              {editTarget ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-70">₩</span>
                  <input autoFocus type="text" inputMode="numeric"
                    value={targetInput}
                    onChange={e => setTargetInput(fmt(e.target.value))}
                    onBlur={() => { updateTarget(Number(targetInput.replace(/,/g,''))); setEditTarget(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') { updateTarget(Number(targetInput.replace(/,/g,''))); setEditTarget(false) } }}
                    className="bg-transparent outline-none font-bold text-sm border-b border-white/50 w-28 text-right"
                    style={{ color: '#fff' }}
                  />
                </div>
              ) : (
                <button onClick={() => { setTargetInput(targetAmount.toLocaleString()); setEditTarget(true) }}
                  className="text-sm font-bold opacity-90 flex items-center gap-1">
                  {formatKRW(targetAmount)} <span className="text-[10px] opacity-60">✏️</span>
                </button>
              )}
            </div>
            {/* 게이지 바 */}
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${savingPct}%`,
                  background: savingPct >= 100 ? '#f0c040' : 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.9))'
                }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs opacity-70">{formatKRW(totalSavings)} 달성</span>
              <span className="text-xs font-bold">{savingPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e0d0' }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e8e0d0' }}>
            {['일','월','화','수','목','금','토'].map((d, i) => (
              <div key={d} className="py-2.5 text-center text-xs font-bold"
                style={{ color: i === 0 ? '#b06a4e' : i === 6 ? '#4a90b8' : '#9a8e78' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="min-h-[60px] border-r border-b" style={{ borderColor: '#f0e9d2', background: '#fdfcf7' }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const col = (firstDay + day - 1) % 7
              const entries = data[String(day)] || []
              const dayTotal = entries.reduce((s, e) => s + e.amount, 0)
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
              const isSelected = selectedDay === day
              return (
                <div key={day} onClick={() => setSelectedDay(day)}
                  className="min-h-[60px] p-1.5 cursor-pointer transition-all border-r border-b"
                  style={{ borderColor: '#f0e9d2', background: isSelected ? '#f0e9d2' : 'transparent' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                    style={{
                      background: isToday ? '#5d8a62' : 'transparent',
                      color: isToday ? '#fff' : col === 0 ? '#b06a4e' : col === 6 ? '#4a90b8' : '#2c2415',
                    }}>{day}</div>
                  {dayTotal > 0 && (
                    <div className="text-[10px] font-bold" style={{ color: '#b06a4e' }}>
                      {dayTotal >= 10000 ? `${(dayTotal/10000).toFixed(dayTotal>=100000?0:1)}만` : formatKRW(dayTotal)}
                    </div>
                  )}
                  {entries.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {entries.slice(0,3).map(e => <span key={e.id} className="text-[10px]">{getCategoryById(e.category).icon}</span>)}
                      {entries.length > 3 && <span className="text-[10px]" style={{ color: '#9a8e78' }}>+{entries.length-3}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button onClick={() => { setAddDay(now.getDate()); setShowAddModal(true) }}
            className="px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #b06a4e, #8f5239)' }}>
            <span className="text-lg">+</span> 오늘 지출 추가
          </button>
        </div>
      </div>

      {selectedDay && (
        <DayPanel day={selectedDay} month={month} year={year}
          entries={data[String(selectedDay)]}
          onAdd={() => { setAddDay(selectedDay); setShowAddModal(true); setSelectedDay(null) }}
          onDelete={(id) => deleteEntry(selectedDay, id)}
          onClose={() => setSelectedDay(null)} />
      )}
      {showAddModal && (
        <EntryModal day={addDay} year={year} month={month}
          onAdd={addEntry} onClose={() => setShowAddModal(false)} />
      )}
      {showFixed && (
        <FixedPanel fixed={fixed} fixedTotal={fixedTotal}
          onUpdate={updateItem} onAdd={addItem} onRemove={removeItem}
          onClose={() => setShowFixed(false)} />
      )}
      {showStats && (
        <StatsPanel data={data} fixedTotal={fixedTotal} onClose={() => setShowStats(false)} />
      )}
    </div>
  )
}
