// 管理后台逻辑
(function() {
    'use strict';

    let isLoggedIn = false;

    // 初始化
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // 检查登录状态
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
            isLoggedIn = true;
            loadData();
        } else {
            showLoginModal();
        }

        // 绑定事件
        bindEvents();
    }

    function bindEvents() {
        // 登录
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });

        // 刷新
        document.getElementById('refreshBtn').addEventListener('click', loadData);

        // 退出
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }

    // 显示登录弹窗
    function showLoginModal() {
        document.getElementById('loginModal').classList.add('show');
    }

    // 隐藏登录弹窗
    function hideLoginModal() {
        document.getElementById('loginModal').classList.remove('show');
    }

    // 登录
    async function handleLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!password) {
            showError(errorDiv, '请输入密码');
            return;
        }

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('adminToken', result.token);
                isLoggedIn = true;
                hideLoginModal();
                showToast('登录成功', 'success');
                loadData();
            } else {
                showError(errorDiv, result.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            showError(errorDiv, '网络错误');
        }
    }

    // 退出
    function handleLogout() {
        localStorage.removeItem('adminToken');
        isLoggedIn = false;
        showLoginModal();
    }

    // 加载数据
    async function loadData() {
        if (!isLoggedIn) return;

        try {
            // 获取用户列表
            const usersResponse = await fetch('/api/admin/users');
            const usersResult = await usersResponse.json();

            if (usersResult.success) {
                renderUsers(usersResult.users);
                renderStats(usersResult.stats);
            } else {
                showToast('获取数据失败', 'error');
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            showToast('网络错误', 'error');
        }
    }

    // 渲染用户列表
    function renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">暂无用户</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${escapeHtml(user.username)}</strong></td>
                <td><span class="user-type ${user.userType}">${getUserTypeName(user.userType)}</span></td>
                <td>${user.freePoints + user.bonusPoints}</td>
                <td>${user.totalUsage || 0}</td>
                <td>${formatDate(user.createTime)}</td>
                <td>
                    <button class="btn-delete" onclick="deleteUser('${escapeHtml(user.username)}')">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 渲染统计
    function renderStats(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalGenerations').textContent = stats.totalGenerations || 0;
        
        const today = new Date().toISOString().split('T')[0];
        const todayStats = stats.dailyStats && stats.dailyStats[today];
        document.getElementById('todayGenerations').textContent = todayStats ? todayStats.generations : 0;
    }

    // 删除用户
    window.deleteUser = async function(username) {
        if (!confirm(`确定要删除用户 "${username}" 吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/user/${encodeURIComponent(username)}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                showToast('删除成功', 'success');
                loadData();
            } else {
                showToast(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除失败:', error);
            showToast('网络错误', 'error');
        }
    };

    // 工具函数
    function showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showError(errorDiv, message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }

    function getUserTypeName(type) {
        const names = {
            'experience': '体验',
            'vip': 'VIP',
            'admin': '管理员'
        };
        return names[type] || type;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
