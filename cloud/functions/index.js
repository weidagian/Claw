// 云函数入口
const cloud = require('tcb-js-sdk');

// 初始化云开发
const app = cloud.init({
    env: 'xgzxgt'
});

const db = app.database();

// AI 绘图 API 配置
const AI_CONFIG = {
    host: 'https://grsai.dakka.com.cn',
    apiKey: 'sk-e8f308bbe3d94ab68cdb3b81657bbddc'
};

// 飞书配置
const FEISHU_CONFIG = {
    appId: 'cli_a9341869c9b81bb3',
    appSecret: 'LeD6WslcfLjbq0mTyamL3m6mngARsFZB',
    spreadsheetToken: 'V0i4wrVrqi5icBkeImycrttynde',
    sheetIds: {
        users: 'tblyytRXHrOpbHDH',      // 用户信息表
        logs: 'tblrLkCvPxvx4WII',       // 操作日志表
        finance: 'tblJ7BVwNHg1Id6a'     // 财务台账表
    }
};

// 云函数：用户登录
exports.login = async (event, context) => {
    const { username, password } = event;
    
    try {
        // 查询飞书表格中的用户
        const usersCollection = db.collection('users');
        const result = await usersCollection.where({
            username: username,
            password: password
        }).get();
        
        if (result.data && result.data.length > 0) {
            const user = result.data[0];
            return {
                success: true,
                user: {
                    username: user.username,
                    usedTimes: user.usedTimes || 0,
                    createTime: user.createTime
                }
            };
        } else {
            return {
                success: false,
                message: '用户名或密码错误'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '登录失败：' + error.message
        };
    }
};

// 云函数：用户注册
exports.register = async (event, context) => {
    const { username, password } = event;
    
    try {
        // 检查用户是否已存在
        const usersCollection = db.collection('users');
        const exist = await usersCollection.where({
            username: username
        }).get();
        
        if (exist.data && exist.data.length > 0) {
            return {
                success: false,
                message: '用户名已存在'
            };
        }
        
        // 创建新用户
        const newUser = {
            username: username,
            password: password,
            usedTimes: 0,
            createTime: new Date().toISOString()
        };
        
        await usersCollection.add(newUser);
        
        return {
            success: true,
            message: '注册成功'
        };
    } catch (error) {
        return {
            success: false,
            message: '注册失败：' + error.message
        };
    }
};

// 云函数：检查使用次数
exports.checkUsage = async (event, context) => {
    const { username } = event;
    
    try {
        const usersCollection = db.collection('users');
        const result = await usersCollection.where({
            username: username
        }).get();
        
        if (result.data && result.data.length > 0) {
            const user = result.data[0];
            return {
                success: true,
                remaining: Math.max(0, user.freeTimes - (user.usedTimes || 0)),
                usedTimes: user.usedTimes || 0
            };
        } else {
            // 匿名用户，返回默认次数
            return {
                success: true,
                remaining: 3,
                usedTimes: 0
            };
        }
    } catch (error) {
        return {
            success: true,
            remaining: 3,
            usedTimes: 0
        };
    }
};

// 云函数：AI 绘图
exports.draw = async (event, context) => {
    const { image, prompt, model, username } = event;
    
    try {
        // 调用 nano-banana AI 绘图
        const response = await app.call({
            type: 'http',
            method: 'POST',
            url: AI_CONFIG.host + '/v1/draw/nano-banana',
            data: {
                model: model || 'nano-banana-fast',
                prompt: prompt,
                aspectRatio: 'auto',
                imageSize: '1K',
                urls: [image]
            },
            header: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AI_CONFIG.apiKey
            }
        });
        
        const result = JSON.parse(response.response);
        
        // 检查是否生成成功
        if (result.results && result.results.length > 0) {
            const imageUrl = result.results[0].url;
            
            // 记录使用次数（如果已登录）
            if (username) {
                await recordUsage(username);
            }
            
            return {
                success: true,
                imageUrl: imageUrl,
                message: '生成成功'
            };
        } else {
            return {
                success: false,
                message: result.error || '生成失败，请重试'
            };
        }
    } catch (error) {
        console.error('AI绘图失败:', error);
        return {
            success: false,
            message: '生成失败：' + error.message
        };
    }
};

// 记录使用次数
async function recordUsage(username) {
    try {
        const usersCollection = db.collection('users');
        const result = await usersCollection.where({
            username: username
        }).get();
        
        if (result.data && result.data.length > 0) {
            const user = result.data[0];
            const newUsedTimes = (user.usedTimes || 0) + 1;
            
            await usersCollection.doc(user._id).update({
                usedTimes: newUsedTimes
            });
        }
    } catch (error) {
        console.error('记录使用次数失败:', error);
    }
}
