Pull Requestをレビューして、問題がなければapproveしてください。

## 手順

### 1. レビュー対象のPRを特定

引数がある場合（$ARGUMENTS）:
- URLまたはPR番号として `gh pr view $ARGUMENTS --json number,title,baseRefName,headRefName,author` でPR情報を取得
- 例: `https://github.com/owner/repo/pull/123` または `123`

引数がない場合:
- `git branch --show-current` で現在のブランチを取得
- `gh pr list --head <current-branch> --json number,title,baseRefName,url` で現在のブランチに関連するPRを検索
- PRが複数ある場合はユーザーに選択させる
- PRがない場合は「このブランチにはPRがありません」と表示して終了

### 2. PRの概要を確認

- `gh pr view <PR番号> --json title,body,baseRefName,headRefName,author,files` でPR情報を取得
- タイトル、説明、変更ファイル数を表示

### 3. 変更内容を確認

- `gh pr diff <PR番号>` で差分を取得
- 変更されたファイルを一つずつ確認

### 4. レビュー観点

以下の観点でコードをレビュー:

- **バグ・ロジックエラー**: 明らかなバグや論理的な誤り
- **セキュリティ**: SQLインジェクション、XSS、認証/認可の問題など
- **パフォーマンス**: N+1クエリ、不要なループ、メモリリークの可能性
- **エラーハンドリング**: 例外処理の漏れ、エラーメッセージの適切さ
- **コード品質**: 可読性、命名規則、重複コード
- **テスト**: テストの有無、カバレッジ、エッジケース

### 5. レビュー結果を報告

問題点がある場合:
- 具体的なファイルと行番号を示して指摘
- 重要度（Critical/Major/Minor/Suggestion）を明示
- 修正案があれば提示

### 6. レビュー結果をPRにコメント

レビュー結果を以下のフォーマットでPRにコメント:

```markdown
## レビュー結果

### 概要
[変更内容の要約と全体的な評価]

### 指摘事項
[問題がある場合のみ記載]

#### Critical（重大）
- [ ] `ファイル名:行番号` - 指摘内容

#### Major（主要）
- [ ] `ファイル名:行番号` - 指摘内容

#### Minor（軽微）
- [ ] `ファイル名:行番号` - 指摘内容

#### Suggestion（提案）
- [ ] `ファイル名:行番号` - 提案内容

### 良い点
[良い点があれば記載]

---
🤖 Reviewed by Claude Code
```

### 7. ユーザーに確認してレビューを送信

レビュー結果をユーザーに報告し、以下を確認:
- 問題なし → 「approveしますか？」と確認
- 問題あり → 「request changesしますか？」と確認

ユーザーの承認後:
- approve: `gh pr review <PR番号> --approve --body "<レビューコメント>"`
- request changes: `gh pr review <PR番号> --request-changes --body "<指摘事項>"`
- comment only: `gh pr review <PR番号> --comment --body "<コメント>"`

## 注意事項

- 日本語でレビューコメントを記載
- 些細なスタイルの問題は指摘しすぎない
- 良い点があれば積極的に言及する
- 判断に迷う場合はユーザーに相談する
