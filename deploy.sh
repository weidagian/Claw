#!/bin/bash

echo "======================================"
echo "开始部署到服务器"
echo "======================================"
echo ""

# 切换到项目目录
cd /root/Claw || {
    echo "错误: 无法进入项目目录"
    exit 1
}

echo "当前目录: $(pwd)"
echo ""

# 拉取最新代码
echo "正在拉取最新代码..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "拉取代码失败！"
    exit 1
fi

echo "代码拉取成功"
echo ""

# 重启服务
echo "正在重启服务..."
pm2 restart ziwen-design

if [ $? -ne 0 ]; then
    echo "重启服务失败！"
    echo "尝试启动新服务..."
    pm2 start server.js --name ziwen-design
fi

echo ""
echo "======================================"
echo "部署完成!"
echo "======================================"
echo ""
echo "查看服务状态: pm2 status"
echo "查看实时日志: pm2 logs ziwen-design"
