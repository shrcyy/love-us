var DEFAULT_DATA = {
    startDate: '2023-05-20',
    person1: { name: '小宇', intro: '喜欢摄影和旅行，想把每个瞬间都记录下来。' },
    person2: { name: '小云', intro: '热爱烘焙和音乐，相信生活需要仪式感。' },
    diaries: [
        { id: 1, date: '2023-06-01', mood: '😊', title: '第一次一起看日出', content: '今天凌晨四点起床，开车去海边看日出。虽然很困，但看到太阳从海平面升起的那一刻，觉得一切都值得。' },
        { id: 2, date: '2023-07-15', mood: '❤️', title: '纪念日', content: '在一起两个月了，一起去吃了那家一直想去的餐厅。' },
        { id: 3, date: '2023-08-20', mood: '🎂', title: '生日惊喜', content: '偷偷准备了生日蛋糕，看到你惊喜的表情，开心！' }
    ],
    anniversaries: [
        { id: 1, name: '在一起', date: '2023-05-20', icon: '💕', desc: '我们在一起的日子' },
        { id: 2, name: '第一次约会', date: '2023-05-25', icon: '☕', desc: '第一次正式约会' },
        { id: 3, name: '第一次旅行', date: '2023-08-10', icon: '✈️', desc: '第一次一起旅行' }
    ],
    photos: [
        { id: 1, image: '', title: '海边日出', date: '2023-06-01', tags: ['旅行', '日出'], emoji: '🌅' },
        { id: 2, image: '', title: '纪念日晚餐', date: '2023-07-15', tags: ['晚餐', '纪念'], emoji: '🍽️' },
        { id: 3, image: '', title: '生日惊喜', date: '2023-08-20', tags: ['生日', '惊喜'], emoji: '🎂' }
    ],
    wishes: [
        { id: 1, name: '一起去日本看樱花', desc: '春天去京都赏樱', priority: 'high', done: false },
        { id: 2, name: '学会做一道拿手菜', desc: '一起学做意大利面', priority: 'medium', done: false },
        { id: 3, name: '看一场演唱会', desc: '喜欢的歌手巡演', priority: 'low', done: false }
    ],
    messages: [
        { id: 1, sender: '小宇', mood: '💌', content: '今天也要开心哦！', time: '2023-06-01 08:30' },
        { id: 2, sender: '小云', mood: '❤️', content: '想你啦~', time: '2023-06-02 14:20' }
    ],
    places: [
        { id: 1, name: '海边日出', date: '2023-06-01', lat: 39.9042, lng: 116.4074, memory: '第一次一起看日出', checked: true },
        { id: 2, name: '纪念餐厅', date: '2023-07-15', lat: 31.2304, lng: 121.4737, memory: '两个月纪念日', checked: true }
    ],
    timelineNodes: [
        { id: 1, title: '第一次相遇', date: '2023-05-10', desc: '在朋友的聚会上认识' },
        { id: 2, title: '第一次约会', date: '2023-05-25', desc: '一起喝咖啡聊天' },
        { id: 3, title: '在一起', date: '2023-05-20', desc: '正式成为情侣' }
    ],
    hobbies: ['摄影', '旅行', '烘焙', '音乐', '电影', '阅读']
};

function getSpaceHash() {
    var hash = window.location.hash.substring(1);
    return hash || 'default';
}

function getStorageKey() {
    return 'loveus_data_' + getSpaceHash();
}

function getSpaceName() {
    var hash = getSpaceHash();
    if (hash === 'default') return '默认空间';
    return decodeURIComponent(hash).substring(0, 20) + (hash.length > 20 ? '...' : '');
}

function setSpaceMeta(name, passwordHash) {
    var key = getStorageKey() + '_meta';
    var meta = { name: name, created: new Date().toISOString() };
    if (passwordHash) meta.passwordHash = passwordHash;
    localStorage.setItem(key, JSON.stringify(meta));
}

function getSpaceMeta() {
    var key = getStorageKey() + '_meta';
    var meta = localStorage.getItem(key);
    if (meta) {
        try { return JSON.parse(meta); } catch (e) { return null; }
    }
    return null;
}

function isLoggedIn() {
    return sessionStorage.getItem('loveus_login_' + getSpaceHash()) === '1';
}

function setLoggedIn() {
    sessionStorage.setItem('loveus_login_' + getSpaceHash(), '1');
}

function clearLogin() {
    sessionStorage.removeItem('loveus_login_' + getSpaceHash());
}

function hashPasswordSHA256(password) {
    var encoder = new TextEncoder();
    var data = encoder.encode(password);
    return crypto.subtle.digest('SHA-256', data).then(function(hashBuffer) {
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
}

function listAllSpaces() {
    var spaces = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith('loveus_data_') && !key.endsWith('_meta')) {
            var spaceKey = key.replace('loveus_data_', '');
            if (spaceKey === 'default') continue;
            var metaKey = key + '_meta';
            var meta = localStorage.getItem(metaKey);
            var parsed = meta ? JSON.parse(meta) : null;
            spaces.push({
                key: spaceKey,
                name: parsed ? parsed.name : spaceKey,
                created: parsed ? parsed.created : null,
                hasPassword: !!(parsed && parsed.passwordHash)
            });
        }
    }
    return spaces;
}

function loadData() {
    var key = getStorageKey();
    var stored = localStorage.getItem(key);
    if (stored) {
        try {
            var parsed = JSON.parse(stored);
            return parsed;
        } catch (e) {
            console.error('解析数据失败', e);
        }
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
    var key = getStorageKey();
    // 1. 先写本地（同步，保证不丢数据）
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('存储空间不足，请清理浏览器缓存或导出数据后重试。');
        }
    }
    // 2. 异步写云端（不阻塞 UI，失败只提示不中断）
    if (typeof cloudSave === 'function') {
        cloudSave('main', data).then(function(ok) {
            if (!ok) { console.warn('[Sync] 云端保存失败，数据仅保存在本地'); }
        });
    }
}

/**
 * 初始化云端同步：页面加载时尝试从云端拉取数据
 * - 云端有数据且比本地新 → 更新 APP_DATA + localStorage
 * - 云端无数据或更旧 → 把本地数据推送到云端
 * - 云端请求失败 → 不影响本地使用
 * 返回 Promise，调用方可监听同步完成事件。
 */
function initCloudSync() {
    return new Promise(function(resolve) {
        if (typeof cloudLoad !== 'function') {
            console.log('[Sync] 云端模块未加载，使用纯本地模式');
            resolve({ from: 'local', message: '云端模块未加载' });
            return;
        }

        cloudLoad('main').then(function(cloudData) {
            if (cloudData && typeof cloudData === 'object' && !Array.isArray(cloudData)) {
                // 云端有数据 → 检查是否比本地新
                var localData = loadDataFromLocal();
                var cloudHasContent = Object.keys(cloudData).some(function(k) {
                    return k !== 'startDate' || cloudData[k];
                });

                if (cloudHasContent) {
                    // 用云端数据覆盖本地
                    window.APP_DATA = cloudData;
                    try {
                        localStorage.setItem(getStorageKey(), JSON.stringify(cloudData));
                    } catch(e) {}
                    console.log('[Sync] 已从云端加载数据');
                    resolve({ from: 'cloud', message: '已从云端同步' });
                } else {
                    // 云端数据为空，推送本地上去
                    if (localData) {
                        cloudSave('main', localData);
                    }
                    resolve({ from: 'local', message: '云端数据为空，使用本地' });
                }
            } else {
                // 云端无数据 → 把本地推上去
                var ld = loadDataFromLocal();
                cloudSave('main', ld).then(function(ok) {
                    if (ok) {
                        resolve({ from: 'local', message: '已上传到云端' });
                    } else {
                        resolve({ from: 'local', message: '云端上传失败' });
                    }
                });
            }
        }).catch(function(err) {
            console.warn('[Sync] 云端拉取失败，使用本地数据', err);
            resolve({ from: 'local', message: '云端连接失败' });
        });
    });
}

/** 仅从 localStorage 读取（不尝试云端，避免循环） */
function loadDataFromLocal() {
    var key = getStorageKey();
    var stored = localStorage.getItem(key);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) { return null; }
    }
    return null;
}

function generateId(array) {
    var max = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i].id > max) max = array[i].id;
    }
    return max + 1;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.getFullYear() + '年' + (d.getMonth() + 1).toString().padStart(2, '0') + '月' + d.getDate().toString().padStart(2, '0') + '日';
}

function getTodayDateStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
}

function exportDataJSON() {
    var data = loadData();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'loveus_data_' + getSpaceHash() + '_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function importDataJSON(jsonStr) {
    try {
        var imported = JSON.parse(jsonStr);
        if (typeof imported !== 'object' || imported === null) throw new Error('无效数据');
        saveData(imported);
        window.location.reload();
        return true;
    } catch (e) {
        alert('导入失败：' + e.message);
        return false;
    }
}

var APP_DATA = loadData();