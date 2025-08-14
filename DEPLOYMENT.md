# GitHub Pages 部署指南

## 🚀 自动部署配置

本项目已配置GitHub Actions自动部署到GitHub Pages。

### 📋 前置要求

1. 确保你的GitHub仓库是公开的（免费账户只能部署公开仓库）
2. 仓库名称：`free-layout-demo`
3. 主分支：`main` 或 `master`

### ⚙️ 配置步骤

#### 1. 启用GitHub Pages

1. 进入你的GitHub仓库
2. 点击 `Settings` 标签页
3. 在左侧菜单中找到 `Pages`
4. 在 `Source` 部分选择 `GitHub Actions`
5. 点击 `Save`

#### 2. 配置仓库权限

GitHub Actions需要以下权限：
- `Contents: Read`
- `Pages: Write` 
- `ID Token: Write`

这些权限已在工作流文件中配置。

#### 3. 更新配置

**重要：** 在 `package.json` 中更新 `homepage` 字段：

```json
{
  "homepage": "https://你的用户名.github.io/free-layout-demo"
}
```

### 🔄 自动部署流程

#### 触发条件

- 推送到 `main` 或 `master` 分支
- 创建Pull Request到主分支
- 手动触发工作流

#### 部署步骤

1. **构建阶段**
   - 检出代码
   - 安装Node.js 18
   - 安装依赖
   - 构建生产版本
   - 上传构建产物

2. **部署阶段**
   - 配置Pages环境
   - 部署到GitHub Pages
   - 输出部署URL

### 📁 文件结构

```
.github/
  workflows/
    deploy.yml          # GitHub Actions工作流
public/
  404.html             # SPA路由支持
vite.config.js         # Vite配置（已更新）
package.json           # 项目配置（已更新）
```

### 🛠️ 本地测试

```bash
# 安装依赖
npm install

# 本地构建测试
npm run build:prod

# 预览构建结果
npm run preview
```

### 🌐 访问地址

部署成功后，你的应用将在以下地址可用：

```
https://你的用户名.github.io/free-layout-demo
```

### 🔧 故障排除

#### 常见问题

1. **构建失败**
   - 检查Node.js版本（需要18+）
   - 确认所有依赖已安装
   - 查看Actions日志

2. **页面404**
   - 确认GitHub Pages已启用
   - 检查base路径配置
   - 等待部署完成（可能需要几分钟）

3. **路由问题**
   - 确认404.html文件存在
   - 检查Vite base配置

#### 手动部署

如果需要手动部署：

```bash
# 安装gh-pages
npm install -g gh-pages

# 构建并部署
npm run deploy
```

### 📊 部署状态

你可以在以下位置查看部署状态：

1. **Actions标签页**：查看工作流执行状态
2. **Settings > Pages**：查看Pages配置和部署状态
3. **仓库首页**：查看最新的部署信息

### 🔄 更新部署

每次推送到主分支时，GitHub Actions会自动：

1. 检测代码变更
2. 重新构建应用
3. 部署到GitHub Pages
4. 更新访问地址

无需手动操作！
