# Attendance App

## セットアップ手順 (再現性のある環境構築)

このプロジェクトをクローンした直後は、環境変数の設定やデータベースの準備が必要です。以下の手順に従ってセットアップを行ってください。

### 1. 依存関係のインストール

プロジェクトのルートディレクトリ (`attendance_app`) に移動し、パッケージをインストールします。

```bash
cd attendance_app
npm install
```

### 2. 環境変数の設定

`.env` ファイルはセキュリティ上の理由から Git に含まれていません。手動で作成する必要があります。
プロジェクトルートに `.env` ファイルを作成し、以下の内容を記述してください。

**ファイル名:** `.env`

```env
DATABASE_URL="file:../dev.db"
```

### 3. データベースのセットアップ

Prisma を使用してデータベースクライアントの生成とマイグレーションを行います。

```bash
# Prisma クライアントの生成
npx prisma generate

# データベースのマイグレーション (dev.db が作成されます)
npx prisma migrate dev
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスして確認してください。

---

## GitHub を使った共同開発ガイド

複数人で開発を行う場合、メインのブランチ (`main`) を直接編集するのではなく、機能ごとにブランチを分けて開発することをお勧めします。

### 推奨されるワークフロー (GitHub Flow)

1.  **Issue の作成**: 開発する機能やバグ修正の内容を Issue として登録します。
2.  **ブランチの作成**: `main` ブランチから、作業用のブランチを作成します。
    *   ブランチ名の例: `feature/add-login`, `fix/calendar-bug`, `user/hayate/update-ui`
    ```bash
    git checkout main
    git pull origin main
    git checkout -b feature/new-feature-name
    ```
3.  **開発とコミット**: 変更を加え、こまめにコミットします。
    ```bash
    git add .
    git commit -m "機能追加: 〇〇の実装"
    ```
4.  **プッシュ**: 作業ブランチを GitHub にプッシュします。
    ```bash
    git push origin feature/new-feature-name
    ```
5.  **Pull Request (PR) の作成**: GitHub 上で `main` ブランチに対して Pull Request を作成します。
6.  **レビューとマージ**: 他の開発者がコードをレビューし、問題なければ `main` にマージします。

### 注意点
*   `.env` ファイルや `node_modules` はコミットしないでください (自動的に `.gitignore` で除外されています)。
*   `main` ブランチは常に動作する状態を保つようにしましょう。
