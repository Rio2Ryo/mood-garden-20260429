import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import { STORAGE_KEY, loadEntries } from './garden'

const fixedDate = new Date('2026-04-29T09:00:00+09:00')

describe('気分で育つミニ庭', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    cleanup()
  })

  it('5段階の気分・エネルギー・80文字メモを今日の日付で保存し、同日記録を上書きする', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '気分で育つミニ庭' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)

    fireEvent.click(screen.getByLabelText(/きらめく気分/))
    fireEvent.change(screen.getByLabelText(/エネルギー/), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/メモ/), { target: { value: '庭に灯りを置く' } })
    fireEvent.click(screen.getByRole('button', { name: '今日の庭を保存' }))

    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(saved).toEqual([{ date: '2026-04-29', mood: 5, energy: 5, memo: '庭に灯りを置く' }])
    expect(screen.getByText(/灯りがともりました/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/しずかな気分/))
    fireEvent.change(screen.getByLabelText(/メモ/), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/メモ/), { target: { value: '静かに休む' } })
    fireEvent.click(screen.getByRole('button', { name: '今日の庭を保存' }))

    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ date: '2026-04-29', mood: 1, memo: '静かに休む' })
    expect(screen.getByText(/休む力を育てる石/)).toBeInTheDocument()
  })

  it('サンプル追加、庭アイテム詳細表示、確認後の個別削除、確認後の全データ削除ができる', () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'サンプル追加' }))
    expect(screen.getByText('5日分')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /2026-04-28の詳細を表示/ }))
    const detail = screen.getByLabelText('庭アイテムの詳細')
    expect(within(detail).getByText('2026-04-28')).toBeInTheDocument()
    expect(within(detail).getByText(/しずかな気分/)).toBeInTheDocument()
    expect(within(detail).getByText('静かな日。石を置いて見守る')).toBeInTheDocument()

    confirmSpy.mockReturnValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: '2026-04-28を削除' }))
    expect(screen.getByRole('button', { name: '2026-04-28を削除' })).toBeInTheDocument()
    expect(screen.getByText('5日分')).toBeInTheDocument()

    confirmSpy.mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: '2026-04-28を削除' }))
    expect(confirmSpy).toHaveBeenCalledWith('2026-04-28の記録を削除しますか？')
    expect(screen.queryByRole('button', { name: '2026-04-28を削除' })).not.toBeInTheDocument()
    expect(screen.getByText('4日分')).toBeInTheDocument()

    confirmSpy.mockReturnValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: '全データ削除' }))
    expect(screen.getByText('4日分')).toBeInTheDocument()

    confirmSpy.mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: '全データ削除' }))
    expect(confirmSpy).toHaveBeenCalledWith('すべての庭データを削除しますか？')
    expect(screen.getByText('履歴はありません。')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([])
  })

  it('破損JSONやlocalStorageエラーに耐える', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(loadEntries()).toEqual([])

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '今日の庭を保存' }))

    expect(screen.getByRole('status')).toHaveTextContent('保存先に書き込めませんでした')
    expect(screen.getByText('1日分')).toBeInTheDocument()
    setItemSpy.mockRestore()
  })

  it('Reactレンダリング例外時にError Boundaryの簡易フォールバックを表示する', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const BrokenView = () => {
      throw new Error('render failed')
    }

    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('画面の表示中に問題が発生しました')
    expect(screen.getByText('ページを再読み込みしてください。保存済みの記録はブラウザに残っています。')).toBeInTheDocument()
    consoleErrorSpy.mockRestore()
  })
})
