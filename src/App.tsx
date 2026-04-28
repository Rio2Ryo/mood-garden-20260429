import { useMemo, useState } from 'react'
import {
  MAX_MEMO_LENGTH,
  type GardenEntry,
  type MoodLevel,
  getTodayDate,
  loadEntries,
  moodByValue,
  moodOptions,
  persistEntries,
  sampleEntries,
} from './garden'
import './App.css'

function GardenItem({ entry, onSelect }: { entry: GardenEntry; onSelect: (entry: GardenEntry) => void }) {
  const mood = moodByValue(entry.mood)

  return (
    <button
      type="button"
      className={`garden-item mood-${entry.mood}`}
      onClick={() => onSelect(entry)}
      aria-label={`${entry.date}の詳細を表示: ${mood.item}`}
      title={`${entry.date} ${mood.label}`}
    >
      <span className="garden-emoji" aria-hidden="true">
        {mood.emoji}
      </span>
      <span className="garden-date">{entry.date.slice(5)}</span>
    </button>
  )
}

function App() {
  const [entries, setEntries] = useState<GardenEntry[]>(() => loadEntries())
  const [mood, setMood] = useState<MoodLevel>(3)
  const [energy, setEnergy] = useState(3)
  const [memo, setMemo] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<GardenEntry | null>(null)
  const [notice, setNotice] = useState('')

  const today = getTodayDate()
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)), [entries])
  const selectedMood = moodByValue(mood)

  const updateEntries = (nextEntries: GardenEntry[], successMessage: string) => {
    const normalized = [...nextEntries].sort((a, b) => b.date.localeCompare(a.date))
    setEntries(normalized)
    const saved = persistEntries(normalized)
    setNotice(saved ? successMessage : '保存先に書き込めませんでした。画面上では変更を保持しています。')
  }

  const handleSave = () => {
    const entry: GardenEntry = { date: today, mood, energy, memo: memo.trim().slice(0, MAX_MEMO_LENGTH) }
    const withoutToday = entries.filter((item) => item.date !== today)
    updateEntries([entry, ...withoutToday], `${today}の庭を保存しました。同じ日の記録は上書きされます。`)
    setSelectedEntry(entry)
  }

  const handleDelete = (date: string) => {
    if (!window.confirm(`${date}の記録を削除しますか？`)) return

    const nextEntries = entries.filter((entry) => entry.date !== date)
    updateEntries(nextEntries, `${date}の記録を削除しました。`)
    if (selectedEntry?.date === date) setSelectedEntry(null)
  }

  const handleAddSamples = () => {
    const merged = [...entries]
    sampleEntries.forEach((sample) => {
      const index = merged.findIndex((entry) => entry.date === sample.date)
      if (index >= 0) merged[index] = sample
      else merged.push(sample)
    })
    updateEntries(merged, 'サンプルの庭データを追加しました。')
  }

  const handleClearAll = () => {
    if (!window.confirm('すべての庭データを削除しますか？')) return

    updateEntries([], 'すべての庭データを削除しました。')
    setSelectedEntry(null)
  }

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <p className="eyebrow">Mood Garden</p>
        <h1>気分で育つミニ庭</h1>
        <p className="lead">
          今日の気分とエネルギーを小さな庭アイテムとして保存します。重い日も、静かな石や芽として肯定的に残せます。
        </p>
      </header>

      <section className="card input-card" aria-labelledby="today-form-title">
        <div className="section-heading">
          <h2 id="today-form-title">今日の記録</h2>
          <span className="today-badge">{today}</span>
        </div>

        <fieldset className="choice-group">
          <legend>5段階の気分選択</legend>
          <div className="mood-options">
            {moodOptions.map((option) => (
              <label key={option.value} className={mood === option.value ? 'selected option-card' : 'option-card'}>
                <input
                  type="radio"
                  name="mood"
                  value={option.value}
                  checked={mood === option.value}
                  onChange={() => setMood(option.value)}
                />
                <span aria-hidden="true">{option.emoji}</span>
                <strong>{option.label}</strong>
                <small>{option.item}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="energy">
          エネルギー: {energy} / 5
        </label>
        <input
          id="energy"
          type="range"
          min="1"
          max="5"
          step="1"
          value={energy}
          onChange={(event) => setEnergy(Number(event.target.value))}
        />

        <label className="field-label" htmlFor="memo">
          メモ（80文字以内）
        </label>
        <textarea
          id="memo"
          maxLength={MAX_MEMO_LENGTH}
          value={memo}
          onChange={(event) => setMemo(event.target.value.slice(0, MAX_MEMO_LENGTH))}
          placeholder="今日の小さなことを書いてください"
        />
        <div className="memo-count" aria-live="polite">
          {memo.length} / {MAX_MEMO_LENGTH}
        </div>

        <p className="affirmation" aria-live="polite">
          {selectedMood.message}
        </p>
        <button type="button" className="primary-button" onClick={handleSave}>
          今日の庭を保存
        </button>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </section>

      <section className="card garden-card" aria-labelledby="garden-title">
        <div className="section-heading">
          <h2 id="garden-title">ミニ庭</h2>
          <span>{entries.length}日分</span>
        </div>
        {entries.length === 0 ? (
          <p className="empty-state">まだ庭はまっさらです。今日の気分を保存するか、サンプルを追加してください。</p>
        ) : (
          <div className="garden-grid" aria-label="保存された庭アイテム">
            {sortedEntries.map((entry) => (
              <GardenItem key={entry.date} entry={entry} onSelect={setSelectedEntry} />
            ))}
          </div>
        )}

        {selectedEntry && (
          <aside className="detail-box" aria-label="庭アイテムの詳細">
            <h3>選択中の記録</h3>
            <dl>
              <div>
                <dt>日付</dt>
                <dd>{selectedEntry.date}</dd>
              </div>
              <div>
                <dt>気分</dt>
                <dd>
                  {moodByValue(selectedEntry.mood).emoji} {moodByValue(selectedEntry.mood).label}
                </dd>
              </div>
              <div>
                <dt>エネルギー</dt>
                <dd>{selectedEntry.energy} / 5</dd>
              </div>
              <div>
                <dt>メモ</dt>
                <dd>{selectedEntry.memo || 'メモなし'}</dd>
              </div>
            </dl>
          </aside>
        )}
      </section>

      <section className="card history-card" aria-labelledby="history-title">
        <div className="section-heading">
          <h2 id="history-title">履歴一覧</h2>
          <div className="actions">
            <button type="button" onClick={handleAddSamples}>
              サンプル追加
            </button>
            <button type="button" className="danger-button" onClick={handleClearAll} disabled={entries.length === 0}>
              全データ削除
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="empty-state">履歴はありません。</p>
        ) : (
          <ul className="history-list">
            {sortedEntries.map((entry) => {
              const entryMood = moodByValue(entry.mood)
              return (
                <li key={entry.date}>
                  <button type="button" className="history-select" onClick={() => setSelectedEntry(entry)}>
                    <span aria-hidden="true">{entryMood.emoji}</span>
                    <span>
                      <strong>{entry.date}</strong>
                      <small>
                        {entryMood.label}・エネルギー{entry.energy}
                      </small>
                    </span>
                  </button>
                  <button type="button" className="delete-button" onClick={() => handleDelete(entry.date)}>
                    {entry.date}を削除
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
