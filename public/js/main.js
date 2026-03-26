// 子问设计助手 - 主逻辑
(function() {
    'use strict';

    // 全局状态
    let currentUser = null;
    let isGuestMode = false;
    let uploadedImage = null;
    let selectedStyle = 'modern';
    let selectedSpace = '';
    let selectedQuality = 'fast';
    let selectedCreativity = 5;

    // 创意程度提示
    const creativityHints = {
        1: '严格模式：完全保持线稿结构，不添加任何元素',
        2: '极严格：只添加最基本的必要物品',
        3: '严格：可添加少量基础家具',
        4: '较严格：适度添加软装搭配',
        5: '平衡：保持线稿结构，适度添加装饰（推荐）',
        6: '创意：可以添加更多设计元素',
        7: '较自由：丰富的软装搭配',
        8: '自由：较大的创意发挥',
        9: '非常自由：大量创意元素',
        10: '完全自由：AI 自由发挥'
    };

    // 初始化
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const path = window.location.pathname;
        
        if (path.includes('work.html')) {
            initWorkPage();
        } else if (path.includes('login.html') || path.includes('index.html') || path === '/' || path.endsWith('/')) {
            initAuthPage();
        }
    }

    // ========== 工作台页面 ==========
    function initWorkPage() {
        // 检查 guest 模式
        const urlParams = new URLSearchParams(window.location.search);
        isGuestMode = urlParams.get('guest') === '1';

        // 检查登录状态
        const userStr = localStorage.getItem('user');
        if (!userStr && !isGuestMode) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = userStr ? JSON.parse(userStr) : null;
        updateUserInfo();
        
        // 初始化各个组件
        initUpload();
        initStyleButtons();
        initQualityButtons();
        initCreativitySlider();
        initGenerateButton();
        initResultActions();
        initHistory();
    }

    function updateUserInfo() {
        const userInfoEl = document.getElementById('userInfo');
        const logoutBtn = document.getElementById('logoutBtn');

        if (isGuestMode) {
            userInfoEl.textContent = '访客体验';
            logoutBtn.style.display = 'none';
        } else if (currentUser) {
            userInfoEl.textContent = currentUser.username;
            logoutBtn.style.display = 'flex';
            logoutBtn.onclick = handleLogout;
        } else {
            userInfoEl.textContent = '未登录';
            logoutBtn.style.display = 'none';
        }
    }

    // 上传功能
    function initUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const uploadPreview = document.getElementById('uploadPreview');
        const previewImage = document.getElementById('previewImage');
        const removeBtn = document.getElementById('removeImage');

        // 点击上传
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
                fileInput.click();
            }
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(file);
        });

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.background = 'var(--primary-light)';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border)';
            uploadArea.style.background = 'var(--bg-card)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border)';
            uploadArea.style.background = 'var(--bg-card)';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleFileSelect(file);
            }
        });

        // 移除图片
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            uploadedImage = null;
            uploadPreview.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
            uploadArea.classList.remove('has-image');
            fileInput.value = '';
        });
    }

    function handleFileSelect(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
            document.getElementById('previewImage').src = uploadedImage;
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('uploadPreview').style.display = 'flex';
            document.getElementById('uploadArea').classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }

    // 风格选择
    function initStyleButtons() {
        const styleGrid = document.getElementById('styleGrid');
        const spaceGrid = document.getElementById('spaceGrid');
        
        // 设计风格
        styleGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.style-btn');
            if (!btn) return;
            
            styleGrid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStyle = btn.dataset.style;
        });

        // 空间类型
        if (spaceGrid) {
            spaceGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.style-btn');
                if (!btn) return;
                
                const wasActive = btn.classList.contains('active');
                spaceGrid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
                
                if (!wasActive) {
                    btn.classList.add('active');
                    selectedSpace = btn.dataset.space;
                } else {
                    selectedSpace = '';
                }
            });
        }
    }

    // 画质选择
    function initQualityButtons() {
        const qualityTabs = document.getElementById('qualityTabs');
        
        qualityTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.quality-btn');
            if (!btn) return;
            
            qualityTabs.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuality = btn.dataset.quality;
        });
    }

    // 创意程度滑块
    function initCreativitySlider() {
        const slider = document.getElementById('creativitySlider');
        const valueEl = document.getElementById('creativityValue');
        const hintEl = document.getElementById('creativityHint');

        slider.addEventListener('input', (e) => {
            selectedCreativity = parseInt(e.target.value);
            valueEl.textContent = selectedCreativity;
            hintEl.textContent = creativityHints[selectedCreativity] || '';
        });
    }

    // 生成按钮
    function initGenerateButton() {
        const generateBtn = document.getElementById('generateBtn');

        generateBtn.addEventListener('click', handleGenerate);
    }

    async function handleGenerate() {
        const generateBtn = document.getElementById('generateBtn');
        
        // 验证
        if (!uploadedImage) {
            showToast('请先上传图片', 'error');
            return;
        }

        // 显示加载状态
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;

        try {
            const response = await fetch('/api/draw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: uploadedImage,
                    model: selectedQuality,
                    prompt: getStylePrompt(selectedStyle),
                    spaceId: selectedSpace,
                    creativity: selectedCreativity,
                    userId: currentUser ? currentUser.username : 'guest'
                })
            });

            const result = await response.json();

            if (result.success) {
                // 显示结果
                document.getElementById('resultImage').src = result.image;
                document.getElementById('resultSection').style.display = 'block';
                
                if (result.mock) {
                    showToast('演示模式：API 暂时不可用', 'warning');
                } else {
                    showToast('生成成功！', 'success');
                }
                
                // 滚动到结果
                document.getElementById('resultSection').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // 更新历史记录
                loadHistory();
            } else {
                showToast(result.message || '生成失败', 'error');
            }
        } catch (error) {
            console.error('生成失败:', error);
            showToast('网络错误，请重试', 'error');
        } finally {
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }
    }

    function getStylePrompt(style) {
        const prompts = {
            modern: '现代简约风格，简洁的线条，中性色调，注重功能性和空间感',
            nordic: '北欧风格，原木家具，清新自然，浅色木质，温馨舒适',
            chinese: '新中式风格，传统文化元素与现代设计结合，典雅大气',
            luxury: '轻奢风格，金属质感，精致细节，时尚优雅',
            industrial: '工业风，原始材质，金属管道，个性独特',
            japanese: '日式风格，榻榻米，原木家具，简约清新',
            american: '美式风格，舒适宽敞，经典元素，温馨大气',
            european: '欧式风格，华丽装饰，精致线条，优雅浪漫'
        };
        return prompts[style] || prompts.modern;
    }

    // 结果操作
    function initResultActions() {
        const downloadBtn = document.getElementById('downloadBtn');
        const regenerateBtn = document.getElementById('regenerateBtn');

        downloadBtn.addEventListener('click', () => {
            const resultImage = document.getElementById('resultImage');
            const link = document.createElement('a');
            link.download = `ziwen-design-${Date.now()}.jpg`;
            link.href = resultImage.src;
            link.click();
        });

        regenerateBtn.addEventListener('click', () => {
            document.getElementById('resultSection').style.display = 'none';
            handleGenerate();
        });
    }

    // 历史记录
    function initHistory() {
        const historyHeader = document.getElementById('historyHeader');
        const historyList = document.getElementById('historyList');
        const toggleBtn = document.getElementById('toggleHistory');

        // 切换展开/收起
        historyHeader.addEventListener('click', () => {
            const isExpanded = historyList.style.display !== 'none';
            historyList.style.display = isExpanded ? 'none' : 'grid';
            toggleBtn.classList.toggle('active', !isExpanded);
        });

        // 加载历史
        loadHistory();
    }

    async function loadHistory() {
        const historyList = document.getElementById('historyList');
        const historyCount = document.getElementById('historyCount');
        
        if (!currentUser || isGuestMode) {
            historyCount.textContent = '0';
            return;
        }

        try {
            const response = await fetch(`/api/history?username=${currentUser.username}`);
            const result = await response.json();

            if (result.success && result.history.length > 0) {
                historyCount.textContent = result.history.length;
                
                historyList.innerHTML = result.history.slice(0, 6).map(item => `
                    <div class="history-item" onclick="viewHistory('${item.image}')">
                        <img src="${item.image}" alt="历史记录">
                        <div class="history-overlay">${formatDate(item.timestamp)}</div>
                    </div>
                `).join('');
            } else {
                historyCount.textContent = '0';
                historyList.innerHTML = '<p class="empty-text">暂无历史记录</p>';
            }
        } catch (error) {
            console.error('加载历史失败:', error);
        }
    }

    // 全局函数供 onclick 使用
    window.viewHistory = function(imageSrc) {
        document.getElementById('resultImage').src = imageSrc;
        document.getElementById('resultSection').style.display = 'block';
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    };

    // 退出登录
    function handleLogout() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    // ========== 认证页面 ==========
    function initAuthPage() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabBtns = document.querySelectorAll('.tab-btn');

        // 标签切换
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchTab(tab);
            });
        });

        // 登录
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // 注册
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }

        // 直接体验链接
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('guest') === '1') {
            window.location.href = 'work.html?guest=1';
        }
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}Form`);
        });
    }

    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!username || !password) {
            showError(errorDiv, '请填写用户名和密码');
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
                currentUser = { username: result.user.username };
                localStorage.setItem('user', JSON.stringify(currentUser));
                showToast('登录成功', 'success');
                setTimeout(() => {
                    window.location.href = 'work.html';
                }, 500);
            } else {
                showError(errorDiv, result.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            showError(errorDiv, '登录失败，请检查网络');
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('registerError');

        // 验证
        if (!username || !password) {
            showError(errorDiv, '请填写用户名和密码');
            return;
        }

        if (username.length < 3) {
            showError(errorDiv, '用户名至少 3 位');
            return;
        }

        if (password.length < 6) {
            showError(errorDiv, '密码至少 6 位');
            return;
        }

        if (password !== confirmPassword) {
            showError(errorDiv, '两次密码不一致');
            return;
        }

        try {
            // 注册
            const regResponse = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const regResult = await regResponse.json();

            if (!regResult.success) {
                showError(errorDiv, regResult.message || '注册失败');
                return;
            }

            // 自动登录
            const loginResponse = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const loginResult = await loginResponse.json();

            if (loginResult.success) {
                currentUser = { username: loginResult.user.username };
                localStorage.setItem('user', JSON.stringify(currentUser));
                showToast('注册成功，已自动登录', 'success');
                setTimeout(() => {
                    window.location.href = 'work.html';
                }, 500);
            } else {
                showToast('注册成功，请登录', 'success');
                switchTab('login');
            }
        } catch (error) {
            console.error('注册失败:', error);
            showError(errorDiv, '注册失败，请检查网络');
        }
    }

    // ========== 工具函数 ==========
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

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
})();
