// 子问设计助手 - 工作页面 V3 (简洁版)

// 全局变量
let currentImage = null;
let resultImage = null;
let currentMode = 'sketch'; // 'sketch' 或 'floorplan'
let currentStyleIndex = 0;
let currentQuality = 'fast';
let isGenerating = false;

// DOM 元素
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const displayContent = document.getElementById('displayContent');
const displayPlaceholder = document.getElementById('displayPlaceholder');
const imageContainer = document.getElementById('imageContainer');
const sourceImage = document.getElementById('sourceImage');
const resultImageEl = document.getElementById('resultImage');
const resultBox = document.getElementById('resultBox');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const prevStyleBtn = document.getElementById('prevStyle');
const nextStyleBtn = document.getElementById('nextStyle');
const currentStyleName = document.getElementById('currentStyleName');
const currentStyleDesc = document.getElementById('currentStyleDesc');
const creativityRange = document.getElementById('creativityRange');
const creativityValue = document.getElementById('creativityValue');
const creativityDesc = document.getElementById('creativityDesc');
const promptInput = document.getElementById('promptInput');
const historyGrid = document.getElementById('historyGrid');
const remainingTimesEl = document.getElementById('remainingTimes');

// 风格列表
const styles = CONFIG.STYLES || [
    { name: '现代简约', desc: '简洁明快，注重功能性' },
    { name: '北欧风格', desc: '自然温馨，舒适简约' },
    { name: '轻奢风格', desc: '精致优雅，低调奢华' },
    { name: '新中式', desc: '传统与现代的融合' },
    { name: '美式田园', desc: '自然休闲，温馨舒适' },
    { name: '日式禅意', desc: '朴素自然，静谧安宁' }
];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户登录状态
    checkUserLogin();
    
    initModeToggle();
    initStyleSelector();
    initQualitySelector();
    initCreativitySlider();
    initUpload();
    initGenerate();
    initActions();
    loadUserInfo();
    loadHistory();
    updateRemainingTimes();
});

// 检查用户登录状态
function checkUserLogin() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // 如果没有用户信息，跳转到登录页
    if (!user) {
        // 检查是否是通过“直接体验”进入的（URL 中包含 ?demo=1）
        const urlParams = new URLSearchParams(window.location.search);
        const isDemo = urlParams.get('demo') === '1';
        
        if (!isDemo) {
            window.location.href = 'login.html';
        }
    }
}

// 模式切换
function initModeToggle() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            
            // 更新显示标题
            const displayTitle = document.getElementById('displayTitle');
            displayTitle.textContent = currentMode === 'sketch' ? '效果图预览' : '平面图效果图';
            
            // 重置结果
            resetResult();
        });
    });
}

// 风格选择器
function initStyleSelector() {
    updateStyleDisplay();
    
    prevStyleBtn.addEventListener('click', () => {
        currentStyleIndex = (currentStyleIndex - 1 + styles.length) % styles.length;
        updateStyleDisplay();
    });
    
    nextStyleBtn.addEventListener('click', () => {
        currentStyleIndex = (currentStyleIndex + 1) % styles.length;
        updateStyleDisplay();
    });
}

function updateStyleDisplay() {
    const style = styles[currentStyleIndex];
    currentStyleName.textContent = style.name;
    currentStyleDesc.textContent = style.desc;
}

// 画质选择器
function initQualitySelector() {
    const qualityOptions = document.querySelectorAll('.quality-option');
    
    qualityOptions.forEach(option => {
        option.addEventListener('click', () => {
            qualityOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            currentQuality = option.dataset.quality;
        });
    });
}

// 创意程度滑块
function initCreativitySlider() {
    const creativityDescriptions = [
        '严格遵循原图',
        '主要保持原图结构',
        '轻微改变',
        '适度改变',
        '视觉效果最好的平衡点',
        '更加创新',
        '明显创新',
        '大胆创新',
        '极度创意',
        '完全重新设计'
    ];
    
    function updateCreativity() {
        const value = parseInt(creativityRange.value);
        creativityValue.textContent = value;
        creativityDesc.textContent = creativityDescriptions[value - 1];
        creativityRange.style.setProperty('--value', `${value * 10}%`);
    }
    
    creativityRange.addEventListener('input', updateCreativity);
    updateCreativity();
}

// 上传功能
function initUpload() {
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    displayContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        displayContent.style.background = '#e8f0fe';
    });
    
    displayContent.addEventListener('dragleave', (e) => {
        e.preventDefault();
        displayContent.style.background = '';
    });
    
    displayContent.addEventListener('drop', (e) => {
        e.preventDefault();
        displayContent.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        displaySourceImage(currentImage);
        generateBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function displaySourceImage(src) {
    sourceImage.src = src;
    displayPlaceholder.classList.add('hidden');
    imageContainer.classList.remove('hidden');
    
    // 如果已有结果，显示双图
    if (resultImage) {
        imageContainer.classList.add('has-both');
        resultBox.classList.remove('hidden');
    } else {
        imageContainer.classList.remove('has-both');
        resultBox.classList.add('hidden');
    }
}

function resetResult() {
    resultImage = null;
    resultImageEl.src = '';
    resultBox.classList.add('hidden');
    imageContainer.classList.remove('has-both');
    downloadBtn.disabled = true;
    shareBtn.disabled = true;
}

// 生成功能
function initGenerate() {
    generateBtn.addEventListener('click', startGenerate);
}

async function startGenerate() {
    if (!currentImage || isGenerating) return;
    
    // 检查剩余次数
    const user = getCurrentUser();
    if (!user) {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }
    
    if (user.freePoints <= 0) {
        alert('您的免费次数已用完');
        return;
    }
    
    isGenerating = true;
    generateBtn.classList.add('loading');
    btnText.innerHTML = '<span class="loading-spinner"></span>生成中...';
    generateBtn.disabled = true;
    
    try {
        const style = styles[currentStyleIndex];
        const creativity = parseInt(creativityRange.value);
        const prompt = promptInput.value;
        
        // 构建提示词
        let finalPrompt = style.name;
        if (prompt) {
            finalPrompt += `, ${prompt}`;
        }
        
        // 调用 AI 生成
        const result = await generateImage(currentImage, finalPrompt, creativity, currentQuality);
        
        if (result.success) {
            resultImage = result.image;
            resultImageEl.src = resultImage;
            resultBox.classList.remove('hidden');
            imageContainer.classList.add('has-both');
            
            // 启用下载和分享
            downloadBtn.disabled = false;
            shareBtn.disabled = false;
            
            // 扣除次数
            user.freePoints -= 1;
            user.totalUsage += 1;
            saveUser(user);
            updateRemainingTimes();
            
            // 保存到历史记录
            saveToHistory(currentImage, resultImage, style.name);
            loadHistory();
        } else {
            alert(result.message || '生成失败，请重试');
        }
    } catch (error) {
        console.error('生成失败:', error);
        alert('生成失败，请检查网络连接');
    } finally {
        isGenerating = false;
        generateBtn.classList.remove('loading');
        btnText.textContent = '开始生成效果图';
        generateBtn.disabled = false;
    }
}

// AI 生成接口
async function generateImage(image, prompt, creativity, quality) {
    // 这里调用实际的 AI API
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image,
                prompt,
                creativity,
                quality,
                mode: currentMode
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API 调用失败:', error);
        return { success: false, message: '网络错误' };
    }
}

// 操作功能
function initActions() {
    downloadBtn.addEventListener('click', downloadImage);
    shareBtn.addEventListener('click', shareImage);
}

function downloadImage() {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `效果图_${Date.now()}.png`;
    link.click();
}

function shareImage() {
    if (!resultImage) return;
    
    if (navigator.share) {
        navigator.share({
            title: '子问设计助手 - 效果图',
            url: window.location.href
        }).catch(console.error);
    } else {
        // 复制链接
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert('链接已复制到剪贴板'))
            .catch(() => alert('复制失败，请手动分享链接'));
    }
}

// 用户管理
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function saveUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function loadUserInfo() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
    }
}

function updateRemainingTimes() {
    const user = getCurrentUser();
    if (user) {
        remainingTimesEl.textContent = user.freePoints || 0;
    }
}

// 历史记录
function saveToHistory(source, result, style) {
    let history = JSON.parse(localStorage.getItem('workHistory') || '[]');
    history.unshift({
        id: Date.now(),
        source,
        result,
        style,
        date: new Date().toISOString()
    });
    
    // 只保留最近 20 条
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    localStorage.setItem('workHistory', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('workHistory') || '[]');
    
    if (history.length === 0) {
        historyGrid.innerHTML = `
            <div class="empty-history">
                <p>还没有历史作品</p>
                <p style="font-size: 12px; margin-top: 8px;">上传图片开始创作吧！</p>
            </div>
        `;
        return;
    }
    
    historyGrid.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadHistoryItem('${item.id}')">
            <div class="history-thumb">
                <img src="${item.result}" alt="效果图">
            </div>
            <div class="history-info">
                <div style="font-size: 12px; font-weight: 500;">${item.style}</div>
                <div class="history-date">${formatDate(item.date)}</div>
            </div>
        </div>
    `).join('');
}

function loadHistoryItem(id) {
    const history = JSON.parse(localStorage.getItem('workHistory') || '[]');
    const item = history.find(h => h.id === parseInt(id));
    
    if (item) {
        currentImage = item.source;
        resultImage = item.result;
        displaySourceImage(currentImage);
        resultImageEl.src = resultImage;
        resultBox.classList.remove('hidden');
        imageContainer.classList.add('has-both');
        downloadBtn.disabled = false;
        shareBtn.disabled = false;
        generateBtn.disabled = false;
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
}
