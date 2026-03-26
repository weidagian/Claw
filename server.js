/**
 * 子问设计助手 - 主服务器
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MODELS_FILE = path.join(DATA_DIR, 'models.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

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
    if (!fs.existsSync(MODELS_FILE)) {
        fs.writeFileSync(MODELS_FILE, JSON.stringify([
            { id: 'fast', name: 'nano-banana-fast', label: '快速预览', quality: '预览', price: '0.5点/张', enabled: true, endpoint: 'https://grsai.dakka.com.cn/v1/draw/nano-banana', apiKey: 'sk-e8f308bbe3d94ab68cdb3b81657bbddc', modelId: 'nano-banana-fast' },
            { id: 'hd', name: 'nano-banana-pro', label: '高清商用', quality: '高清', price: '2点/张', enabled: true, endpoint: 'https://grsai.dakka.com.cn/v1/draw/nano-banana', apiKey: 'sk-e8f308bbe3d94ab68cdb3b81657bbddc', modelId: 'nano-banana-pro' },
            { id: 'pro', name: 'nano-banana-pro-4k-vip', label: '专业极致', quality: '4K', price: '4点/张', enabled: true, endpoint: 'https://grsai.dakka.com.cn/v1/draw/nano-banana', apiKey: 'sk-e8f308bbe3d94ab68cdb3b81657bbddc', modelId: 'nano-banana-pro-4k-vip' }
        ], null, 2));
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
            admin: { username: 'admin', password: 'ziwen2024' },
            styles: [
                { id: 'modern', name: '现代简约' },
                { id: 'nordic', name: '北欧风格' },
                { id: 'chinese', name: '新中式' },
                { id: 'luxury', name: '轻奢风格' },
                { id: 'industrial', name: '工业风' },
                { id: 'japanese', name: '日式风格' },
                { id: 'american', name: '美式风格' },
                { id: 'european', name: '欧式风格' }
            ]
        }, null, 2));
    }
}

initDataFiles();

// 数据读写函数
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getStats() {
    try {
        return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    } catch {
        return { totalUsers: 0, totalGenerations: 0, dailyStats: {}, userStats: {} };
    }
}

function saveStats(stats) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function getHistory() {
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveHistory(history) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function getModels() {
    try {
        return JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function getSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch {
        return { admin: { username: 'admin', password: 'ziwen2024' }, styles: [] };
    }
}

function getModelByQuality(quality) {
    const models = getModels();
    const qualityMap = {
        '标准': 'fast',
        '快速': 'fast',
        '高清': 'hd',
        '专业': 'pro',
        'fast': 'fast',
        'hd': 'hd',
        'pro': 'pro'
    };
    const modelId = qualityMap[quality] || 'fast';
    return models.find(m => m.id === modelId);
}

// 简单密码验证（生产环境建议用 bcrypt）
function verifyPassword(user, password) {
    return user.password === password;
}

// 认证中间件
function verifyToken(req, res, next) {
    const token = req.headers['x-auth-token'];
    const adminToken = req.headers['x-admin-token'];

    // 管理员验证
    const settings = getSettings();
    if (adminToken === 'admin_token') {
        req.isAdmin = true;
        return next();
    }

    // 普通用户验证
    if (token) {
        const users = getUsers();
        const user = users.find(u => u.id === token);
        if (user) {
            req.userId = user.id;
            req.username = user.username;
        }
    }

    req.userId = null;
    next();
}

// ==================== API 路由 ====================

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, message: '用户名和密码不能为空' });
        }

        if (username.length < 3 || password.length < 6) {
            return res.json({ success: false, message: '用户名至少3位，密码至少6位' });
        }

        const users = getUsers();

        if (users.find(u => u.username === username)) {
            return res.json({ success: false, message: '用户名已存在' });
        }

        // 创建新用户
        const newUser = {
            id: 'user_' + Date.now(),
            username,
            password,
            userType: 'experience',
            freePoints: 10,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        // 更新统计
        const stats = getStats();
        stats.totalUsers = (stats.totalUsers || 0) + 1;
        saveStats(stats);

        res.json({
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                createdAt: newUser.createdAt
            },
            token: newUser.id
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.json({ success: false, message: error.message });
    }
});

// 登录
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, message: '请输入用户名和密码' });
        }

        const users = getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.json({ success: false, message: '用户不存在' });
        }

        const valid = verifyPassword(user, password);

        if (!valid) {
            return res.json({ success: false, message: '密码错误' });
        }

        // 更新最后登录
        user.lastLogin = new Date().toISOString();
        saveUsers(users);

        // 检查是否是管理员
        const settings = getSettings();
        const isAdmin = settings.admin && settings.admin.username === username;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
                usageCount: user.usageCount || 0,
                freePoints: user.freePoints || 0,
                isAdmin
            },
            token: user.id
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.json({ success: false, message: '登录失败' });
    }
});

// 获取风格列表
app.get('/api/styles', (req, res) => {
    const settings = getSettings();
    res.json({
        success: true,
        styles: settings.styles || []
    });
});

// 获取模型配置
app.get('/api/models', (req, res) => {
    const models = getModels();
    res.json({
        success: true,
        models: models.filter(m => m.enabled)
    });
});

// AI 绘图
app.post('/api/draw', async (req, res) => {
    try {
        const { image, style, creativity, quality, userId } = req.body;

        if (!image) {
            return res.json({ success: false, message: '请上传图片' });
        }

        if (!quality) {
            quality = 'fast';
        }

        // 获取对应模型
        const model = getModelByQuality(quality);

        if (!model) {
            return res.json({ success: false, message: '当前画质不可用' });
        }

        // 构建提示词
        const creativityLevel = parseInt(creativity) || 5;
        const stylePrompt = getStylePrompt(style);
        const prompt = `${stylePrompt}, 创意程度${creativityLevel}/10, 室内装修效果图, 高质量渲染`;

        console.log('\n========== 收到绘图请求 ==========');
        console.log('模型:', model.name);
        console.log('风格:', style);
        console.log('创意程度:', creativityLevel);
        console.log('用户:', userId || 'guest');
        console.log('=====================================\n');

        // 调用 AI 接口
        const result = await callAI(model, image, prompt);

        // 保存历史记录
        if (userId) {
            const users = getUsers();
            const user = users.find(u => u.id === userId);
            
            if (user) {
                // 保存历史
                const history = getHistory();
                history.unshift({
                    id: Date.now(),
                    userId: userId,
                    username: user.username,
                    style,
                    creativity: creativityLevel,
                    quality,
                    prompt,
                    resultUrl: result.url,
                    timestamp: new Date().toISOString()
                });
                // 只保留最近 100 条
                if (history.length > 100) {
                    history.length = 100;
                }
                saveHistory(history);

                // 更新使用次数
                user.usageCount = (user.usageCount || 0) + 1;
                saveUsers(users);
            }

            // 更新统计
            const stats = getStats();
            stats.totalGenerations = (stats.totalGenerations || 0) + 1;
            const today = new Date().toISOString().split('T')[0];
            if (!stats.dailyStats) stats.dailyStats = {};
            if (!stats.dailyStats[today]) stats.dailyStats[today] = { generations: 0, users: [] };
            stats.dailyStats[today].generations = (stats.dailyStats[today].generations || 0) + 1;
            saveStats(stats);
        }

        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('绘图错误:', error);
        res.json({ success: false, message: error.message || '生成失败' });
    }
});

// 获取历史记录
app.get('/api/history', verifyToken, async (req, res) => {
    const userId = req.query.userId || req.query.username;

    if (!userId) {
        return res.json({ success: false, message: '缺少用户ID' });
    }

    const history = getHistory();
    const userHistory = history.filter(h => h.userId === userId || h.username === userId).reverse();

    res.json({
        success: true,
        history: userHistory
    });
});

// ==================== 管理员 API ====================

// 管理员验证
function requireAdmin(req, res, next) {
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== 'admin_token') {
        return res.json({ success: false, message: '未授权' });
    }

    req.isAdmin = true;
    next();
}

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
    try {
        const { password } = req.body;
        const settings = getSettings();

        if (password === settings.admin.password) {
            res.json({ success: true, token: 'admin_token' });
        } else {
            res.json({ success: false, message: '密码错误' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// 获取用户列表
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = getUsers();
        const stats = getStats();
        
        const list = users.map(u => ({
            id: u.id,
            username: u.username,
            userType: u.userType,
            freePoints: u.freePoints || 0,
            usageCount: u.usageCount || 0,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
        }));
        
        res.json({ success: true, users: list, stats: stats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// 获取统计数据
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = getStats();
        res.json({ success: true, stats: stats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// 删除用户
app.delete('/api/admin/user/:username', requireAdmin, async (req, res) => {
    try {
        const { username } = req.params;
        const users = getUsers();
        const index = users.findIndex(u => u.username === username);

        if (index === -1) {
            return res.json({ success: false, message: '用户不存在' });
        }

        users.splice(index, 1);
        saveUsers(users);

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// 更新模型状态
app.put('/api/admin/models/:modelId', requireAdmin, async (req, res) => {
    try {
        const { modelId } = req.params;
        const { enabled } = req.body;

        const models = getModels();
        const index = models.findIndex(m => m.id === modelId);

        if (index === -1) {
            return res.json({ success: false, message: '模型不存在' });
        }

        models[index].enabled = enabled;
        fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2));

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// ==================== 辅助函数 ====================

function getStylePrompt(styleId) {
    const styles = {
        modern: '现代简约风格，简洁线条，低饱和度配色',
        nordic: '北欧风格，自然光线，木质元素，清新淡雅',
        chinese: '新中式风格，传统元素与现代设计结合',
        luxury: '轻奢风格，金属质感，高端材质',
        industrial: '工业风格，水泥砖墙，粗犷质感',
        japanese: '日式风格，榻榻米，原木家具',
        american: '美式风格，舒适宽敞，经典元素',
        european: '欧式风格，华丽装饰，精致线条'
    };
    return styles[styleId] || '现代简约风格';
}

async function callAI(model, imageBase64, prompt) {
    const { endpoint, apiKey, modelId } = model;

    try {
        // 先创建任务
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelId,
                urls: [imageBase64], // 支持直接传入 base64 图片
                prompt: prompt,
                aspectRatio: 'auto',
                imageSize: '1K',
                webHook: '-1', // 立即返回 id，使用轮询方式获取结果
                shutProgress: true
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`AI调用失败: ${response.status} - ${err}`);
        }

        const data = await response.json();
        console.log('AI 响应:', data);

        // 检查是否成功返回 id
        if (data.code === 0 && data.data && data.data.id) {
            const taskId = data.data.id;
            console.log(`任务创建成功, ID: ${taskId}`);

            // 轮询获取结果
            const result = await pollResult(endpoint, apiKey, taskId);
            return result;
        }

        // 如果直接返回了图片
        if (data.url) {
            return { url: data.url, model: modelId };
        }

        throw new Error('AI 返回格式错误');
    } catch (error) {
        console.error('AI调用错误:', error);
        throw new Error('AI生成失败，请稍后重试');
    }
}

// 轮询获取结果
async function pollResult(endpoint, apiKey, taskId, maxAttempts = 60) {
    const statusUrl = endpoint.replace('/v1/draw/', '/v1/draw/status/');

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒轮询一次

        try {
            const response = await fetch(`${statusUrl}${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            const data = await response.json();
            console.log(`轮询 ${i + 1}:`, data);

            if (data.code === 0 && data.data) {
                if (data.data.status === 'success' && data.data.url) {
                    return { url: data.data.url, model: data.data.model || 'nano-banana' };
                } else if (data.data.status === 'failed') {
                    throw new Error(data.data.error || '生成失败');
                }
                // status 为 processing 或 pending 时继续轮询
            }
        } catch (error) {
            console.error('轮询错误:', error);
        }
    }

    throw new Error('生成超时，请稍后重试');
}

// 404 处理
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// 启动服务器
app.listen(PORT, () => {
    console.log('========================================');
    console.log('   子问设计助手');
    console.log('========================================');
    console.log(`端口: ${PORT}`);
    console.log(`访问: http://localhost:${PORT}`);
    console.log('========================================\n');
});

module.exports = app;
