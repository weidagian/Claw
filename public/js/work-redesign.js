// 全局变量
let currentImage = null;
let resultImages = [];
let selectedSpaces = [];
let isGenerating = false;
let currentMode = 'sketch';

// DOM 元素
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const previewImage = document.getElementById('previewImage');
const uploadTitle = document.getElementById('uploadTitle');
const uploadSubtext = document.getElementById('uploadSubtext');
const styleSelect = document.getElementById('styleSelect');
const modelSelect = document.getElementById('modelSelect');
const creativityRange = document.getElementById('creativityRange');
const creativityValue = document.getElementById('creativityValue');
const creativityDesc = document.getElementById('creativityDesc');
const extraPrompt = document.getElementById('extraPrompt');
const generateBtn = document.getElementById('generateBtn');
const compareContainer = document.getElementById('compareContainer');
const resultActions = document.getElementById('resultActions');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const historyGrid = document.getElementById('historyGrid');
const spaceGrid = document.getElementById('spaceGrid');
const selectedCount = document.getElementById('selectedCount');
const costEstimate = document.getElementById('costEstimate');
const usageTip = document.getElementById('usageTip');
const floorplanGroup = document.getElementById('floorplanGroup');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initModeSelector();
    initStyles();
    initSpaces();
    initCreativitySlider();
    initUpload();
    initGenerate();
    initHistory();
    loadUserInfo();
    updateRemainingTimes();
});

// 初始化模式选择器
function initModeSelector() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有active状态
            modeBtns.forEach(b => b.classList.remove('active'));
            // 添加当前active状态
            btn.classList.add('active');
            
            // 切换模式
            currentMode = btn.dataset.mode;
            
            // 根据模式显示不同内容
            updateModeUI(currentMode);
        });
    });
}

// 更新模式UI
function updateModeUI(mode) {
    if (mode === 'sketch') {
        // 线稿模式
        uploadTitle.textContent = '上传线稿图';
        uploadSubtext.textContent = '上传手绘线稿图';
        floorplanGroup.style.display = 'none';
        spaceGrid.classList.remove('visible');
        selectedSpaces = [];
        updateSpaceCount();
    } else {
        // 平面图模式
        uploadTitle.textContent = '上传平面图';
        uploadSubtext.textContent = '上传户型平面图';
        floorplanGroup.style.display = 'block';
        spaceGrid.classList.add('visible');
        // 默认只选择客厅
        selectedSpaces = ['living'];
        updateSpaceSelection();
        updateSpaceCount();
    }
    
    checkCanGenerate();
}

// 初始化风格下拉框
function initStyles() {
    const sortedStyles = getSortedStyles();
    styleSelect.innerHTML = sortedStyles.map(style => 
        `<option value="${style.name}">${style.name}</option>`
    ).join('');
}

// 初始化空间选择
function initSpaces() {
    spaceGrid.innerHTML = CONFIG.SPACES.map(space => `
        <div class="space-item" data-space="${space.id}" onclick="toggleSpace('${space.id}')">
            <span class="icon">${space.icon}</span>
            <span class="name">${space.name}</span>
        </div>
    `).join('');
}

// 切换空间选择
function toggleSpace(spaceId) {
    const index = selectedSpaces.indexOf(spaceId);
    if (index > -1) {
        selectedSpaces.splice(index, 1);
    } else {
        selectedSpaces.push(spaceId);
    }
    
    updateSpaceSelection();
    updateSpaceCount();
    checkCanGenerate();
}

// 更新空间选择UI
function updateSpaceSelection() {
    document.querySelectorAll('.space-item').forEach(item => {
        if (selectedSpaces.includes(item.dataset.space)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// 更新空间数量
function updateSpaceCount() {
    const count = selectedSpaces.length;
    selectedCount.textContent = count;
    const userType = getUserType();
    const packageConfig = getPackageConfig();
    
    if (count > 0 && currentMode === 'floorplan') {
        const cost = getCostPoints(modelSelect.value, count);
        
        if (userType === 'monthly' || userType === 'yearly') {
            const dailyStats = getDailyStats();
            if (modelSelect.value === 'hd') {
                costEstimate.textContent = `(${dailyStats.hd}/${packageConfig.hdDaily}次/天)`;
            } else if (modelSelect.value === 'pro') {
                costEstimate.textContent = `(${dailyStats.pro}/${packageConfig.proDaily}次/天)`;
            } else {
                costEstimate.textContent = '(无限次)';
            }
        } else {
            costEstimate.textContent = `(消耗 ${cost} 点)`;
        }
    } else {
        costEstimate.textContent = '';
    }
    
    checkCanGenerate();
}

// 初始化创意程度滑块
function initCreativitySlider() {
    creativityRange.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        creativityValue.textContent = value;
        creativityDesc.textContent = getCreativityDescription(value);
    });
    
    modelSelect.addEventListener('change', updateSpaceCount);
    
    creativityDesc.textContent = getCreativityDescription(5);
}

// 获取创意程度描述
function getCreativityDescription(level) {
    const descriptions = {
        1: '极度严格 - 完全按草图生成',
        2: '非常严格 - 保持99%线条',
        3: '严格 - 保持主体结构',
        4: '较严格 - 允许少量装饰',
        5: '视觉效果最好的平衡点',
        6: '适度创意 - 添加设计元素',
        7: '创意 - 丰富软装搭配',
        8: '较自由 - 大量创意元素',
        9: '很自由 - 创意自由发挥',
        10: 'AI完全自由创意'
    };
    return descriptions[level] || '';
}

// 初始化上传功能
function initUpload() {
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
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
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        previewImage.src = currentImage;
        previewImage.hidden = false;
        uploadPlaceholder.hidden = true;
        uploadArea.classList.add('has-image');
        
        checkCanGenerate();
    };
    reader.readAsDataURL(file);
}

// 检查是否可以生成
function checkCanGenerate() {
    const hasImage = !!currentImage;
    
    // 线稿模式：只需要图片
    // 平面图模式：需要图片和空间选择
    let canGenerate = hasImage;
    if (currentMode === 'floorplan') {
        const hasSpaces = selectedSpaces.length > 0;
        canGenerate = hasImage && hasSpaces;
    }
    
    generateBtn.disabled = !canGenerate;
}

// 初始化生成功能
function initGenerate() {
    generateBtn.addEventListener('click', startBatchGenerate);
    downloadBtn.addEventListener('click', downloadAllImages);
    shareBtn.addEventListener('click', shareAllImages);
}

// 批量生成
async function startBatchGenerate() {
    if (!currentImage || isGenerating) return;
    
    // 线稿模式：生成1张，不需要空间
    // 平面图模式：根据选择的空间数量生成
    const spaceCount = currentMode === 'sketch' ? 1 : selectedSpaces.length;
    const spaceIds = currentMode === 'sketch' ? [null] : selectedSpaces;
    
    if (currentMode === 'floorplan' && spaceIds.length === 0) {
        alert('请至少选择一个空间');
        return;
    }
    
    // 检查次数
    const model = modelSelect.value;
    const checkResult = checkAndDeduct(model, spaceCount);
    
    if (!checkResult.success) {
        alert(checkResult.message);
        if (checkResult.needLogin) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    const btnText = generateBtn.querySelector('.btn-text');
    btnText.textContent = `生成中 (0/${spaceCount})`;
    
    const progressBar = generateBtn.querySelector('.progress-bar');
    const progressText = generateBtn.querySelector('.progress-text');
    progressBar.hidden = false;
    progressText.hidden = false;
    
    resultImages = [];
    const results = [];
    
    try {
        const style = { name: styleSelect.value };
        const creativityLevel = parseInt(creativityRange.value);
        const extra = extraPrompt.value;
        
        // 逐个生成
        for (let i = 0; i < spaceIds.length; i++) {
            const spaceId = spaceIds[i];
            const space = spaceId ? CONFIG.SPACES.find(s => s.id === spaceId) : null;
            const spaceName = space?.name || (currentMode === 'sketch' ? '效果图' : '未知');
            
            updateProgress(
                Math.round((i / spaceIds.length) * 80),
                `正在生成 ${spaceName}... (${i + 1}/${spaceIds.length})`
            );
            
            try {
                const result = await generateSingleImage(
                    currentImage,
                    style,
                    creativityLevel,
                    extra,
                    spaceId
                );
                
                if (result.success && result.image) {
                    results.push({
                        spaceId: spaceId,
                        spaceName: spaceName,
                        spaceIcon: space?.icon || '🎨',
                        image: result.image
                    });
                }
            } catch (err) {
                console.error(`生成 ${spaceId} 失败:`, err);
            }
        }
        
        updateProgress(90, '处理完成...');
        
        // 显示结果
        resultImages = results;
        showBatchResults(results);
        
        // 记录风格使用
        recordStyleUsage(styleSelect.value);
        
        // 保存到历史记录
        saveToHistory(currentImage, results);
        
        // 更新剩余次数显示
        updateRemainingTimes();
        
        updateProgress(100, '完成!');
        
    } catch (error) {
        alert('生成失败: ' + error.message);
    }
    
    resetGenerateButton();
}

// 生成单张图片
async function generateSingleImage(imageData, style, creativityLevel, extraPrompt, spaceId) {
    const model = CONFIG.MODELS[modelSelect.value];
    
    // 构建提示词
    const promptData = buildPrompt(style, creativityLevel, extraPrompt, spaceId, currentMode);
    console.log(`开始生成图片 - 模型: ${model.name}, 空间: ${spaceId}, 模式: ${currentMode}`);
    console.log(`提示词:`, promptData.prompt);
    
    // 调用正确的 API: /v1/draw/nano-banana
    const response = await fetch(`${CONFIG.AI_API_HOST}/v1/draw/nano-banana`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.AI_API_KEY}`
        },
        body: JSON.stringify({
            model: model.name,
            urls: [imageData],
            prompt: promptData.prompt,
            aspectRatio: 'auto',
            imageSize: '1K',
            webHook: '-1',
            shutProgress: true
        })
    });
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error(`创建任务失败:`, err);
        throw new Error(err.msg || err.message || `API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`创建任务响应:`, data);
    
    // 检查是否成功返回 id
    if (data.code === 0 && data.data && data.data.id) {
        const taskId = data.data.id;
        console.log(`任务创建成功, ID: ${taskId}`);
        
        // 轮询获取结果
        return await pollForResult(taskId);
    } else {
        console.error(`任务创建失败:`, data);
        throw new Error(data.msg || '任务创建失败');
    }
}

// 轮询获取结果
async function pollForResult(taskId, maxAttempts = 180, interval = 3000) {
    console.log(`开始轮询任务: ${taskId}, 最多轮询 ${maxAttempts} 次`);
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(`${CONFIG.AI_API_HOST}/v1/draw/result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.AI_API_KEY}`
                },
                body: JSON.stringify({
                    id: taskId
                })
            });
            
            if (!response.ok) {
                console.error(`轮询失败 (${i+1}/${maxAttempts}): HTTP ${response.status}`);
                throw new Error(`获取结果失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`轮询结果 (${i+1}/${maxAttempts}):`, data);
            
            if (data.code === 0 && data.data) {
                const taskData = data.data;
                
                if (taskData.status === 'succeeded' && taskData.results && taskData.results.length > 0) {
                    console.log(`✅ 任务成功完成! 图片URL:`, taskData.results[0].url);
                    return {
                        success: true,
                        image: taskData.results[0].url
                    };
                } else if (taskData.status === 'failed') {
                    console.error(`❌ 任务失败:`, taskData.failure_reason || taskData.error);
                    throw new Error(taskData.failure_reason || taskData.error || '生成失败');
                } else if (taskData.status === 'running') {
                    console.log(`⏳ 任务进行中... 进度: ${taskData.progress}%`);
                }
            } else if (data.code === -22) {
                throw new Error('任务不存在');
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            console.error(`轮询错误 (${i+1}/${maxAttempts}):`, error);
            if (i === maxAttempts - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    
    throw new Error(`任务超时（已轮询 ${maxAttempts * interval / 1000} 秒）`);
}

// 更新进度
function updateProgress(percent, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
}

// 重置生成按钮
function resetGenerateButton() {
    isGenerating = false;
    
    // 线稿模式：只要有图片就可以生成
    // 平面图模式：需要图片和空间选择
    let canGenerate = !!currentImage;
    if (currentMode === 'floorplan') {
        canGenerate = !!currentImage && selectedSpaces.length > 0;
    }
    
    generateBtn.disabled = !canGenerate;
    generateBtn.classList.remove('loading');
    generateBtn.querySelector('.btn-text').textContent = '开始生成';
    
    const progressBar = generateBtn.querySelector('.progress-bar');
    const progressText = generateBtn.querySelector('.progress-text');
    progressBar.hidden = true;
    progressText.hidden = true;
}

// 显示批量结果
function showBatchResults(results) {
    if (results.length === 0) {
        compareContainer.innerHTML = `
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <h4>生成失败</h4>
                <p>请重试</p>
            </div>
        `;
        resultActions.style.display = 'none';
        return;
    }
    
    if (results.length === 1) {
        // 单张结果：直接显示大图
        const result = results[0];
        compareContainer.innerHTML = `
            <div style="width: 100%; height: 100%;">
                <img src="${result.image}" style="width: 100%; height: auto; max-height: 100%; object-fit: contain; cursor: pointer;" onclick="downloadSingleImage('${result.image}', '${result.spaceName}')" alt="${result.spaceName}效果图">
                <div style="position: absolute; top: 10px; left: 10px; padding: 8px 12px; background: rgba(0,0,0,0.7); color: white; border-radius: 8px; font-size: 0.875rem;">
                    <span style="margin-right: 8px;">${result.spaceIcon}</span>
                    <span style="font-weight: 600;">${result.spaceName}</span>
                </div>
            </div>
        `;
    } else {
        // 多张结果：网格展示
        compareContainer.innerHTML = `
            <div class="results-grid">
                ${results.map(r => `
                    <div class="result-card">
                        <div class="space-tag">
                            <span>${r.spaceIcon}</span>
                            <span>${r.spaceName}</span>
                        </div>
                        <img src="${r.image}" onclick="downloadSingleImage('${r.image}', '${r.spaceName}')" alt="${r.spaceName}效果图">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    resultActions.style.display = 'flex';
}

// 下载单张图片
function downloadSingleImage(url, name) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${Date.now()}.jpg`;
    link.click();
}

// 下载所有图片
function downloadAllImages() {
    if (resultImages.length === 0) return;
    
    if (resultImages.length === 1) {
        // 单张图片直接下载
        downloadSingleImage(resultImages[0].image, resultImages[0].spaceName);
    } else {
        // 多张图片依次下载
        resultImages.forEach((result, index) => {
            setTimeout(() => {
                downloadSingleImage(result.image, result.spaceName);
            }, index * 500);
        });
    }
}

// 分享所有图片
async function shareAllImages() {
    if (resultImages.length === 0) return;
    
    try {
        // 分享第一张
        const result = resultImages[0];
        const response = await fetch(result.image);
        const blob = await response.blob();
        const file = new File([blob], `${result.spaceName}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: '子问设计助手效果图',
                text: `生成的空间：${resultImages.map(r => r.spaceName).join('、')}`,
                files: resultImages.map(r => {
                    return new File([r.image], `${r.spaceName}.jpg`, { type: 'image/jpeg' });
                })
            });
        } else {
            alert('分享功能暂不支持，请长按图片保存');
        }
    } catch (error) {
        alert('分享失败，请长按图片保存');
    }
}

// 历史记录
function saveToHistory(original, results) {
    let history = JSON.parse(localStorage.getItem('generateHistory') || '[]');
    
    history.unshift({
        original: original,
        results: results.map(r => ({
            spaceId: r.spaceId,
            spaceName: r.spaceName,
            spaceIcon: r.spaceIcon,
            image: r.image
        })),
        time: Date.now(),
        style: styleSelect.value,
        model: modelSelect.value
    });
    
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    try {
        localStorage.setItem('generateHistory', JSON.stringify(history));
    } catch (error) {
        console.error('保存历史记录失败:', error);
        history = history.slice(0, 4);
        localStorage.setItem('generateHistory', JSON.stringify(history));
    }
    renderHistory();
}

function initHistory() {
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('generateHistory') || '[]');
    
    if (history.length === 0) {
        historyGrid.innerHTML = '<div class="history-empty">暂无历史作品</div>';
        return;
    }
    
    historyGrid.innerHTML = history.map((item, index) => `
        <div class="history-item" onclick="loadHistoryBatch(${index})">
            <img src="${item.results[0]?.image || item.original}" alt="历史作品">
            <button class="delete-btn" onclick="event.stopPropagation(); deleteHistoryItem(${index})">×</button>
        </div>
    `).join('');
}

function loadHistoryBatch(index) {
    const history = JSON.parse(localStorage.getItem('generateHistory') || '[]');
    const item = history[index];
    if (item) {
        currentImage = item.original;
        previewImage.src = currentImage;
        previewImage.hidden = false;
        uploadPlaceholder.hidden = true;
        uploadArea.classList.add('has-image');
        
        showBatchResults(item.results);
        resultImages = item.results;
    }
}

function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem('generateHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('generateHistory', JSON.stringify(history));
    renderHistory();
}

// 更新剩余次数显示
function updateRemainingTimes() {
    const userType = getUserType();
    const packageConfig = getPackageConfig();
    const remaining = getRemainingPoints();
    const dailyStats = getDailyStats();
    
    if (userType === 'monthly') {
        usageTip.innerHTML = `⭐ 包月用户 | 快速预览:无限 | 高清:${dailyStats.hd}/${packageConfig.hdDaily}/天 | 专业:${dailyStats.pro}/${packageConfig.proDaily}/天`;
    } else if (userType === 'yearly') {
        usageTip.innerHTML = `⭐ 包年用户 | 快速预览:无限 | 高清:${dailyStats.hd}/${packageConfig.hdDaily}/天 | 专业:${dailyStats.pro}/${packageConfig.proDaily}/天`;
    } else {
        usageTip.innerHTML = `体验用户 | 剩余 <span class="highlight">${remaining}</span> 点`;
    }
}

// 加载用户信息
function loadUserInfo() {
    const user = localStorage.getItem('currentUser');
    const userInfoEl = document.getElementById('userInfo');
    
    if (user) {
        const userData = JSON.parse(user);
        userInfoEl.innerHTML = `
            <a href="center.html" class="user-menu">
                <div class="user-avatar">${userData.username.charAt(0).toUpperCase()}</div>
                <span class="user-name">${userData.username}</span>
            </a>
        `;
    } else {
        userInfoEl.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">登录</a>';
    }
}

// 暴露给全局
window.toggleSpace = toggleSpace;
window.downloadSingleImage = downloadSingleImage;
window.loadHistoryBatch = loadHistoryBatch;
window.deleteHistoryItem = deleteHistoryItem;
