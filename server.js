// 子问设计助手 - 本地测试服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// AI 配置
const AI_CONFIG = {
    host: 'https://grsai.dakka.com.cn',
    apiKey: 'sk-e8f308bbe3d94ab68cdb3b81657bbddc',
    // 模型配置
    models: {
        fast: ['gpt-image-1.5', 'nano-banana-fast', 'sora-image'],
        hd: ['nano-banana-pro'],
        pro: ['nano-banana-pro-cl', 'nano-banana-pro-4k-vip']
    }
};

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(STATS_FILE)) {
        fs.writeFileSync(STATS_FILE, JSON.stringify({
            totalUsers: 0,
            totalGenerations: 0,
            dailyStats: {},
            userStats: {}
        }, null, 2));
    }
    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
    }
}

initDataFiles();

// 读取用户数据
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

// 保存用户数据
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 读取统计数据
function getStats() {
    try {
        return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    } catch {
        return { totalUsers: 0, totalGenerations: 0, totalRevenue: 0, dailyStats: {}, userStats: {} };
    }
}

// 保存统计数据
function saveStats(stats) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

// 读取历史记录
function getHistory() {
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch {
        return [];
    }
}

// 保存历史记录
function saveHistory(history) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// 空间提示词模板（简化版）
const SPACE_PROMPTS = {
    living: '客厅空间效果图，沙发、电视背景墙、茶几、灯具、窗帘、装饰画，营造温馨舒适的会客空间',
    master: '主卧室效果图，床、床头柜、衣柜、灯具、窗帘、背景墙，营造温馨浪漫的睡眠空间',
    second: '次卧室/客房效果图，床、衣柜、书桌、灯具，营造舒适实用的休息空间',
    dining: '餐厅空间效果图，餐桌餐椅、餐边柜、灯具、装饰画，营造温馨的用餐氛围',
    kitchen: '厨房空间效果图，橱柜、灶台、抽油烟机、操作台，打造实用美观的烹饪空间',
    bathroom: '卫生间效果图，马桶、洗手台、淋浴/浴缸、收纳柜，打造干净整洁的洗浴空间',
    study: '书房/学习区效果图，书桌、书柜、座椅、灯具，营造安静专注的工作学习空间',
    balcony: '阳台空间效果图，休闲座椅、绿植、收纳柜，打造舒适的休闲角落',
    entrance: '玄关/门厅效果图，鞋柜、换鞋凳、装饰画、灯具，营造温馨的归家氛围',
    kids: '儿童房效果图，儿童床、书桌、衣柜、玩具收纳，打造充满童趣的成长空间'
};

// 创意程度提示词
const CREATIVITY_PROMPTS = {
    1: {
        prompt: `严格根据上传的线稿/平面图进行渲染，不得添加任何线稿中没有的家具、装饰品、植物、灯具等物品。保持原图中所有线条和结构，只进行光影和材质渲染，禁止添加任何新元素。`,
        negative: `不要添加任何新的家具、装饰品、植物、灯具、挂画、地毯等元素。禁止添加线稿中不存在的内容。保持完全一致。`
    },
    2: {
        prompt: `非常严格地根据线稿生成，可以添加最基本的必要的功能性物品（如基本款式的灯具、简单的窗帘），但必须与线稿结构完全一致。保持95%以上的线条还原度。`,
        negative: `不要添加多余的装饰品、复杂的灯具、设计感的家具。只需添加最基本的必要物品。`
    },
    3: {
        prompt: `在保持线稿主体结构的前提下，可以添加少量基础家具和必要的软装（如基本款式的沙发、茶几、床品），确保整体风格协调。保持线稿的主要轮廓。`,
        negative: `不要添加过多装饰，保持简洁。可添加基本款家具但不要复杂设计。`
    },
    4: {
        prompt: `根据线稿结构进行渲染，可以添加适度的家具和装饰，添加基本的软装搭配（如灯具、窗帘、抱枕），让画面更完整但不过度。`,
        negative: `不要添加过多装饰元素，保持线稿的主要结构。可添加基本软装但要简约。`
    },
    5: {
        prompt: `在保持线稿主要结构的基础上，进行视觉效果优化。添加适当的装饰点缀（如墙上的装饰画、桌上的摆件、适量的绿植、合适的灯具款式），提升整体视觉效果和空间感。注意不要过度添加，保持适度。这是视觉效果最好的设置。`,
        negative: `不要过度添加装饰，保持画面整洁和谐。装饰元素要适量，不要堆砌。禁止添加任何水印、logo、签名。`
    },
    6: {
        prompt: `在原线稿基础上进行创意发挥，添加更多设计感的家具和装饰元素。可以添加设计款灯具、装饰画、绿植等，让空间更加生动和富有设计感。`,
        negative: `不要添加过多元素导致画面杂乱。可以添加设计感强的家具和装饰，但要与整体风格协调。`
    },
    7: {
        prompt: `在原线稿基础上进行创意设计，添加丰富的软装搭配。可以添加设计款家具、创意灯具、装饰画、绿植等，让空间更加丰富和有个性。`,
        negative: `不要过于杂乱。可以自由添加装饰元素，但整体要保持美观协调。`
    },
    8: {
        prompt: `在保持线稿基本结构的前提下，进行较大的创意发挥。添加丰富的设计元素、创意家具、艺术装饰品等，让空间充满设计感和艺术气息。`,
        negative: `可以添加较多装饰和设计元素，画面可以丰富一些。但不要过于杂乱无章。`
    },
    9: {
        prompt: `以线稿为基础进行大胆创意，可以添加较多的设计元素和装饰。可以添加设计感强的家具、艺术装置、创意灯具等，让空间充满创意和想象力。`,
        negative: `画面可以非常丰富，允许添加较多元素。但整体要保持美观和谐。`
    },
    10: {
        prompt: `以线稿为灵感来源进行AI自由创意发挥！不受线稿严格限制，可以根据风格添加任何合适的家具、装饰品、艺术品、创意设计元素等。让AI的想象力充分展现，为设计师和客户提供创意灵感和惊喜。`,
        negative: `没有严格限制，可以自由发挥。让AI创造性地填充内容，提供创意灵感。`
    }
};

// MIME 类型
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API 路由
    if (req.url.startsWith('/api/')) {
        handleAPI(req, res);
        return;
    }
    
    // 静态文件
    let filePath = req.url.startsWith('/public/') ? req.url : '/public' + req.url;
    if (req.url === '/') filePath = '/public/index.html';
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (error) {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// 处理 API 请求
async function handleAPI(req, res) {
    const url = req.url;
    const query = url.split('?')[0];
    
    // 绘图 API
    if (query === '/api/draw' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { image, model, prompt, negative, creativity, spaceId, userId } = JSON.parse(body);
                
                const creativityLevel = parseInt(creativity) || 5;
                const creativityData = CREATIVITY_PROMPTS[creativityLevel] || CREATIVITY_PROMPTS[5];
                
                let fullPrompt = prompt;
                
                if (spaceId && SPACE_PROMPTS[spaceId]) {
                    fullPrompt += `。${SPACE_PROMPTS[spaceId]}`;
                }
                
                if (creativityData.prompt) {
                    fullPrompt += `\n\n${creativityData.prompt}`;
                }
                
                fullPrompt += `。请去除所有水印和文字，不要显示任何logo、签名。`;
                
                console.log('\n========== 收到绘图请求 ==========');
                console.log('模型:', model);
                console.log('空间:', spaceId || '未指定');
                console.log('创意程度:', creativityLevel);
                console.log('用户:', userId || 'guest');
                console.log('=====================================\n');
                
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                
                // 选择模型
                let selectedModel = model;
                if (model === 'fast' && AI_CONFIG.models.fast.length > 0) {
                    selectedModel = AI_CONFIG.models.fast[0];
                } else if (model === 'hd' && AI_CONFIG.models.hd.length > 0) {
                    selectedModel = AI_CONFIG.models.hd[0];
                } else if (model === 'pro' && AI_CONFIG.models.pro.length > 0) {
                    selectedModel = AI_CONFIG.models.pro[0];
                }
                
                const response = await fetch(`${AI_CONFIG.host}/v1/assistant/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: fullPrompt },
                                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                                ]
                            }
                        ],
                        stream: false
                    })
                });
                
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || `API 请求失败: ${response.status}`);
                }

                const data = await response.json();

                if (data.choices && data.choices[0] && data.choices[0].message) {
                    const content = data.choices[0].message.content;

                    if (typeof content === 'string') {
                        const imgMatch = content.match(/data:image\/(\w+);base64,([A-Za-z0-9+/=]+)/);
                        if (imgMatch) {
                            const imgData = `data:image/${imgMatch[1]};base64,${imgMatch[2]}`;

                            // 更新统计数据
                            updateStats(userId, model, 1);

                            // 保存历史记录
                            if (userId && userId !== 'guest') {
                                saveHistoryRecord(userId, imgData, style, quality, creativity);
                            }

                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, image: imgData }));
                            return;
                        }
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: '生成完成，但未返回图片数据' }));
                
            } catch (error) {
                console.error('绘图失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        });
        return;
    }

    // 获取历史记录
    if (query === '/api/history' && req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const username = url.searchParams.get('username');

        if (!username || username === 'guest') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, history: [] }));
            return;
        }

        const history = getHistory();
        const userHistory = history.filter(h => h.username === username).reverse();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, history: userHistory }));
        return;
    }

    
    // 用户登录
    if (query === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                const users = getUsers();
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user) {
                    // 更新最后登录
                    user.lastLogin = new Date().toISOString();
                    saveUsers(users);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        user: { 
                            username: user.username, 
                            userType: user.userType,
                            freePoints: user.freePoints,
                            bonusPoints: user.bonusPoints,
                            createTime: user.createTime
                        } 
                    }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: '用户名或密码错误' }));
                }
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        });
        return;
    }
    
    // 用户注册
    if (query === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                const users = getUsers();
                
                if (users.find(u => u.username === username)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: '用户名已存在' }));
                    return;
                }
                
                // 创建新用户（体验用户）
                const newUser = {
                    username,
                    password,
                    userType: 'experience',
                    freePoints: 10,  // 送10次
                    bonusPoints: 0,
                    createTime: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    totalUsage: 0,
                    totalSpend: 0
                };
                
                users.push(newUser);
                saveUsers(users);
                
                // 更新统计
                const stats = getStats();
                stats.totalUsers++;
                saveStats(stats);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    user: { 
                        username: newUser.username, 
                        userType: newUser.userType,
                        freePoints: newUser.freePoints
                    } 
                }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404);
    res.end('API Not Found');
}

// 更新统计数据
function updateStats(userId, model, count) {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];

    stats.totalGenerations += count;

    // 每日统计
    if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = { generations: 0, users: [] };
    }
    stats.dailyStats[today].generations += count;

    // 用户统计
    if (userId) {
        if (!stats.userStats[userId]) {
            stats.userStats[userId] = {
                totalUsage: 0,
                byModel: { fast: 0, hd: 0, pro: 0 },
                lastActive: today
            };
        }
        stats.userStats[userId].totalUsage += count;
        stats.userStats[userId].byModel[model] = (stats.userStats[userId].byModel[model] || 0) + count;
        stats.userStats[userId].lastActive = today;

        // 更新用户的使用次数
        const users = getUsers();
        const userIndex = users.findIndex(u => u.username === userId);
        if (userIndex !== -1) {
            users[userIndex].totalUsage = (users[userIndex].totalUsage || 0) + count;
            saveUsers(users);
        }
    }

    saveStats(stats);
}

// 保存历史记录
function saveHistoryRecord(username, image, style, quality, creativity) {
    const history = getHistory();

    const newRecord = {
        id: Date.now(),
        username: username,
        image: image,
        style: style,
        quality: quality,
        creativity: creativity,
        timestamp: new Date().toISOString()
    };

    history.push(newRecord);

    // 只保留最近 100 条
    if (history.length > 100) {
        const userRecords = history.filter(h => h.username !== username);
        const userLatest = history.filter(h => h.username === username).slice(-20);
        history = [...userRecords, ...userLatest];
    }

    saveHistory(history);
}

// 启动服务器
server.listen(PORT, () => {
    console.log('========================================');
    console.log('   子问设计助手 - 服务器');
    console.log('========================================');
    console.log(`本地访问: http://localhost:${PORT}`);
    console.log('========================================\n');
});
