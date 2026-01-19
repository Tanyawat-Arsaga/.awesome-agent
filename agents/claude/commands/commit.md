---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(git log:*), Bash(git config:*), Bash(git push:*)
description: コミットメッセージを自動生成してコミット
---

## コンテキスト
- 現在のgit status: !`git status`
- 現在の変更差分: !`git diff HEAD`
- 現在のブランチ: !`git branch --show-current`
- 最近のコミット: !`git log --oneline -10`
- gitユーザー: !`git config user.name` <!`git config user.email`>

## タスク
1. 現在のブランチを確認し、このブランチにコミットしてよいかユーザーに確認する
   - ブランチ名を表示して「このブランチにコミットしますか？」と確認
   - ユーザーが承認しない場合は処理を中断
2. 変更内容を分析して、変更の性質と目的を理解する
3. 変更に基づいてコミットメッセージを3つ提案する
   - Conventional Commits形式（feat:, fix:, docs:, refactor:など）を使用
4. 最適なメッセージを選んで理由を説明する
5. ユーザーの確認後、コミットを実行する
   - `git commit --author="<gitユーザー名> <<gitユーザーメール>>"` でコミットユーザーを設定
   - Co-Authored-ByやClaude Code関連の署名は含めない
6. コミット成功後、プッシュするか確認する
   - ユーザーが承認したら `git push` を実行