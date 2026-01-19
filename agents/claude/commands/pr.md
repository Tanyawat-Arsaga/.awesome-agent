
PRのタイトルと説明を整理して更新してください。

## 手順

### 0. ブランチの確認

- `git branch --show-current` で現在のブランチを確認
- ブランチ名を表示して「このブランチでPRを作成/更新しますか？」と確認
- ユーザーが承認しない場合は処理を中断

### 1. 既存PRの確認と操作選択

- `gh pr list --head <current-branch> --json number,url,baseRefName,title` で既存のPRを検索

既存PRがある場合:
- PR情報（番号、タイトル、ベースブランチ、URL）を表示
- ユーザーに選択肢を提示:
  1. 「既存のPRを更新する」 → ステップ3へ進む
  2. 「新しいPRを作成する」 → ステップ2へ進む
  3. 「キャンセル」 → 処理を中断

既存PRがない場合:
- 「既存のPRが見つかりません。新規作成します。」と表示
- ステップ2へ進む

### 2. ベースブランチの選択（新規PR作成時のみ）

1. `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` でデフォルトブランチを取得
2. `git branch -r --list 'origin/*' | sed 's/origin\///' | head -10` で主要なリモートブランチを取得
3. ユーザーに選択肢を提示（main, develop などの一般的なブランチを優先）
4. ユーザーが選択したブランチをベースブランチとして使用

### 3. 差分の分析

- `git diff <base-branch> --stat` でベースブランチとの差分を確認
- `git log <base-branch>..HEAD --oneline` でコミット履歴を確認
- 必要に応じて `git diff <base-branch> -- '*.ts' '*.html' '*.scss'` で詳細を確認

### 4. PRの説明を生成

1. プロジェクトルートに `.github/PULL_REQUEST_TEMPLATE.md` が存在するか確認
2. 存在する場合: テンプレートの形式に従ってPR説明を生成
3. 存在しない場合: 以下のデフォルトフォーマットを使用

デフォルトフォーマット:
```
## WHY

- [なぜこの変更が必要か、箇条書きで簡潔に]

## HOW

- [どのように変更したか、箇条書きで簡潔に]
```

### 5. PRタイトルを生成

- 変更内容を簡潔に表現（日本語）
- 30文字以内

### 6. PRを更新または作成

既存PRを更新する場合:
- `gh api repos/{owner}/{repo}/pulls/<number> -X PATCH -f title="<タイトル>" -f body="<説明>"` で更新

新規PRを作成する場合:
- `gh pr create --base <選択されたベースブランチ> --title "<タイトル>" --body "<説明>"` で作成
- ステップ2で選択されたベースブランチを使用

## 注意事項

- 日本語で出力
- SCREENSHOTSセクションは含めない（テンプレートで自動追加される想定）
- 変更内容をカテゴリごとに整理して説明
- `gh pr edit` はエラーが出る場合があるので `gh api` を使う
- 更新完了後、PR URLを表示
- **Claude Code関連の署名（🤖 Generated with Claude Code、Co-Authored-Byなど）は含めない**
