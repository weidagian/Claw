// 全局变量
let currentImage = null;
let resultImages = [];  // 支持多张图片
let selectedSpaces = [];  // 已选空间
let sliderPosition = 50;
let isGenerating = false;
let currentMode = 'sketch';  // 当前模式: 'sketch' (线稿) 或 'floorplan' (平面图)

// DOM 元素
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const previewImage = document.getElementById('previewImage');
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
const remainingTimesEl = document.getElementById('remainingTimes');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initStyles();
    initSpaces();
    // 不再调用 initDefaultSpaces，因为线稿模式不需要默认空间
    initCreativitySlider();
    initUpload();
    initGenerate();
    initHistory();
    loadUserInfo();
    updateRemainingTimes();
});

// 初始化标签页切换
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const floorplanNotice = document.getElementById('floorplanNotice');
    const spaceSection = document.getElementById('spaceSection');
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadHint = document.getElementById('uploadHint');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有active状态
            tabBtns.forEach(b => b.classList.remove('active'));
            // 添加当前active状态
            btn.classList.add('active');

            // 切换模式
            currentMode = btn.dataset.tab;

            // 根据模式显示不同内容
            if (currentMode === 'sketch') {
                // 线稿模式：隐藏空间选择，隐藏提示
                floorplanNotice.classList.add('hidden');
                spaceSection.classList.add('hidden');
                uploadTitle.textContent = '上传线稿图';
                uploadHint.textContent = '点击上传手绘线稿';
                // 线稿模式清空空间选择
                selectedSpaces = [];
            } else {
                // 平面图模式：显示空间选择，显示提示
                floorplanNotice.classList.remove('hidden');
                spaceSection.classList.remove('hidden');
                uploadTitle.textContent = '上传平面图';
                uploadHint.textContent = '点击上传户型平面图';
                // 平面图模式默认只选择客厅
                selectedSpaces = ['living'];
                document.querySelectorAll('.space-item').forEach(item => {
                    if (selectedSpaces.includes(item.dataset.space)) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                });
            }
            updateSpaceCount();
            checkCanGenerate();
        });
    });
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
    
    updateSpaceCount();
}

// 切换空间选择
function toggleSpace(spaceId) {
    const index = selectedSpaces.indexOf(spaceId);
    if (index > -1) {
        selectedSpaces.splice(index, 1);
    } else {
        selectedSpaces.push(spaceId);
    }

    // 更新UI
    document.querySelectorAll('.space-item').forEach(item => {
        if (selectedSpaces.includes(item.dataset.space)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    updateSpaceCount();
}

// 默认选择两室一厅（线稿模式）- 已废弃
// 线稿模式不再需要默认空间选择
function initDefaultSpaces() {
    // 空函数，保留兼容性
}

// 更新空间数量和预估费用
function updateSpaceCount() {
    const count = selectedSpaces.length;
    selectedCount.textContent = count;
    const userType = getUserType();
    const packageConfig = getPackageConfig();
    
    if (count > 0) {
        const cost = getCostPoints(modelSelect.value, count);
        
        // 根据用户类型显示不同信息
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
        
        generateBtn.disabled = !currentImage;
    } else {
        costEstimate.textContent = '';
        generateBtn.disabled = true;
    }
}

// 初始化创意程度滑块
function initCreativitySlider() {
    creativityRange.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        creativityValue.textContent = value;
        creativityDesc.textContent = getCreativityDescription(value);
        updateSpaceCount();  // 更新预估费用
    });
    
    modelSelect.addEventListener('change', () => {
        updateSpaceCount();  // 更新预估费用
    });
    
    // 初始描述
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
        
        // 检查是否可以生成
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
            urls: [imageData], // 支持直接传入 base64 图片
            prompt: promptData.prompt,
            aspectRatio: 'auto',
            imageSize: '1K',
            webHook: '-1', // 立即返回 id，使用轮询方式获取结果
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

            // 根据文档：响应格式为 { code: 0, data: {...}, msg: "success" }
            // 状态字段在 data.status 里
            if (data.code === 0 && data.data) {
                const taskData = data.data;

                // 检查任务状态
                if (taskData.status === 'succeeded' && taskData.results && taskData.results.length > 0) {
                    console.log(`✅ 任务成功完成! 图片URL:`, taskData.results[0].url);
                    return {
                        success: true,
                        image: taskData.results[0].url // 返回图片 URL
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

            // 如果还在进行中，继续轮询
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
    generateBtn.querySelector('.btn-text').textContent = '生成效果图';

    const progressBar = generateBtn.querySelector('.progress-bar');
    const progressText = generateBtn.querySelector('.progress-text');
    progressBar.hidden = true;
    progressText.hidden = true;
}

// 显示批量结果
function showBatchResults(results) {
    if (results.length === 0) {
        compareContainer.innerHTML = `
            <div class="compare-placeholder">
                <p>生成失败，请重试</p>
            </div>
        `;
        resultActions.hidden = true;
        return;
    }
    
    compareContainer.innerHTML = `
        <div class="results-grid">
            ${results.map((r, idx) => `
                <div class="result-card">
                    <div class="space-tag">
                        <span>${r.spaceIcon}</span>
                        <span>${r.spaceName}</span>
                    </div>
                    <img src="${r.image}" class="result-image" 
                         onclick="showSingleCompare(${idx})" 
                         alt="${r.spaceName}效果图">
                </div>
            `).join('')}
        </div>
    `;
    
    resultActions.hidden = false;
}

// 显示单张对比
function showSingleCompare(index) {
    const result = resultImages[index];
    if (!result) return;
    
    compareContainer.innerHTML = `
        <div class="compare-wrapper">
            <img src="${result.image}" class="compare-image compare-result" id="resultImg">
            <img src="${currentImage}" class="compare-image compare-original" id="originalImg">
            <div class="compare-slider" id="compareSlider" style="left: 50%">
                <span class="compare-label left">原图</span>
                <span class="compare-label right">${result.spaceName}</span>
            </div>
        </div>
    `;
    
    // 重新绑定滑块事件
    initCompareSlider();
    
    // 添加返回按钮
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← 返回列表';
    backBtn.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 20;';
    backBtn.onclick = () => showBatchResults(resultImages);
    compareContainer.appendChild(backBtn);
}

// 初始化对比滑块
function initCompareSlider() {
    const slider = document.getElementById('compareSlider');
    const container = document.getElementById('compareContainer');
    const originalImg = document.getElementById('originalImg');
    
    if (!slider || !container) return;
    
    const updateSlider = (clientX) => {
        const rect = container.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = (x / rect.width) * 100;
        
        slider.style.left = `${percent}%`;
        
        if (originalImg) {
            originalImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        }
    };
    
    // 鼠标事件
    container.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('result-image')) return;
        const moveHandler = (e) => updateSlider(e.clientX);
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
        updateSlider(e.clientX);
    });
    
    // 触摸事件
    container.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('result-image')) return;
        const touch = e.touches[0];
        const moveHandler = (e) => {
            const t = e.touches[0];
            updateSlider(t.clientX);
        };
        const upHandler = () => {
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('touchend', upHandler);
        };
        document.addEventListener('touchmove', moveHandler);
        document.addEventListener('touchend', upHandler);
        updateSlider(touch.clientX);
    });
}

// 下载所有图片
function downloadAllImages() {
    if (resultImages.length === 0) return;
    
    resultImages.forEach((result, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = result.image;
            link.download = `${result.spaceName}_${Date.now()}.jpg`;
            link.click();
        }, index * 500);  // 间隔下载
    });
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
                    const f = new File([r.image], `${r.spaceName}.jpg`, { type: 'image/jpeg' });
                    return f;
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
        original: original, // 保留原图 base64
        results: results.map(r => ({
            spaceId: r.spaceId,
            spaceName: r.spaceName,
            spaceIcon: r.spaceIcon,
            image: r.image // 保留结果图 URL 或 base64
        })),
        time: Date.now(),
        style: styleSelect.value,
        model: modelSelect.value
    });

    // 最多保留 5 条（减少数量以避免超出配额）
    if (history.length > 5) {
        history = history.slice(0, 5);
    }

    try {
        localStorage.setItem('generateHistory', JSON.stringify(history));
    } catch (error) {
        console.error('保存历史记录失败:', error);
        // 如果保存失败，删除最旧的一条重试
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
    
    // 显示每个历史记录的第一张图作为缩略
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
        
        // 显示结果
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
    
    remainingTimesEl.textContent = remaining;
    
    const timesTip = document.getElementById('timesTip');
    if (userType === 'monthly') {
        timesTip.innerHTML = `⭐ 包月用户 | 快速预览:无限 | 高清:${dailyStats.hd}/${packageConfig.hdDaily}/天 | 专业:${dailyStats.pro}/${packageConfig.proDaily}/天`;
    } else if (userType === 'yearly') {
        timesTip.innerHTML = `⭐ 包年用户 | 快速预览:无限 | 高清:${dailyStats.hd}/${packageConfig.hdDaily}/天 | 专业:${dailyStats.pro}/${packageConfig.proDaily}/天`;
    } else {
        timesTip.innerHTML = `体验用户 | 剩余 <span class="highlight">${remaining}</span> 点`;
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

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// 暴露给全局
window.toggleSpace = toggleSpace;
window.showSingleCompare = showSingleCompare;
window.loadHistoryBatch = loadHistoryBatch;
window.deleteHistoryItem = deleteHistoryItem;
window.logout = logout;
