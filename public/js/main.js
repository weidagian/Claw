// 子问设计助手 - 首页逻辑

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});

// 加载用户信息
function loadUserInfo() {
    const user = localStorage.getItem('currentUser');
    const userArea = document.getElementById('userArea');
    
    if (user) {
        const userData = JSON.parse(user);
        userArea.innerHTML = `
            <a href="center.html" class="user-menu">
                <div class="user-avatar">${userData.username.charAt(0).toUpperCase()}</div>
                <span class="user-name">${userData.username}</span>
            </a>
        `;
    } else {
        userArea.innerHTML = `
            <a href="login.html" class="btn btn-primary btn-sm">登录</a>
        `;
    }
}

// 暴露给全局
window.loadUserInfo = loadUserInfo;
