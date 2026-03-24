// 个人中心逻辑

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});

// 加载用户信息
function loadUserInfo() {
    const user = localStorage.getItem('currentUser');
    const centerContent = document.getElementById('CenterContent');
    
    if (!user) {
        // 未登录
        centerContent.innerHTML = `
            <div class="login-required">
                <p>登录后查看个人中心</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="login.html" class="btn btn-primary">登录</a>
                    <a href="register.html" class="btn btn-secondary">注册</a>
                </div>
            </div>
        `;
        return;
    }
    
    const userData = JSON.parse(user);
    const usageCount = userData.usageCount || 0;
    const freeTimes = 3;
    const remainingTimes = Math.max(0, freeTimes - usageCount);
    
    // 检查是否为 VIP
    const isVip = userData.isVip || false;
    const vipExpire = userData.vipExpire || null;
    
    centerContent.innerHTML = `
        <div class="center-header">
            <div class="center-avatar">${userData.username.charAt(0).toUpperCase()}</div>
            <div class="center-info">
                <h2>${userData.username}</h2>
                <p>${isVip ? '<span class="vip-badge">⭐ VIP会员</span>' : '普通用户'}</p>
            </div>
        </div>
        
        <div class="center-stats">
            <div class="stat-card">
                <div class="num">${remainingTimes}</div>
                <div class="label">剩余免费次数</div>
            </div>
            <div class="stat-card">
                <div class="num">${isVip ? '无限' : usageCount}</div>
                <div class="label">${isVip ? 'VIP会员' : '已使用次数'}</div>
            </div>
            <div class="stat-card">
                <div class="num">${getHistoryCount()}</div>
                <div class="label">历史作品</div>
            </div>
        </div>
        
        <div class="center-menu">
            <div class="menu-item" onclick="goToWork()">
                <div class="left">
                    <div class="icon">🎨</div>
                    <div class="text">开始创作</div>
                </div>
                <div class="arrow">→</div>
            </div>
            
            <div class="menu-item" onclick="showRecharge()">
                <div class="left">
                    <div class="icon">💰</div>
                    <div class="text">充值续费</div>
                </div>
                <div class="arrow">→</div>
            </div>
            
            <div class="menu-item" onclick="showVipBenefits()">
                <div class="left">
                    <div class="icon">⭐</div>
                    <div class="text">VIP特权</div>
                </div>
                <div class="arrow">→</div>
            </div>
            
            <div class="menu-item" onclick="showAccountInfo()">
                <div class="left">
                    <div class="icon">👤</div>
                    <div class="text">账户信息</div>
                </div>
                <div class="arrow">→</div>
            </div>
            
            <div class="menu-item" onclick="clearHistory()">
                <div class="left">
                    <div class="icon">🗑️</div>
                    <div class="text">清除历史记录</div>
                </div>
                <div class="arrow">→</div>
            </div>
            
            <div class="menu-item" onclick="logout()">
                <div class="left">
                    <div class="icon">🚪</div>
                    <div class="text">退出登录</div>
                </div>
                <div class="arrow">→</div>
            </div>
        </div>
    `;
}

// 获取历史记录数量
function getHistoryCount() {
    const history = JSON.parse(localStorage.getItem('generateHistory') || '[]');
    return history.length;
}

// 跳转创作
function goToWork() {
    window.location.href = 'work.html';
}

// 显示充值
function showRecharge() {
    alert('请联系客服微信进行充值：添加客服微信详询');
}

// 显示 VIP 特权
function showVipBenefits() {
    alert('VIP特权：\n\n1. 无限次生成\n2. 高清/极致画质免费用\n3. 专属客服\n4. 更多增值服务\n\n请联系客服开通');
}

// 显示账户信息
function showAccountInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    alert(`账户信息：\n\n用户名：${user.username || '未设置'}\n注册时间：${user.createTime || '未知'}\nVIP状态：${user.isVip ? 'VIP会员' : '普通用户'}`);
}

// 清除历史记录
function clearHistory() {
    if (confirm('确定要清除所有历史记录吗？此操作不可恢复。')) {
        localStorage.removeItem('generateHistory');
        localStorage.removeItem('styleUsageCount');
        loadUserInfo();
        alert('历史记录已清除');
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// 暴露给全局
window.goToWork = goToWork;
window.showRecharge = showRecharge;
window.showVipBenefits = showVipBenefits;
window.showAccountInfo = showAccountInfo;
window.clearHistory = clearHistory;
window.logout = logout;
