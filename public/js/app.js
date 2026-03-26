// 子问设计助手 - 前端逻辑
(function() {
    'use strict';

    // 全局状态
    let currentUser = null;
    let isGuestMode = false;
    let uploadedImage = null;
    let generationHistory = [];

    // 初始化
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // 检查当前页面
        const path = window.location.pathname;

        if (path.includes('index.html') || path === '/') {
            initAuthPage();
        } else if (path.includes('work.html')) {
            initWorkPage();
        }
    }

    // ==================== 认证页面逻辑 ====================
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

        // 登录表单
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // 注册表单
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
    }

    function switchTab(tab) {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');

        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        forms.forEach(form => {
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
                // 保存用户信息
                currentUser = {
                    username: result.user.username
                };
                localStorage.setItem('user', JSON.stringify(currentUser));
                showToast('登录成功', 'success');
                window.location.href = 'work.html';
            } else {
                showError(errorDiv, result.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            showError(errorDiv, '登录失败，请检查网络连接');
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
            showError(errorDiv, '用户名至少需要 3 位');
            return;
        }

        if (password.length < 6) {
            showError(errorDiv, '密码至少需要 6 位');
            return;
        }

        if (password !== confirmPassword) {
            showError(errorDiv, '两次输入的密码不一致');
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
                currentUser = {
                    username: loginResult.user.username
                };
                localStorage.setItem('user', JSON.stringify(currentUser));
                showToast('注册成功', 'success');
                window.location.href = 'work.html';
            } else {
                // 注册成功但登录失败，跳转到登录页
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('注册失败:', error);
            showError(errorDiv, '注册失败，请检查网络连接');
        }
    }

    // ==================== 工作台页面逻辑 ====================
    function initWorkPage() {
        // 检查是否为访客模式
        const urlParams = new URLSearchParams(window.location.search);
        isGuestMode = urlParams.get('guest') === '1';

        // 获取用户信息
        const userStr = localStorage.getItem('user');
        if (!userStr && !isGuestMode) {
            window.location.href = 'index.html';
            return;
        }

        currentUser = userStr ? JSON.parse(userStr) : null;
        updateUserInfo();

        // 初始化上传
        initUpload();

        // 初始化参数
        initOptions();

        // 初始化生成按钮
        initGenerate();

        // 初始化结果操作
        initResultActions();

        // 初始化退出登录
        initLogout();

        // 加载历史记录
        loadHistory();
    }

    function updateUserInfo() {
        const userInfoEl = document.getElementById('userInfo');
        const logoutBtn = document.getElementById('logoutBtn');

        if (isGuestMode) {
            userInfoEl.textContent = '访客模式';
            logoutBtn.style.display = 'none';
        } else if (currentUser) {
            userInfoEl.textContent = currentUser.username;
            logoutBtn.style.display = 'block';
        } else {
            userInfoEl.textContent = '未登录';
            logoutBtn.style.display = 'none';
        }
    }

    function initUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadPreview = document.getElementById('uploadPreview');
        const previewImage = document.getElementById('previewImage');
        const removeBtn = document.getElementById('removeImage');

        // 点击上传
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== removeBtn) {
                fileInput.click();
            }
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleFileSelect(file);
            }
        });

        // 移除图片
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            uploadedImage = null;
            document.querySelector('.upload-placeholder').style.display = 'block';
            uploadPreview.style.display = 'none';
            fileInput.value = '';
        });

        function handleFileSelect(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = e.target.result;
                previewImage.src = uploadedImage;
                document.querySelector('.upload-placeholder').style.display = 'none';
                uploadPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    function initOptions() {
        const creativitySlider = document.getElementById('creativitySlider');
        const creativityValue = document.getElementById('creativityValue');
        const creativityHint = document.getElementById('creativityHint');

        const hints = {
            1: '严格模式：完全按照线稿，不添加任何元素',
            2: '非常严格：可添加最基本的功能性物品',
            3: '较严格：可添加少量基础家具和必要软装',
            4: '适中：保持线稿结构，适度添加装饰',
            5: '平衡模式：保持线稿结构，适度添加装饰（推荐）',
            6: '创意：可添加设计感的家具和装饰元素',
            7: '较创意：添加丰富的软装搭配',
            8: '自由：较大的创意发挥',
            9: '非常自由：大胆创意，添加设计元素',
            10: '完全自由：AI 自由发挥创意'
        };

        creativitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            creativityValue.textContent = value;
            creativityHint.textContent = hints[value] || '';
        });
    }

    function initGenerate() {
        const generateBtn = document.getElementById('generateBtn');
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');

        generateBtn.addEventListener('click', async () => {
            if (!uploadedImage) {
                showToast('请先上传图片', 'error');
                return;
            }

            const style = document.getElementById('styleSelect').value;
            const quality = document.getElementById('qualitySelect').value;
            const creativity = document.getElementById('creativitySlider').value;

            // 禁用按钮
            generateBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';

            try {
                const styleNames = {
                    modern: '现代简约',
                    nordic: '北欧风格',
                    chinese: '新中式',
                    luxury: '轻奢风格',
                    industrial: '工业风',
                    japanese: '日式风格',
                    american: '美式风格',
                    european: '欧式风格'
                };

                const qualityNames = {
                    fast: '标准',
                    hd: '高清',
                    pro: '专业'
                };

                const prompt = `设计风格：${styleNames[style] || style}，请根据上传的线稿/平面图进行室内设计渲染`;

                const response = await fetch('/api/draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: uploadedImage,
                        model: quality,
                        prompt: prompt,
                        negative: '不要添加水印、logo、签名',
                        creativity: creativity,
                        userId: currentUser ? currentUser.username : 'guest'
                    })
                });

                const result = await response.json();

                if (result.success && result.image) {
                    showResult(result.image, style, quality, creativity);
                    showToast('生成成功', 'success');

                    // 保存到历史记录
                    if (!isGuestMode && currentUser) {
                        saveToHistory(result.image, style, quality, creativity);
                    }
                } else {
                    showToast(result.message || '生成失败', 'error');
                }
            } catch (error) {
                console.error('生成失败:', error);
                showToast('生成失败，请检查网络连接', 'error');
            } finally {
                // 恢复按钮
                generateBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        });
    }

    function showResult(imageUrl, style, quality, creativity) {
        const resultSection = document.getElementById('resultSection');
        const resultImage = document.getElementById('resultImage');

        resultImage.src = imageUrl;
        resultSection.style.display = 'block';

        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function initResultActions() {
        const downloadBtn = document.getElementById('downloadBtn');
        const shareBtn = document.getElementById('shareBtn');
        const resultImage = document.getElementById('resultImage');

        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = resultImage.src;
            link.download = `子问设计_${Date.now()}.png`;
            link.click();
            showToast('下载成功', 'success');
        });

        shareBtn.addEventListener('click', () => {
            if (navigator.share) {
                resultImage.toBlob(blob => {
                    const file = new File([blob], '子问设计.png', { type: 'image/png' });
                    navigator.share({
                        title: '子问设计助手',
                        text: '我用子问设计助手生成的效果图',
                        files: [file]
                    }).catch(() => {});
                });
            } else {
                showToast('您的浏览器不支持分享功能', 'error');
            }
        });
    }

    function initLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            currentUser = null;
            window.location.href = 'index.html';
        });
    }

    // ==================== 历史记录 ====================
    function saveToHistory(imageUrl, style, quality, creativity) {
        if (!currentUser) return;

        const historyKey = `history_${currentUser.username}`;
        generationHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');

        const newRecord = {
            id: Date.now(),
            image: imageUrl,
            style: style,
            quality: quality,
            creativity: creativity,
            timestamp: new Date().toISOString()
        };

        generationHistory.unshift(newRecord);
        // 只保留最近 20 条
        generationHistory = generationHistory.slice(0, 20);

        localStorage.setItem(historyKey, JSON.stringify(generationHistory));
        updateHistoryDisplay();
    }

    function loadHistory() {
        if (!currentUser) {
            document.getElementById('historySection').style.display = 'none';
            return;
        }

        const historyKey = `history_${currentUser.username}`;
        generationHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        updateHistoryDisplay();
    }

    function updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const historyCount = document.getElementById('historyCount');

        historyCount.textContent = `${generationHistory.length} 条`;

        if (generationHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-text">暂无历史记录</p>';
            return;
        }

        const styleNames = {
            modern: '现代简约',
            nordic: '北欧',
            chinese: '新中式',
            luxury: '轻奢',
            industrial: '工业',
            japanese: '日式',
            american: '美式',
            european: '欧式'
        };

        historyList.innerHTML = generationHistory.map(record => `
            <div class="history-item" onclick="viewHistoryItem('${record.image}')">
                <img src="${record.image}" alt="历史记录">
                <div class="history-item-info">
                    <p>${styleNames[record.style] || record.style}</p>
                    <p>${new Date(record.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    }

    // 全局函数：查看历史记录
    window.viewHistoryItem = function(imageUrl) {
        showResult(imageUrl, '', '', '');
    };

    // ==================== 工具函数 ====================
    function showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 3000);
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
})();
