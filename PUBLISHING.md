# 打包与发布 / Build & Publish

## 本地打包

```bash
cd d:\repos\texdown
npm ci
npm run build
npm test
```

产物在 `dist/`，`package.json` 的 `main`、`module`、`types` 已指向 `dist/`。

## 发布到 npm

### 方式一：GitHub Actions 手动发布（推荐）

1. 仓库 Settings → Secrets and variables → Actions 中配置 **NPM_TOKEN**（npm 账号的 Automation token）。
2. Actions → 选择 “Publish to npm” → Run workflow。
3. 选择版本类型：patch / minor / major，运行。
4. 工作流会：拉取最新 main、与 npm 当前版本比较、bump package.json、构建、发布到 npm、提交并打 tag、创建 GitHub Release。

### 方式二：先创建 GitHub Release 再发布

1. 在 GitHub 仓库中创建 Release，选择或新建 tag（如 `v1.0.1`）。
2. 发布该 Release 后，“Publish to npm” 会被触发，将用该 tag 版本更新 package.json 并执行 `npm publish`。

### 方式三：本地发布

```bash
npm version patch   # 或 minor / major
npm run build
npm publish --access public
git push origin main --tags
```

需在本地先 `npm login`，且确保 package 名 `texdown` 在 npm 上可用（未占则首次发布即创建）。

---

## MetaDoc 引用方式

发布后，MetaDoc 应通过 npm 安装：

```bash
cd /path/to/meta-doc
npm install texdown@^1.0.0
# 或保持 package.json 中 "texdown": "^1.0.0" 后执行
npm install
```

- **代码无需改动**：MetaDoc 已从 `'texdown'` 包 import（`markdownToLatex`、`latexToMarkdown`、`escapeLatex`），只要依赖里是 `texdown` 的 npm 版本即可。
- 若在发布前需要在 MetaDoc 里联调本地 texdown，可在 meta-doc 的 `package.json` 中临时改为：
  `"texdown": "file:../../../repos/texdown"`（路径按你本机 MetaDoc 与 texdown 的相对位置调整），发布后再改回 `"texdown": "^x.x.x"`。
