export type MoodLevel = 1 | 2 | 3 | 4 | 5

export type GardenEntry = {
  date: string
  mood: MoodLevel
  energy: number
  memo: string
}

export type MoodOption = {
  value: MoodLevel
  label: string
  item: string
  emoji: string
  message: string
}

export const STORAGE_KEY = 'mood-garden-records'
export const MAX_MEMO_LENGTH = 80

export const moodOptions: MoodOption[] = [
  {
    value: 1,
    label: 'しずかな気分',
    item: '石',
    emoji: '🪨',
    message: '今日は休む力を育てる石。静けさも庭の大切な一部です。',
  },
  {
    value: 2,
    label: 'ゆっくり気分',
    item: '芽',
    emoji: '🌱',
    message: '小さな芽が土の中で準備中。ゆっくりで大丈夫。',
  },
  {
    value: 3,
    label: 'おだやか気分',
    item: '草',
    emoji: '🌿',
    message: 'やわらかな草が広がります。いつもの自分を支えています。',
  },
  {
    value: 4,
    label: '明るい気分',
    item: '花',
    emoji: '🌼',
    message: '花がひらきました。今日の明るさを庭に残します。',
  },
  {
    value: 5,
    label: 'きらめく気分',
    item: '灯り',
    emoji: '🏮',
    message: '灯りがともりました。元気な光が庭を照らします。',
  },
]

export const sampleEntries: GardenEntry[] = [
  { date: '2026-04-25', mood: 2, energy: 2, memo: '少し疲れたので早めに休む' },
  { date: '2026-04-26', mood: 3, energy: 3, memo: '散歩で風が気持ちよかった' },
  { date: '2026-04-27', mood: 4, energy: 4, memo: '小さな達成があった' },
  { date: '2026-04-28', mood: 1, energy: 1, memo: '静かな日。石を置いて見守る' },
  { date: '2026-04-29', mood: 5, energy: 5, memo: '庭に灯りを増やしたい気分' },
]

export function getTodayDate() {
  return new Date().toLocaleDateString('sv-SE')
}

function isMoodLevel(value: unknown): value is MoodLevel {
  return [1, 2, 3, 4, 5].includes(Number(value))
}

function normalizeEntry(entry: unknown): GardenEntry | null {
  if (!entry || typeof entry !== 'object') return null

  const candidate = entry as Partial<GardenEntry>
  const mood = Number(candidate.mood)
  const energy = Number(candidate.energy)

  if (
    typeof candidate.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) ||
    !isMoodLevel(mood) ||
    !Number.isInteger(energy) ||
    energy < 1 ||
    energy > 5
  ) {
    return null
  }

  return {
    date: candidate.date,
    mood,
    energy,
    memo: typeof candidate.memo === 'string' ? candidate.memo.slice(0, MAX_MEMO_LENGTH) : '',
  }
}

export function loadEntries(): GardenEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeEntry)
      .filter((entry): entry is GardenEntry => entry !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export function persistEntries(entries: GardenEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

export function moodByValue(value: MoodLevel) {
  return moodOptions.find((option) => option.value === value) ?? moodOptions[2]
}
