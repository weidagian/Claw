// 子问设计助手 - 应用配置
const CONFIG = {
    // AI 绘图 API
    AI_API_HOST: 'https://grsai.dakka.com.cn',
    AI_API_KEY: 'sk-e8f308bbe3d94ab68cdb3b81657bbddc',
    
    // 模型配置（按成本从低到高排序）
    MODELS: {
        // 快速预览 - 最便宜
        fast: {
            name: 'nano-banana-fast',
            altNames: ['nano-banana-fast', 'gpt-image-1.5'],
            label: '快速预览',
            quality: '预览',
            price: '0.5点/张',
            cost: 0.15,  // 估算成本（元）
            desc: '生成快速，适合快速看效果'
        },
        // 高清商用 - 中等成本
        hd: {
            name: 'nano-banana-pro',
            altNames: ['nano-banana-pro'],
            label: '高清商用',
            quality: '高清',
            price: '2点/张',
            cost: 0.4,
            desc: '清晰度高，商业可用'
        },
        // 专业极致 - 高成本
        pro: {
            name: 'nano-banana-pro-4k-vip',
            altNames: ['nano-banana-pro-cl', 'nano-banana-pro-4k-vip'],
            label: '专业极致',
            quality: '4K',
            price: '4点/张',
            cost: 1.0,
            desc: '最高画质，专业设计'
        }
    },
    
    // 套餐配置
    PACKAGES: {
        // 体验用户
        experience: {
            name: '体验用户',
            fastFree: 10,      // 送10次快速预览
            hdDaily: 0,        // 每天无高清次数
            proDaily: 0,       // 每天无专业次数
            price: 0
        },
        // 包月用户
        monthly: {
            name: '包月用户',
            fastFree: '无限',
            hdDaily: 10,       // 每天10次高清
            proDaily: 3,       // 每天3次专业
            price: 59,
            desc: '59元/月'
        },
        // 包年用户
        yearly: {
            name: '包年用户',
            fastFree: '无限',
            hdDaily: 20,       // 每天20次高清
            proDaily: 5,       // 每天5次专业
            price: 499,
            desc: '499元/年'
        }
    },
    
    // 扣费规则（点数）
    PRICING: {
        // 体验用户
        experience: {
            fast: 0.5,      // 0.5点/张
            hd: 2,          // 2点/张
            pro: 4          // 4点/张
        },
        // 包月用户（按天限制）
        monthly: {
            fast: 0,        // 免费无限
            hd: 1,          // 1点/张（象征性收费）
            pro: 2          // 2点/张
        },
        // 包年用户
        yearly: {
            fast: 0,        // 免费无限
            hd: 1,          // 1点/张
            pro: 1          // 1点/张
        }
    },
    
    // 防刷配置
    ANTI_BRUSH: {
        maxFastPerMinute: 10,      // 每分钟最多10次快速预览
        maxFastPerDay: 100,        // 每天最多100次
        maxHdPerDay: 50,           // 每天最多50次高清
        maxProPerDay: 20,          // 每天最多20次专业
        warnThreshold: 0.8,        // 警告阈值（80%）
        blockThreshold: 1.0         // 封号阈值（100%）
    },
    
    // 空间类型定义（用于多图生成）
    SPACES: [
        { id: 'living', name: '客厅', icon: '🛋️', desc: '客厅/起居室' },
        { id: 'master', name: '主卧', icon: '🛏️', desc: '主卧室' },
        { id: 'second', name: '次卧', icon: '🛏️', desc: '次卧室/客房' },
        { id: 'dining', name: '餐厅', icon: '🍽️', desc: '餐厅/用餐区' },
        { id: 'kitchen', name: '厨房', icon: '🍳', desc: '厨房' },
        { id: 'bathroom', name: '卫生间', icon: '🚿', desc: '卫生间/浴室' },
        { id: 'study', name: '书房', icon: '📚', desc: '书房/学习区' },
        { id: 'balcony', name: '阳台', icon: '🌿', desc: '阳台/露台' },
        { id: 'entrance', name: '玄关', icon: '🚪', desc: '玄关/门厅' },
        { id: 'kids', name: '儿童房', icon: '🧸', desc: '儿童房' }
    ],
    
    // 预设空间组合（快速选择）
    SPACE_PRESETS: [
        { 
            name: '一室一厅', 
            spaces: ['living', 'master'],
            desc: '客厅 + 卧室' 
        },
        { 
            name: '两室一厅', 
            spaces: ['living', 'master', 'second'],
            desc: '客厅 + 主卧 + 次卧' 
        },
        { 
            name: '三室一厅', 
            spaces: ['living', 'master', 'second', 'dining'],
            desc: '客厅 + 主卧 + 次卧 + 餐厅'
        },
        { 
            name: '三室两厅', 
            spaces: ['living', 'master', 'second', 'dining', 'kitchen'],
            desc: '客厅 + 主卧 + 次卧 + 餐厅 + 厨房'
        },
        { 
            name: '四室两厅', 
            spaces: ['living', 'master', 'second', 'dining', 'kitchen', 'study'],
            desc: '客厅 + 主卧 + 次卧 + 餐厅 + 厨房 + 书房'
        }
    ],
    
    // 默认选中（效果最佳配置）
    DEFAULT_SPACE_PRESET: '两室一厅',
    
    // 空间提示词模板
    SPACE_PROMPTS: {
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
    },
    
    // 风格列表
    STYLES: [
        { name: '现代简约', desc: '简洁大方' },
        { name: '轻奢风格', desc: '精致时尚' },
        { name: '北欧风格', desc: '自然舒适' },
        { name: '中式古典', desc: '传统韵味' },
        { name: '欧式豪华', desc: '奢华典雅' },
        { name: '日式清新', desc: '清爽干净' },
        { name: '美式休闲', desc: '温馨大气' },
        { name: '极简主义', desc: '简单纯粹' },
        { name: '工业风格', desc: '粗犷个性' },
        { name: '法式浪漫', desc: '优雅精致' }
    ],
    
    // 风格使用频率
    styleUsageCount: {},
    
    // 创意程度提示词
    CREATIVITY_PROMPTS: {
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
    },
    
    // 免费次数（体验用户）
    FREE_TIMES: 10,
    
    // 客服微信
    WECHAT: '请添加客服微信获取报价'
};

// 获取用户类型
function getUserType() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.userType === 'monthly') return 'monthly';
    if (user.userType === 'yearly') return 'yearly';
    return 'experience';
}

// 获取套餐配置
function getPackageConfig() {
    const userType = getUserType();
    return CONFIG.PACKAGES[userType] || CONFIG.PACKAGES.experience;
}

// 初始化风格使用频率
function initStyleUsage() {
    const stored = localStorage.getItem('styleUsageCount');
    if (stored) {
        CONFIG.styleUsageCount = JSON.parse(stored);
    }
    
    if (Object.keys(CONFIG.styleUsageCount).length === 0) {
        CONFIG.STYLES.forEach((style, index) => {
            CONFIG.styleUsageCount[style.name] = 100 - index;
        });
    }
}

// 获取排序后的风格列表
function getSortedStyles() {
    initStyleUsage();
    return [...CONFIG.STYLES].sort((a, b) => {
        const countA = CONFIG.styleUsageCount[a.name] || 0;
        const countB = CONFIG.styleUsageCount[b.name] || 0;
        return countB - countA;
    });
}

// 记录风格使用
function recordStyleUsage(styleName) {
    initStyleUsage();
    CONFIG.styleUsageCount[styleName] = (CONFIG.styleUsageCount[styleName] || 0) + 1;
    localStorage.setItem('styleUsageCount', JSON.stringify(CONFIG.styleUsageCount));
}

// 获取创意程度提示词
function getCreativityPrompt(level) {
    const creativity = CONFIG.CREATIVITY_PROMPTS[level] || CONFIG.CREATIVITY_PROMPTS[5];
    return {
        prompt: creativity.prompt,
        negative: creativity.negative
    };
}

// 构建完整提示词
function buildPrompt(style, creativityLevel, extraPrompt, spaceId = null, mode = 'sketch') {
    const creativity = getCreativityPrompt(creativityLevel);

    let fullPrompt = '';

    // 根据模式选择不同的提示词
    if (mode === 'sketch') {
        // 线稿模式
        fullPrompt = `${style.name}风格室内设计。`;

        if (spaceId && CONFIG.SPACE_PROMPTS[spaceId]) {
            fullPrompt += CONFIG.SPACE_PROMPTS[spaceId] + '。';
        }

        fullPrompt += creativity.prompt;
    } else {
        // 平面图模式
        fullPrompt = `${style.name}风格室内设计。根据上传的平面图生成`;

        if (spaceId && CONFIG.SPACE_PROMPTS[spaceId]) {
            fullPrompt += CONFIG.SPACE_PROMPTS[spaceId] + '。';
        } else {
            fullPrompt += '空间效果图。';
        }

        if (creativityLevel <= 5) {
            fullPrompt += `严格遵循平面图的布局和空间比例，保留墙体的位置和结构，门窗位置准确。`;
        } else {
            fullPrompt += `参考平面图的布局进行合理设计，可以适当调整空间比例以获得更好的视觉效果。`;
        }
    }

    if (extraPrompt && extraPrompt.trim()) {
        fullPrompt += `。另外：${extraPrompt}`;
    }

    fullPrompt += `。请去除所有水印和文字，不要显示任何logo、签名。`;

    return {
        prompt: fullPrompt,
        negative: creativity.negative
    };
}

// 生成创意程度描述
function getCreativityDescription(level) {
    if (level <= 2) return '极度严格（完全按草图）';
    if (level <= 4) return '严格（保持结构）';
    if (level <= 6) return '适中（视觉优化）';
    if (level <= 8) return '创意（自由发挥）';
    return 'AI自由创意';
}

// 获取扣费点数
function getCostPoints(model, spaceCount) {
    const userType = getUserType();
    const pricing = CONFIG.PRICING[userType] || CONFIG.PRICING.experience;
    const cost = pricing[model] || 0.5;
    return cost * spaceCount;
}

// 检查并扣除次数（返回是否成功）
function checkAndDeduct(model, spaceCount) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userType = getUserType();
    const packageConfig = getPackageConfig();
    
    // 未登录 = 体验用户
    if (!user.username) {
        let freeTimes = parseInt(localStorage.getItem('freeTimes') || CONFIG.FREE_TIMES);
        const cost = CONFIG.PRICING.experience[model] * spaceCount;
        
        if (freeTimes < cost) {
            return { success: false, message: `需要 ${cost} 点，您剩余 ${freeTimes} 点，请先登录`, needLogin: true };
        }
        localStorage.setItem('freeTimes', Math.max(0, freeTimes - cost));
        return { success: true, cost, points: cost };
    }
    
    // 包月/包年用户 - 检查每日限制
    if (userType === 'monthly' || userType === 'yearly') {
        const today = new Date().toDateString();
        const dailyStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
        
        if (dailyStats.date !== today) {
            // 新的一天，重置计数
            localStorage.setItem('dailyStats', JSON.stringify({
                date: today,
                hdCount: 0,
                proCount: 0,
                fastCount: 0
            }));
        }
        
        const stats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
        
        // 检查每日限制
        if (model === 'hd') {
            const limit = packageConfig.hdDaily;
            if (limit > 0 && stats.hdCount >= limit) {
                return { success: false, message: `高清商用每日限${limit}次，明日再来`, upgrade: 'yearly' };
            }
            stats.hdCount = (stats.hdCount || 0) + spaceCount;
        } else if (model === 'pro') {
            const limit = packageConfig.proDaily;
            if (limit > 0 && stats.proCount >= limit) {
                return { success: false, message: `专业极致每日限${limit}次，明日再来`, upgrade: 'yearly' };
            }
            stats.proCount = (stats.proCount || 0) + spaceCount;
        } else {
            // 快速预览不限制
            stats.fastCount = (stats.fastCount || 0) + spaceCount;
        }
        
        localStorage.setItem('dailyStats', JSON.stringify(stats));
        
        // 象征性扣点
        const cost = (CONFIG.PRICING[userType][model] || 0) * spaceCount;
        if (cost > 0) {
            user.bonusTimes = (user.bonusTimes || 0) - cost;
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        return { success: true, cost, points: cost };
    }
    
    // 体验用户 - 检查点数
    const cost = CONFIG.PRICING.experience[model] * spaceCount;
    const totalPoints = (user.freePoints || 0) + (user.bonusPoints || 0);
    
    if (totalPoints < cost) {
        return { success: false, message: `需要 ${cost} 点，您剩余 ${totalPoints} 点，请联系客服充值`, upgrade: 'monthly' };
    }
    
    // 扣除点数
    if (user.freePoints >= cost) {
        user.freePoints -= cost;
    } else {
        let remaining = cost - user.freePoints;
        user.freePoints = 0;
        user.bonusPoints = (user.bonusPoints || 0) - remaining;
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    return { success: true, cost, points: cost };
}

// 获取用户剩余点数
function getRemainingPoints() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!user.username) {
        return parseInt(localStorage.getItem('freeTimes') || CONFIG.FREE_TIMES);
    }
    
    return (user.freePoints || 0) + (user.bonusPoints || 0);
}

// 获取用户每日使用统计
function getDailyStats() {
    const userType = getUserType();
    const packageConfig = getPackageConfig();
    const stats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
    const today = new Date().toDateString();
    
    // 如果不是今天，返回空
    if (stats.date !== today) {
        return { hd: 0, pro: 0, fast: 0, hdLimit: packageConfig.hdDaily, proLimit: packageConfig.proDaily };
    }
    
    return {
        hd: stats.hdCount || 0,
        pro: stats.proCount || 0,
        fast: stats.fastCount || 0,
        hdLimit: packageConfig.hdDaily,
        proLimit: packageConfig.proDaily
    };
}

// 防刷检查
function checkAntiBrush(model) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) return { passed: true };
    
    const settings = CONFIG.ANTI_BRUSH;
    const now = Date.now();
    const today = new Date().toDateString();
    
    // 获取使用记录
    const usageLogs = JSON.parse(localStorage.getItem('usageLogs') || '[]');
    
    // 统计最近1分钟
    const lastMinute = usageLogs.filter(l => now - l.time < 60000);
    if (lastMinute.length >= settings.maxFastPerMinute) {
        return { passed: false, reason: '操作过于频繁，请稍后再试' };
    }
    
    // 统计今天
    const todayLogs = usageLogs.filter(l => l.date === today);
    const todayCount = todayLogs.filter(l => l.model === model).length;
    
    let maxPerDay = settings.maxFastPerDay;
    if (model === 'hd') maxPerDay = settings.maxHdPerDay;
    if (model === 'pro') maxPerDay = settings.maxProPerDay;
    
    if (todayCount >= maxPerDay) {
        return { passed: false, reason: `今日${model === 'fast' ? '快速预览' : model === 'hd' ? '高清商用' : '专业极致'}次数已达上限` };
    }
    
    return { passed: true };
}

// 记录使用日志
function logUsage(model, spaceCount, success) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const now = Date.now();
    
    const usageLogs = JSON.parse(localStorage.getItem('usageLogs') || '[]');
    usageLogs.push({
        time: now,
        date: new Date().toDateString(),
        model,
        spaceCount,
        success,
        userId: user.username || 'guest'
    });
    
    // 只保留最近1000条
    if (usageLogs.length > 1000) {
        usageLogs.splice(0, usageLogs.length - 1000);
    }
    
    localStorage.setItem('usageLogs', JSON.stringify(usageLogs));
}
