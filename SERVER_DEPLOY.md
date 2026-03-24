# 阿里云/腾讯云 轻量服务器部署指南

## 🎯 准备工作

### 1. 购买服务器

**推荐配置**：
- **CPU**: 1核 或 2核
- **内存**: 2GB 或 4GB
- **带宽**: 3-5Mbps
- **系统**: Ubuntu 20.04 或 22.04 LTS
- **价格**: 约 60-100元/年

**购买渠道**：
- **阿里云轻量应用服务器**: [https://www.aliyun.com/product/swas](https://www.aliyun.com/product/swas)
- **腾讯云轻量应用服务器**: [https://cloud.tencent.com/product/lighthouse](https://cloud.tencent.com/product/lighthouse)

---

## 📦 部署步骤

### 步骤 1：连接服务器

购买后，你会获得：
- 公网 IP 地址（如：123.45.67.89）
- 登录用户名（通常是：root）
- 登录密码或 SSH 密钥

**连接方式**（二选一）：

#### 方式 A：使用 SSH 命令
```bash
ssh root@123.45.67.89
# 输入密码
```

#### 方式 B：使用宝塔面板（推荐新手）
- 登录服务器控制台
- 找到"应用管理"或"应用商店"
- 安装"宝塔面板"
- 宝塔面板会提供 Web 界面

---

### 步骤 2：安装 Node.js 环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (使用 NodeSource 仓库)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应该显示 v18.x.x
npm -v
```

---

### 步骤 3：安装 PM2（进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v
```

---

### 步骤 4：上传项目代码

#### 方式 A：使用 SCP 命令
```bash
# 在本地电脑终端执行（替换成你的服务器IP）
scp -r /c/Users/Administrator/CodeBuddy/Claw root@123.45.67.89:/root/
```

#### 方式 B：使用 SFTP 工具（推荐）
- 下载 **FileZilla** 或 **WinSCP**
- 使用以下信息连接：
  - 主机：你的服务器 IP
  - 端口：22
  - 用户：root
  - 密码：你的登录密码
- 上传 `Claw` 文件夹到 `/root/` 目录

#### 方式 C：使用 Git（如果项目在 GitHub）
```bash
# 在服务器上执行
cd /root
git clone https://github.com/你的用户名/你的仓库.git
cd Claw
```

---

### 步骤 5：安装项目依赖

```bash
# 进入项目目录
cd /root/Claw

# 安装依赖
npm install --production

# 如果有 node_modules，也可以直接上传
```

---

### 步骤 6：启动服务

```bash
# 使用 PM2 启动服务
pm2 start server.js --name "ziwen-design"

# 查看运行状态
pm2 list

# 查看日志
pm2 logs ziwen-design

# 查看实时日志
pm2 logs ziwen-design --lines 100
```

---

### 步骤 7：配置防火墙

#### 服务器端防火墙（使用 ufw）
```bash
# 允许 SSH（端口 22）
sudo ufw allow 22

# 允许 HTTP（端口 80）
sudo ufw allow 80

# 允许 HTTPS（端口 443）
sudo ufw allow 443

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

#### 云服务商安全组（重要！）

在阿里云/腾讯云控制台中：
1. 找到"安全组"或"防火墙"设置
2. 添加入站规则：
   - 端口：80（HTTP）
   - 端口：443（HTTPS）
   - 端口：8080（应用端口）
   - 协议：TCP
   - 来源：0.0.0.0/0（允许所有IP）

---

### 步骤 8：配置域名（可选）

#### 8.1 购买域名
- 在阿里云/腾讯云购买域名（如：ziwen-design.com）
- 解析域名到服务器 IP

#### 8.2 配置 Nginx 反向代理
```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建站点配置文件
sudo nano /etc/nginx/sites-available/ziwen-design
```

**复制以下内容**：
```nginx
server {
    listen 80;
    server_name ziwen-design.com www.ziwen-design.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/ziwen-design /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

### 步骤 9：配置 SSL 证书（HTTPS）

#### 使用 Certbot 免费申请 Let's Encrypt 证书
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d ziwen-design.com -d www.ziwen-design.com

# 证书会自动续期（Certbot 会自动添加续期任务）
```

---

### 步骤 10：配置开机自启

```bash
# 设置 PM2 开机自启
pm2 startup
# 复制执行输出的命令并执行

# 保存 PM2 进程列表
pm2 save
```

---

## 🔧 PM2 常用命令

```bash
# 查看所有进程
pm2 list

# 查看日志
pm2 logs ziwen-design

# 查看实时日志
pm2 logs ziwen-design --lines 50

# 重启服务
pm2 restart ziwen-design

# 停止服务
pm2 stop ziwen-design

# 删除服务
pm2 delete ziwen-design

# 查看监控
pm2 monit

# 查看详细信息
pm2 show ziwen-design
```

---

## 📊 监控和维护

### 1. 设置日志轮转（防止日志文件过大）
```bash
# 安装 logrotate
sudo apt install -y logrotate

# 创建 PM2 日志轮转配置
sudo nano /etc/logrotate.d/pm2
```

**添加以下内容**：
```
/root/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

### 2. 设置定时备份数据
```bash
# 创建备份脚本
nano /root/backup.sh
```

**添加以下内容**：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# 备份 data 目录
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /root/Claw/data

# 删除7天前的备份
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# 添加执行权限
chmod +x /root/backup.sh

# 添加到 crontab（每天凌晨3点执行）
crontab -e
```

**添加以下行**：
```
0 3 * * * /root/backup.sh
```

---

## 🔍 故障排查

### 问题 1：无法访问网站
```bash
# 检查服务是否运行
pm2 list

# 检查端口是否监听
netstat -tlnp | grep 8080

# 检查防火墙
sudo ufw status
```

### 问题 2：服务自动停止
```bash
# 查看错误日志
pm2 logs ziwen-design --err

# 重启服务
pm2 restart ziwen-design
```

### 问题 3：磁盘空间不足
```bash
# 查看磁盘使用情况
df -h

# 清理日志
pm2 flush

# 清理 npm 缓存
npm cache clean --force
```

---

## 💰 成本估算

### 阿里云轻量应用服务器
- **1核2G**: 约 ¥60-80/年
- **2核4G**: 约 ¥100-150/年
- **域名**: 约 ¥50-100/年（可选）
- **SSL 证书**: 免费（Let's Encrypt）

### 腾讯云轻量应用服务器
- **1核2G**: 约 ¥50-70/年
- **2核4G**: 约 ¥100-130/年
- **域名**: 约 ¥50-100/年（可选）
- **SSL 证书**: 免费（Let's Encrypt）

**总成本**: 约 ¥60-200/年（取决于服务器配置和是否购买域名）

---

## ✅ 部署完成检查清单

- [ ] 服务器已购买
- [ ] 服务器已连接
- [ ] Node.js 已安装
- [ ] PM2 已安装
- [ ] 项目代码已上传
- [ ] 依赖已安装
- [ ] 服务已启动（PM2）
- [ ] 防火墙已配置
- [ ] 安全组已开放端口
- [ ] 域名已配置（可选）
- [ ] SSL 证书已配置（可选）
- [ ] 开机自启已配置
- [ ] 日志轮转已配置
- [ ] 自动备份已配置

---

## 📞 获取帮助

如果遇到问题，可以：
1. 查看 PM2 日志：`pm2 logs ziwen-design`
2. 查看系统日志：`sudo journalctl -xe`
3. 查看错误日志：`cat /var/log/nginx/error.log`
4. 联系云服务商客服

---

**祝你部署成功！🚀**
