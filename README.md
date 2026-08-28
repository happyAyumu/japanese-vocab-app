# 日本語単語帳（Vocab App）

日本語の語彙学習用フラッシュカードアプリ。React + Vite + TypeScript + Tailwind CSS。

## セットアップ

```bash
cd vocab-app
npm install
npm run dev
```

## スクリプト

- `npm run dev` — 開発サーバーを起動
- `npm run build` — 型チェック＋本番ビルド
- `npm test` — Vitest でユニットテストを実行

## ディレクトリ構成

```
src/
  components/   # UIコンポーネント（カード・クイズ・進捗・単語追加・設定）
  data/         # seedWords.ts（初期20語）
  hooks/        # useVocabStore, useSRS, useDarkMode
  lib/          # srs.ts, parser.ts, quiz.ts, repository.ts（UIと分離、単体テスト付き）
  types/        # 型定義
  App.tsx
```

データは localStorage に保存されます（`VocabRepository` インターフェース経由なので、
将来 SQLite やバックエンド API に差し替え可能です）。設定画面から JSON でのエクスポート／
インポートもできます。
