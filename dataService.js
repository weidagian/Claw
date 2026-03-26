/**
 * 数据服务层 - 封装所有数据操作
 * 未来可轻松迁移到 MySQL
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_DIR = path.join(DATA_DIR, 'history');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const MODELS_FILE = path.join(DATA_DIR, 'models.json');

// 确保目录存在
function initDataDirs() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(HISTORY_DIR)) {
        fs.mkdirSync(HISTORY_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
}

initDataDirs();

// ==================== 用户服务 ====================

// 获取所有用户
async function getUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// 根据用户名查找用户
async function findUserByUsername(username) {
    const users = await getUsers();
    return users.find(u => u.username === username);
}

// 创建用户
async function createUser(username, password) {
    const users = await getUsers();

    if (users.find(u => u.username === username)) {
        throw new Error('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now().toString(),
        username,
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        usageCount: 0,
        isAdmin: false
    };

    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return newUser;
}

// 验证密码
async function verifyPassword(user, password) {
    return bcrypt.compare(password, user.passwordHash);
}

// 更新用户最后登录时间
async function updateLastLogin(userId) {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].lastLogin = new Date().toISOString();
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
}

// 增加用户使用次数
async function incrementUsage(userId) {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].usageCount = (users[index].usageCount || 0) + 1;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
}

// ==================== 历史记录服务 ====================

// 保存生成记录
async function saveHistory(userId, record) {
    const userHistoryFile = path.join(HISTORY_DIR, `${userId}.json`);
    let history = [];

    if (fs.existsSync(userHistoryFile)) {
        history = JSON.parse(fs.readFileSync(userHistoryFile, 'utf8'));
    }

    history.unshift({
        id: Date.now().toString(),
        ...record,
        createdAt: new Date().toISOString()
    });

    // 只保留最近100条
    if (history.length > 100) {
        history = history.slice(0, 100);
    }

    fs.writeFileSync(userHistoryFile, JSON.stringify(history, null, 2));
}

// 获取用户历史记录
async function getHistory(userId) {
    const userHistoryFile = path.join(HISTORY_DIR, `${userId}.json`);

    if (!fs.existsSync(userHistoryFile)) {
        return [];
    }

    return JSON.parse(fs.readFileSync(userHistoryFile, 'utf8'));
}

// ==================== 配置服务 ====================

// 获取设置
function getSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch {
        return {};
    }
}

// 获取模型配置
function getModels() {
    try {
        return JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

// 保存模型配置
function saveModels(models) {
    fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2));
}

// 根据画质获取可用模型
function getModelByQuality(quality) {
    const models = getModels();
    return models.find(m => m.supportsQuality.includes(quality) && m.enabled);
}

module.exports = {
    getUsers,
    findUserByUsername,
    createUser,
    verifyPassword,
    updateLastLogin,
    incrementUsage,
    saveHistory,
    getHistory,
    getSettings,
    getModels,
    saveModels,
    getModelByQuality
};
