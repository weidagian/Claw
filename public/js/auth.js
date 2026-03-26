// 登录注册逻辑
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // 登录
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 注册
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // 处理登录
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 登录成功，保存用户信息
                localStorage.setItem('user', JSON.stringify(result.user));
                
                alert('登录成功');
                window.location.href = 'work-v3.html';
            } else {
                alert(result.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            alert('登录失败，请检查网络连接');
        }
    }
    
    // 处理注册
    async function handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const password2 = document.getElementById('reg-password2').value;
        
        // 验证
        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }
        
        if (username.length < 4 || username.length > 20) {
            alert('用户名需要 4-20 个字符');
            return;
        }
        
        if (password.length < 6) {
            alert('密码至少需要 6 位');
            return;
        }
        
        if (password !== password2) {
            alert('两次输入的密码不一致');
            return;
        }
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 注册成功，直接登录
                localStorage.setItem('user', JSON.stringify(result.user));
                
                alert('注册成功');
                window.location.href = 'work-v3.html';
            } else {
                alert(result.message || '注册失败');
            }
        } catch (error) {
            console.error('注册失败:', error);
            alert('注册失败，请检查网络连接');
        }
    }
    
    // 调用云函数
    async function callCloudFunction(action, data) {
        try {
            const response = await fetch(CONFIG.CLOUD_FUNC[action], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
    
    // 本地测试模式 - 登录
    function localTestLogin(username) {
        // 检查是否已注册
        const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
        const user = users.find(u => u.username === username);
        
        if (user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            localStorage.setItem(STORAGE_KEYS.USERNAME, username);
            localStorage.setItem(STORAGE_KEYS.USED_TIMES, user.usedTimes || 0);
            alert('登录成功（本地测试模式）');
            window.location.href = 'work.html';
        } else {
            alert('用户名或密码错误');
        }
    }
    
    // 本地测试模式 - 注册
    function localTestRegister(username, password) {
        const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
        
        // 检查是否已存在
        if (users.find(u => u.username === username)) {
            alert('用户名已存在');
            return;
        }
        
        // 添加新用户
        const newUser = {
            username,
            password,
            usedTimes: 0,
            createTime: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('ai_users', JSON.stringify(users));
        
        alert('注册成功（本地测试模式），请登录');
        window.location.href = 'login.html';
    }
});
