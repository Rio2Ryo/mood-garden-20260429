# 気分で育つミニ庭

今日の気分・エネルギー・短いメモを、やさしい庭アイテムとしてブラウザに保存するローカル完結型のミニWebアプリです。

- 5段階の気分選択
- エネルギー 1〜5
- 80文字以内メモ
- localStorage保存（同日記録は上書き）
- 庭アイテムクリックで詳細表示
- 履歴、個別削除、全削除、サンプル追加
- 外部API/外部フォントなし

## 開発

```bash
npm install
npm run dev
```

## 検証

```bash
npm run check
npm audit --audit-level=moderate
```

`npm run check` は lint / test / build を実行します。

## デプロイ

Vercel向け設定は `vercel.json` に含まれています。

```bash
vercel --prod --yes
```
