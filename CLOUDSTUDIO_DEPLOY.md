# CloudStudio 部署指南

## 前提条件
- 拥有腾讯云账号
- 已登录 CodeBuddy（已集成 CloudStudio）

## 部署步骤

### 1. 准备项目

当前项目结构符合 CloudStudio 部署要求：
```
Claw/
├── server.js          # Node.js 服务器
├── package.json       # 依赖配置
├── public/            # 静态文件目录
├── data/              # 数据目录（需要处理）
└── cloud/             # 云函数目录
```

### 2. 修改服务器配置（适配云环境）

**关键问题**：当前 `server.js` 使用本地文件系统存储数据，在云端需要使用云数据库。

**解决方案**：
- **方案A**：使用 CloudBase 云数据库（推荐）
- **方案B**：暂时保留本地文件系统（不适合生产环境）

### 3. 部署方式选择

#### 方式A：CloudStudio 网页部署

1. 打开 [CloudStudio 控制台](https://cloudstudio.net/)
2. 创建新工作空间
3. 导入当前项目代码
4. 安装依赖：`npm install`
5. 启动服务：`node server.js`
6. CloudStudio 会自动分配公网访问地址

#### 方式B：使用 CodeBuddy 集成部署

1. 在 CodeBuddy 中点击 **"集成"** 菜单
2. 选择 **CloudStudio**
3. 授权登录腾讯云账号
4. 选择当前工作空间：`c:/Users/Administrator/CodeBuddy/Claw`
5. 点击 **"部署"** 按钮

### 4. 部署后配置

#### 修改 API 地址

如果是部署到云环境，需要确认：
- **AI API 地址**：`https://grsai.dakka.com.cn`（无需修改，支持公网）
- **服务器端口**：保持 8080
- **跨域配置**：已在 `server.js` 中配置

#### 数据持久化

**重要提醒**：CloudStudio 免费版的工作空间重启后会丢失数据。

**解决方案**：
1. 使用 CloudBase 云数据库存储用户数据
2. 定期备份 `data/` 目录
3. 升级到 CloudStudio 专业版（支持持久化）

### 5. 域名配置（可选）

部署成功后，你可以：
1. 绑定自定义域名
2. 配置 SSL 证书
3. 设置 CDN 加速

### 6. 测试验证

部署完成后，访问以下地址测试：
- 首页：`http://你的CloudStudio地址`
- 管理后台：`http://你的CloudStudio地址/admin.html`

---

## 快速部署命令（在 CloudStudio 终端执行）

```bash
# 1. 进入项目目录
cd /workspace

# 2. 安装依赖
npm install

# 3. 启动服务器
node server.js
```

**注意**：服务会运行在 `http://localhost:8080`，CloudStudio 会自动映射到公网地址。

---

## 常见问题

### Q1: 部署后数据丢失怎么办？
A: 免费版 CloudStudio 重启后数据会丢失，建议使用云数据库或升级到专业版。

### Q2: 如何绑定自定义域名？
A: 在 CloudStudio 控制台的"域名管理"中添加域名，并配置 DNS 解析。

### Q3: AI API 会被限流吗？
A: 当前使用的 AI API 支持公网调用，但建议添加请求限流保护。

### Q4: 如何获取公网访问地址？
A: CloudStudio 部署成功后会自动分配一个 `https://xxx.cloudstudio.net` 的地址。

---

## 下一步

1. 登录 CloudStudio
2. 导入项目代码
3. 执行 `npm install` 安装依赖
4. 运行 `node server.js` 启动服务
5. 获取公网访问地址
