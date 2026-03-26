/**
 * 子问设计助手 V2 - 主服务器
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dataService = require('./dataService');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 日志目录
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// 错误日志
function logError(message, error) {
    const logFile = path.join(LOGS_DIR, 'error.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}: ${error.stack || error}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.error(logMessage);
}

// ==================== 认证中间件 ====================

// 简单token验证（生产环境建议用JWT）
function verifyToken(req, res, next) {
    const token = req.headers['x-auth-token'];
    const adminToken = req.headers['x-admin-token'];

    // 管理员验证
    if (adminToken === 'admin_token') {
        req.isAdmin = true;
        return next();
    }

    // 普通用户验证
    if (token) {
        req.userId = token;
        return next();
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

        const user = await dataService.createUser(username, password);

        // 注册成功后自动登录
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt
            },
            token: user.id
        });
    } catch (error) {
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

        const user = await dataService.findUserByUsername(username);

        if (!user) {
            return res.json({ success: false, message: '用户不存在' });
        }

        const valid = await dataService.verifyPassword(user, password);

        if (!valid) {
            return res.json({ success: false, message: '密码错误' });
        }

        await dataService.updateLastLogin(user.id);

        // 检查是否是管理员
        const settings = dataService.getSettings();
        const isAdmin = settings.admin && settings.admin.username === username;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
                usageCount: user.usageCount || 0,
                isAdmin
            },
            token: user.id
        });
    } catch (error) {
        logError('登录错误', error);
        res.json({ success: false, message: '登录失败' });
    }
});

// 获取风格列表
app.get('/api/styles', (req, res) => {
    const settings = dataService.getSettings();
    res.json({
        success: true,
        styles: settings.styles || []
    });
});

// 获取模型配置
app.get('/api/models', (req, res) => {
    const models = dataService.getModels();
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
            quality = '标准';
        }

        // 获取对应模型
        const model = dataService.getModelByQuality(quality);

        if (!model) {
            return res.json({ success: false, message: '当前画质不可用' });
        }

        // 构建提示词
        const creativityLevel = parseInt(creativity) || 5;
        const stylePrompt = getStylePrompt(style);
        const prompt = `${stylePrompt}, 创意程度${creativityLevel}/10, 室内装修效果图, 高质量渲染`;

        // 调用 AI 接口
        const result = await callAI(model, image, prompt);

        // 保存历史记录
        if (userId) {
            await dataService.saveHistory(userId, {
                style,
                creativity: creativityLevel,
                quality,
                prompt,
                resultUrl: result.url
            });

            await dataService.incrementUsage(userId);
        }

        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        logError('绘图错误', error);
        res.json({ success: false, message: error.message || '生成失败' });
    }
});

// 获取历史记录
app.get('/api/history', verifyToken, async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.json({ success: false, message: '缺少用户ID' });
    }

    const history = await dataService.getHistory(userId);
    res.json({
        success: true,
        history
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

// 获取用户列表
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await dataService.getUsers();
        const list = users.map(u => ({
            id: u.id,
            username: u.username,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin,
            usageCount: u.usageCount || 0
        }));
        res.json({ success: true, users: list });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// 更新模型状态
app.put('/api/admin/models/:modelId', requireAdmin, async (req, res) => {
    try {
        const { modelId } = req.params;
        const { enabled } = req.body;

        const models = dataService.getModels();
        const index = models.findIndex(m => m.id === modelId);

        if (index === -1) {
            return res.json({ success: false, message: '模型不存在' });
        }

        models[index].enabled = enabled;
        dataService.saveModels(models);

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// ==================== 多智能体接口（Mock）====================

app.post('/api/ai/analyze', async (req, res) => {
    const { type } = req.body;

    // Mock 数据
    const suggestions = {
        ux: [
            '建议将生成按钮放在更显眼位置',
            '创意程度滑块可以添加标签说明',
            '增加图片预览放大功能'
        ],
        design: [
            '推荐使用暖色调提升温馨感',
            '建议增加不同风格预览对比'
        ],
        performance: [
            '考虑添加图片压缩减少加载时间',
            '可以增加缓存机制提升速度'
        ]
    };

    res.json({
        success: true,
        suggestions: suggestions[type] || suggestions.ux
    });
});

// ==================== 辅助函数 ====================

function getStylePrompt(styleId) {
    const styles = {
        modern: '现代简约风格，简洁线条，低饱和度配色',
        nordic: '北欧风格，自然光线，木质元素，清新淡雅',
        chinese: '新中式风格，传统元素与现代设计结合',
        luxury: '轻奢风格，金属质感，高端材质',
        industrial: '工业风格，水泥砖墙，粗犷质感',
        minimalist: '极简主义，大量留白，功能至上'
    };
    return styles[styleId] || '现代简约风格';
}

async function callAI(model, imageBase64, prompt) {
    const { endpoint, apiKey, modelId } = model;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelId,
                image: imageBase64,
                prompt: prompt,
                quality: 'hd'
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`AI调用失败: ${response.status} - ${err}`);
        }

        const data = await response.json();

        // 解析返回数据（根据实际API调整）
        return {
            url: data.url || data.data?.[0]?.url || '',
            model: modelId
        };
    } catch (error) {
        logError('AI调用错误', error);
        throw new Error('AI生成失败，请稍后重试');
    }
}

// 404 处理
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// 启动服务器
app.listen(PORT, () => {
    console.log('========================================');
    console.log('   子问设计助手 V2');
    console.log('========================================');
    console.log(`端口: ${PORT}`);
    console.log(`访问: http://localhost:${PORT}`);
    console.log('========================================\n');
});

module.exports = app;
