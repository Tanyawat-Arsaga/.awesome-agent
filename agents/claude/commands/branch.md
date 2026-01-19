---
allowed-tools: Bash(git branch:*), Bash(git checkout:*), Bash(git switch:*), Bash(git fetch:*), Bash(git status:*), Bash(git diff:*)
description: 変更内容から適切なブランチ名を提案してブランチを作成
---

## コンテキスト
- 現在のブランチ: !`git branch --show-current`
- 現在の変更差分: !`git diff HEAD --stat`
- リモートブランチ一覧: !`git branch -r | head -10`

## タスク

### 1. 分岐元ブランチの確認

- 現在のブランチを表示
- 「このブランチから分岐しますか？」と確認
- ユーザーが別のブランチを希望する場合は、分岐元ブランチを選択させる
  - main, develop などの一般的なブランチを選択肢として提示

### 2. 変更内容の分析

- `git diff HEAD` の内容を分析
- 変更の種類（機能追加、バグ修正、リファクタリングなど）を判断
- 変更の目的を推測

### 3. ブランチ名の生成

変更内容に基づいて、以下のルールでブランチ名を3つ提案:
- プレフィックス: `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/` など変更内容に応じて選択
- 命名規則: ケバブケース（小文字、ハイフン区切り）
- 簡潔で内容がわかる名前（英語）
- 例: `feature/add-user-authentication`, `fix/login-redirect-error`

### 4. ブランチの作成

- ユーザーがブランチ名を選択または指定
- 分岐元ブランチから新しいブランチを作成
  - `git fetch origin <分岐元ブランチ>` で最新を取得
  - `git checkout -b <新ブランチ名> origin/<分岐元ブランチ>` でブランチ作成
- 作成完了後、現在のブランチを表示して確認

## 注意事項

- ブランチ名は英語で作成
- 日本語での説明・確認は行う
- 既存のブランチ名と重複しないよう確認
