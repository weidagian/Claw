// 管理后台逻辑

// 管理员密码
const ADMIN_PASSWORD = 'ziwen2026';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    checkAdminLogin();
});

// 检查管理员登录
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('adminLogin');
    const adminContent = document.getElementById('AdminContent');
    
    if (isLoggedIn === 'true') {
        loadStats().then(() => showAdminPanel());
    } else {
        showLoginForm();
    }
}

// 显示登录表单
function showLoginForm() {
    const adminContent = document.getElementById('AdminContent');
    adminContent.innerHTML = `
        <div class="admin-login">
            <div class="logo">
                <div class="logo-icon">Z</div>
                <div class="logo-text">
                    <span class="logo-title">子问设计助手</span>
                    <span class="logo-subtitle">管理后台</span>
                </div>
            </div>
            <div class="card">
                <div class="form-group">
                    <label>管理员密码</label>
                    <input type="password" id="adminPassword" class="input" placeholder="请输入管理员密码">
                </div>
                <button class="btn btn-primary" style="width: 100%" onclick="adminLogin()">登录</button>
                <p style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-light)">默认密码: ziwen2026</p>
            </div>
        </div>
    `;
}

// 管理员登录
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLogin', 'true');
        loadStats().then(() => showAdminPanel());
    } else {
        alert('密码错误');
    }
}

// 退出管理员
function adminLogout() {
    localStorage.removeItem('adminLogin');
    showLoginForm();
}

// 全局统计数据
let globalStats = {
    totalUsers: 0,
    experienceUsers: 0,
    monthlyUsers: 0,
    yearlyUsers: 0,
    totalGenerations: 0,
    todayGenerations: 0,
    userList: []
};

// 全局反馈数据
let globalFeedbacks = [];

// 从服务器加载统计数据
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
            globalStats.totalUsers = data.userCount || 0;
            globalStats.userList = data.users || [];
            
            // 统计各类型用户
            globalStats.experienceUsers = data.users.filter(u => u.userType === 'experience').length;
            globalStats.monthlyUsers = data.users.filter(u => u.userType === 'monthly').length;
            globalStats.yearlyUsers = data.users.filter(u => u.userType === 'yearly').length;
            
            // 总生成次数
            globalStats.totalGenerations = data.stats.totalGenerations || 0;
            
            // 今日生成
            const today = new Date().toISOString().split('T')[0];
            globalStats.todayGenerations = data.stats.dailyStats?.[today]?.generations || 0;
        }
    } catch (e) {
        console.error('加载统计数据失败:', e);
    }
    
    // 加载反馈数据
    await loadFeedbacks();
}

// 显示管理面板
function showAdminPanel() {
    const adminContent = document.getElementById('AdminContent');
    const config = loadAdminConfig();
    
    adminContent.innerHTML = `
        <div class="admin-header">
            <h1 class="admin-title">⚙️ 管理后台</h1>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="refreshStats()">🔄 刷新数据</button>
                <button class="btn btn-secondary btn-sm" onclick="adminLogout()">退出管理</button>
            </div>
        </div>
        
        <!-- 数据概览 -->
        <div class="admin-grid" style="margin-bottom: 1.5rem;">
            <div class="admin-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <h3 style="color: white;">📊 今日数据</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${globalStats.todayGenerations}</div>
                        <div style="opacity: 0.9;">今日生成次数</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${globalStats.totalUsers}</div>
                        <div style="opacity: 0.9;">总用户数</div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <h3>👥 用户分布</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="stat-row">
                        <span class="label">🎫 体验用户</span>
                        <span class="value">${globalStats.experienceUsers} 人</span>
                    </div>
                    <div class="stat-row">
                        <span class="label">📅 包月用户</span>
                        <span class="value">${globalStats.monthlyUsers} 人</span>
                    </div>
                    <div class="stat-row">
                        <span class="label">📆 包年用户</span>
                        <span class="value">${globalStats.yearlyUsers} 人</span>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <h3>📈 使用统计</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="stat-row">
                        <span class="label">总生成次数</span>
                        <span class="value">${globalStats.totalGenerations} 次</span>
                    </div>
                    <div class="stat-row">
                        <span class="label">用户转化率</span>
                        <span class="value">${globalStats.totalUsers > 0 ? Math.round((globalStats.monthlyUsers + globalStats.yearlyUsers) / globalStats.totalUsers * 100) : 0}%</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="admin-grid">
            <!-- 系统设置 -->
            <div class="admin-card">
                <h3>🎛️ 系统设置</h3>
                <div class="switch-row">
                    <span class="switch-label">开启免费次数</span>
                    <label class="switch">
                        <input type="checkbox" id="enableFree" ${config.enableFree ? 'checked' : ''} onchange="saveConfig()">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="switch-row">
                    <span class="switch-label">开启注册</span>
                    <label class="switch">
                        <input type="checkbox" id="enableRegister" ${config.enableRegister ? 'checked' : ''} onchange="saveConfig()">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="switch-row">
                    <span class="switch-label">维护模式</span>
                    <label class="switch">
                        <input type="checkbox" id="maintenance" ${config.maintenance ? 'checked' : ''} onchange="saveConfig()">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <!-- AI 配置 -->
            <div class="admin-card">
                <h3>🤖 AI 模型配置</h3>
                <div class="form-group">
                    <label>快速预览模型</label>
                    <select id="fastModel" class="input">
                        <option value="gpt-image-1.5" ${config.fastModel === 'gpt-image-1.5' ? 'selected' : ''}>gpt-image-1.5</option>
                        <option value="nano-banana-fast" ${config.fastModel === 'nano-banana-fast' ? 'selected' : ''}>nano-banana-fast</option>
                        <option value="sora-image" ${config.fastModel === 'sora-image' ? 'selected' : ''}>sora-image</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>高清商用模型</label>
                    <select id="hdModel" class="input">
                        <option value="nano-banana-pro" ${config.hdModel === 'nano-banana-pro' ? 'selected' : ''}>nano-banana-pro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>专业极致模型</label>
                    <select id="proModel" class="input">
                        <option value="nano-banana-pro-4k-vip" ${config.proModel === 'nano-banana-pro-4k-vip' ? 'selected' : ''}>nano-banana-pro-4k-vip</option>
                        <option value="nano-banana-pro-cl" ${config.proModel === 'nano-banana-pro-cl' ? 'selected' : ''}>nano-banana-pro-cl</option>
                    </select>
                </div>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="saveAiConfig()">保存模型配置</button>
                </div>
            </div>
            
            <!-- 套餐设置 -->
            <div class="admin-card">
                <h3>💰 套餐设置</h3>
                <div class="form-group">
                    <label>包月价格（元/月）</label>
                    <input type="number" id="monthlyPrice" class="input" value="${config.monthlyPrice || 59}" min="0">
                </div>
                <div class="form-group">
                    <label>包年价格（元/年）</label>
                    <input type="number" id="yearlyPrice" class="input" value="${config.yearlyPrice || 499}" min="0">
                </div>
                <div class="form-group">
                    <label>体验用户初始点数</label>
                    <input type="number" id="experiencePoints" class="input" value="${config.experiencePoints || 10}" min="0">
                </div>
                <button class="btn btn-primary btn-sm" onclick="savePackageConfig()">保存套餐设置</button>
            </div>
            
            <!-- 客服设置 -->
            <div class="admin-card">
                <h3>📞 客服设置</h3>
                <div class="form-group">
                    <label>客服微信</label>
                    <input type="text" id="wechat" class="input" value="${config.wechat}" placeholder="客服微信号">
                </div>
                <div class="form-group">
                    <label>客服电话</label>
                    <input type="text" id="phone" class="input" value="${config.phone}" placeholder="客服电话">
                </div>
                <div class="form-group">
                    <label>客服邮箱</label>
                    <input type="email" id="email" class="input" value="${config.email}" placeholder="客服邮箱">
                </div>
                <button class="btn btn-primary btn-sm" onclick="saveContactConfig()">保存客服设置</button>
            </div>
            
            <!-- 用户管理 -->
            <div class="admin-card" style="grid-column: span 2;">
                <h3>👥 用户管理</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>类型</th>
                                <th>点数</th>
                                <th>使用次数</th>
                                <th>注册时间</th>
                                <th>最后登录</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            ${renderUserTable()}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 反馈管理 -->
            <div class="admin-card" style="grid-column: span 2;">
                <h3>📬 用户反馈</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>用户</th>
                                <th>类型</th>
                                <th>内容</th>
                                <th>联系方式</th>
                                <th>时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="feedbackTableBody">
                            ${renderFeedbackTable()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- 操作日志 -->
        <div class="admin-card" style="margin-top: 1.5rem">
            <h3>📝 操作日志</h3>
            <div class="log-list" id="logList">
                ${renderLogs()}
            </div>
        </div>
    `;
}

// 加载配置
function loadAdminConfig() {
    const defaultConfig = {
        enableFree: true,
        enableRegister: true,
        maintenance: false,
        fastModel: 'gpt-image-1.5',
        hdModel: 'nano-banana-pro',
        proModel: 'nano-banana-pro-4k-vip',
        monthlyPrice: 59,
        yearlyPrice: 499,
        experiencePoints: 10,
        wechat: '请添加客服微信',
        phone: '',
        email: ''
    };
    
    const stored = localStorage.getItem('adminConfig');
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
}

// 保存配置
function saveConfig() {
    const config = {
        enableFree: document.getElementById('enableFree').checked,
        enableRegister: document.getElementById('enableRegister').checked,
        maintenance: document.getElementById('maintenance').checked
    };
    
    const existing = loadAdminConfig();
    localStorage.setItem('adminConfig', JSON.stringify({ ...existing, ...config }));
    
    addLog('系统设置已更新');
    alert('设置已保存');
}

// 保存 AI 配置
function saveAiConfig() {
    const config = {
        fastModel: document.getElementById('fastModel').value,
        hdModel: document.getElementById('hdModel').value,
        proModel: document.getElementById('proModel').value
    };
    
    const existing = loadAdminConfig();
    localStorage.setItem('adminConfig', JSON.stringify({ ...existing, ...config }));
    
    addLog('AI 模型配置已更新');
    alert('AI 模型配置已保存');
}

// 保存套餐配置
function savePackageConfig() {
    const config = {
        monthlyPrice: parseInt(document.getElementById('monthlyPrice').value) || 59,
        yearlyPrice: parseInt(document.getElementById('yearlyPrice').value) || 499,
        experiencePoints: parseInt(document.getElementById('experiencePoints').value) || 10
    };
    
    const existing = loadAdminConfig();
    localStorage.setItem('adminConfig', JSON.stringify({ ...existing, ...config }));
    
    addLog('套餐设置已更新');
    alert('套餐设置已保存');
}

// 保存客服配置
function saveContactConfig() {
    const config = {
        wechat: document.getElementById('wechat').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value
    };
    
    const existing = loadAdminConfig();
    localStorage.setItem('adminConfig', JSON.stringify({ ...existing, ...config }));
    
    addLog('客服设置已更新');
    alert('客服设置已保存');
}

// 渲染用户表格
function renderUserTable() {
    if (globalStats.userList.length === 0) {
        return '<tr><td colspan="7" style="text-align: center; color: var(--text-light)">暂无用户数据</td></tr>';
    }
    
    const typeLabels = {
        experience: '🎫 体验',
        monthly: '📅 包月',
        yearly: '📆 包年'
    };
    
    return globalStats.userList.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${typeLabels[user.userType] || '🎫 体验'}</td>
            <td>${(user.freePoints || 0) + (user.bonusPoints || 0)}</td>
            <td>${user.totalUsage || 0}</td>
            <td>${user.createTime ? new Date(user.createTime).toLocaleDateString() : '-'}</td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editUser('${user.username}')">管理</button>
            </td>
        </tr>
    `).join('');
}

// 编辑用户
async function editUser(username) {
    const user = globalStats.userList.find(u => u.username === username);
    if (!user) return;
    
    const action = prompt(`用户: ${username}
当前类型: ${user.userType}

输入操作:
1. 开通包月
2. 开通包年
3. 赠送点数
4. 封禁用户
5. 解除封禁

请输入数字:`);
    
    if (!action) return;
    
    let apiAction = '';
    let params = {};
    
    if (action === '1') {
        apiAction = 'upgrade';
        params = { username, userType: 'monthly', bonusPoints: 0 };
    } else if (action === '2') {
        apiAction = 'upgrade';
        params = { username, userType: 'yearly', bonusPoints: 0 };
    } else if (action === '3') {
        const points = prompt('请输入赠送点数:');
        if (points && !isNaN(points)) {
            apiAction = 'deduct';
            params = { username, freePoints: 0, bonusPoints: parseInt(points) };
        }
    } else if (action === '4') {
        apiAction = 'block';
        params = { username };
    } else if (action === '5') {
        apiAction = 'unblock';
        params = { username };
    }
    
    if (apiAction) {
        try {
            const response = await fetch('/api/admin/updateUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...params, action: apiAction })
            });
            const result = await response.json();
            
            if (result.success) {
                addLog(`用户 ${username} 操作: ${action}`);
                alert('操作成功');
                loadStats().then(() => showAdminPanel());
            } else {
                alert(result.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败: ' + e.message);
        }
    }
}

// 日志相关
function addLog(message) {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    logs.unshift({
        time: new Date().toLocaleString(),
        message: message
    });
    
    if (logs.length > 100) {
        logs.pop();
    }
    
    localStorage.setItem('adminLogs', JSON.stringify(logs));
}

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    if (logs.length === 0) {
        return '<div style="text-align: center; color: var(--text-light); padding: 1rem;">暂无日志</div>';
    }
    
    return logs.slice(0, 20).map(log => `
        <div class="log-item">
            <span class="time">${log.time}</span>
            <p>${log.message}</p>
        </div>
    `).join('');
}

// 加载反馈数据
async function loadFeedbacks() {
    try {
        const response = await fetch('/api/admin/feedbacks');
        const data = await response.json();
        if (data.success) {
            globalFeedbacks = data.feedbacks || [];
        }
    } catch (e) {
        console.error('加载反馈失败:', e);
        globalFeedbacks = [];
    }
}

// 渲染反馈表格
function renderFeedbackTable() {
    if (globalFeedbacks.length === 0) {
        return '<tr><td colspan="7" style="text-align: center; color: var(--text-light); padding: 1rem;">暂无反馈</td></tr>';
    }
    
    const typeMap = {
        'bug': '🐛 Bug',
        'suggest': '💡 建议',
        'experience': '👤 体验',
        'other': '📝 其他'
    };
    
    const statusMap = {
        'pending': '<span style="color: #e74c3c;">待处理</span>',
        'viewed': '<span style="color: #f39c12;">已查看</span>',
        'resolved': '<span style="color: #27ae60;">已解决</span>'
    };
    
    return globalFeedbacks.map(f => `
        <tr>
            <td>${f.username}</td>
            <td>${typeMap[f.type] || f.type}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${f.content}</td>
            <td>${f.contact || '-'}</td>
            <td>${new Date(f.createTime).toLocaleString()}</td>
            <td>${statusMap[f.status] || f.status}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="updateFeedback(${f.id}, 'viewed')">查看</button>
                <button class="btn btn-sm btn-primary" onclick="updateFeedback(${f.id}, 'resolved')">完成</button>
            </td>
        </tr>
    `).join('');
}

// 更新反馈状态
async function updateFeedback(id, status) {
    try {
        const response = await fetch(`/api/admin/feedback/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        if (result.success) {
            await loadFeedbacks();
            showAdminPanel();
        } else {
            alert(result.message || '操作失败');
        }
    } catch (e) {
        alert('操作失败: ' + e.message);
    }
}

async function refreshStats() {
    await loadStats();
    showAdminPanel();
}

// 暴露给全局
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.saveConfig = saveConfig;
window.saveAiConfig = saveAiConfig;
window.savePackageConfig = savePackageConfig;
window.saveContactConfig = saveContactConfig;
window.editUser = editUser;
window.refreshStats = refreshStats;
window.updateFeedback = updateFeedback;
