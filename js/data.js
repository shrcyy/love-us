/* ============================================
   数据文件 - 两人私密纪念网站（可编辑版）
   localStorage 持久化 · 增删改查 · 多空间支持
   ============================================ */

/* ---------- 空间管理 ---------- */
function getSpaceHash() {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '';
}

function getStorageKey() {
    const hash = getSpaceHash();
    return hash ? 'loveus_data_' + hash : 'loveus_data';
}

function getSpaceName() {
    const hash = getSpaceHash();
    if (!hash) return '';
    try {
        const meta = JSON.parse(localStorage.getItem('loveus_meta_' + hash) || '{}');
        return meta.spaceName || hash;
    } catch (e) { return hash; }
}

function setSpaceMeta(hash, spaceName) {
    localStorage.setItem('loveus_meta_' + hash, JSON.stringify({ spaceName, createdAt: new Date().toISOString() }));
}

function listAllSpaces() {
    const spaces = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('loveus_meta_')) {
            const hash = key.replace('loveus_meta_', '');
            try {
                const meta = JSON.parse(localStorage.getItem(key));
                spaces.push({ hash, spaceName: meta.spaceName || hash, createdAt: meta.createdAt });
            } catch (e) { spaces.push({ hash, spaceName: hash }); }
        }
    }
    return spaces;
}

/* ---------- 预设数据（首次加载时使用） ---------- */
const DEFAULT_DATA = {
    startDate: "2023-02-14",
    person1: { name: "小宇", initial: "Y", intro: "喜欢摄影和旅行，梦想是和你一起走遍世界每一个角落。" },
    person2: { name: "小云", initial: "C", intro: "热爱烘焙和看书，最大的幸福是每天醒来看到你的笑容。" },
    hobbies: ["摄影", "旅行", "烘焙", "看电影", "逛书店", "爬山", "做饭", "拼乐高", "听音乐会", "养猫"],
    timelineNodes: [
        { id: 1, date: "2022-09-15", title: "初次相遇", desc: "在朋友的聚会上第一次见到你，你穿着白色的连衣裙，笑起来眼睛像弯弯的月亮。" },
        { id: 2, date: "2022-11-20", title: "第一次约会", desc: "一起看了电影《你的名字》，散场后我们在江边走了很久，聊到星星都出来了。" },
        { id: 3, date: "2023-02-14", title: "正式在一起", desc: "情人节那天，终于鼓起勇气牵起你的手。你说'好'的那一刻，我觉得全世界的花都开了。" },
        { id: 4, date: "2023-07-08", title: "第一次旅行", desc: "去了大理，租了一辆小电驴环洱海。风吹起你的长发，那一刻我想就这样一直骑下去。" },
        { id: 5, date: "2024-01-01", title: "第一次跨年", desc: "在迪士尼城堡下一起倒数，烟火照亮了你的脸，我们许下了新年的愿望。" }
    ],
    diaries: [
        { id: 1, date: "2024-05-20", title: "520 的小惊喜", content: "今天下班回家，发现你在桌上摆了一束我喜欢的洋甘菊，还有一张手写的小卡片。卡片上写着'每天都是520'。晚上我们一起做了番茄牛腩，你切番茄切得满手都是，我在旁边笑你。这就是我想要的生活。", mood: "🥰", moodText: "幸福", year: 2024, image: "" },
        { id: 2, date: "2024-04-08", title: "一起学做提拉米苏", content: "你说想吃提拉米苏，我说那我们自己做吧！去超市买了马斯卡彭奶酪和手指饼干。你负责打奶油，我负责蘸咖啡液。你打奶油打得太久变成了黄油…我们笑成一团。虽然成品外形有点丑，但味道意外地好。", mood: "😆", moodText: "开心", year: 2024, image: "" },
        { id: 3, date: "2024-03-15", title: "吵架后的小纸条", content: "今天因为洗碗的事情吵了一架。冷战一个小时后，我在枕头下发现你写的纸条：'对不起，以后我洗碗，你负责吃。'画了一个丑丑的笑脸。晚上你偷偷点了烧烤外卖，我们坐在阳台上边吃边聊到深夜。", mood: "🥺", moodText: "感动", year: 2024, image: "" },
        { id: 4, date: "2024-01-01", title: "跨年夜在迪士尼", content: "第一次一起跨年！我们去了迪士尼，你戴着米妮发箍满园跑。烟花秀的时候，你靠在我肩膀上。倒数的时候人山人海，我紧紧握着你的手。你在我耳边说'新年快乐'，2024，还请多多指教。", mood: "🎆", moodText: "浪漫", year: 2024, image: "" },
        { id: 5, date: "2023-12-25", title: "第一次装饰圣诞树", content: "我们去市场挑了一棵小圣诞树。回家后放了圣诞歌单，一边哼歌一边挂彩球。最后点亮彩灯的那一刻，整个客厅变成了温暖的童话世界。我们窝在沙发上喝热可可，看《真爱至上》。", mood: "🎄", moodText: "温馨", year: 2023, image: "" },
        { id: 6, date: "2023-10-15", title: "给他过生日", content: "偷偷准备了半个月——学做了黑森林蛋糕，把他的好朋友们都叫来了。他推门进来看到满屋子的气球时，愣了好几秒，然后红着眼眶说'你们怎么都在'。他抱着我说这是他过得最开心的生日。", mood: "🎂", moodText: "惊喜", year: 2023, image: "" },
        { id: 7, date: "2023-07-08", title: "大理，我们的第一次旅行", content: "出发前兴奋得一夜没睡。大理的云很低，洱海蓝得像宝石。我们租了一辆小电驴环湖，你坐在后座搂着我的腰。路上遇到一片向日葵田，停下来拍了很多照片。傍晚在双廊看日落把苍山染成金色。", mood: "🏍️", moodText: "自由", year: 2023, image: "" },
        { id: 8, date: "2023-06-21", title: "陪她过的第一个生日", content: "这是我们在一起后你的第一个生日。我订了你最喜欢的日料店，在桌上撒了玫瑰花瓣。礼物是一条锁骨链，链坠是一颗小星星——因为你说过，我是你这辈子最亮的星。", mood: "💝", moodText: "甜蜜", year: 2023, image: "" }
    ],
    anniversaries: [
        { id: 1, name: "在一起纪念日", date: "2023-02-14", icon: "💕", type: "love", desc: "我们的故事从这一天正式开始" },
        { id: 2, name: "她的生日", date: "2023-06-21", icon: "🎂", type: "birthday", desc: "全世界最可爱的女孩出生的日子" },
        { id: 3, name: "他的生日", date: "2023-10-15", icon: "🎁", type: "birthday", desc: "那个愿意为我遮风挡雨的人" },
        { id: 4, name: "情人节", date: "2024-02-14", icon: "🌹", type: "festival", desc: "属于恋人们的甜蜜节日" },
        { id: 5, name: "第一次旅行", date: "2023-07-08", icon: "✈️", type: "memory", desc: "大理洱海边的风，吹过我们的夏天" },
        { id: 6, name: "第一次看电影", date: "2022-11-20", icon: "🎬", type: "memory", desc: "《你的名字》，我们的名字从此纠缠在一起" },
        { id: 7, name: "七夕", date: "2024-08-10", icon: "✨", type: "festival", desc: "牛郎织女相会的日子" },
        { id: 8, name: "圣诞纪念", date: "2023-12-25", icon: "🎄", type: "festival", desc: "一起装饰圣诞树，喝了热乎乎的红酒" }
    ],
    photos: [
        { id: 1, image: "", emoji: "🏍️", title: "洱海边的我们", date: "2023-07-08", tags: ["旅行"] },
        { id: 2, image: "", emoji: "🎆", title: "迪士尼跨年烟火", date: "2024-01-01", tags: ["节日", "旅行"] },
        { id: 3, image: "", emoji: "🍰", title: "第一次做的提拉米苏", date: "2024-04-08", tags: ["日常", "美食"] },
        { id: 4, image: "", emoji: "🎂", title: "他的生日派对", date: "2023-10-15", tags: ["节日"] },
        { id: 5, image: "", emoji: "🎄", title: "装饰圣诞树", date: "2023-12-25", tags: ["节日", "日常"] },
        { id: 6, image: "", emoji: "🌻", title: "向日葵田合影", date: "2023-07-08", tags: ["旅行"] },
        { id: 7, image: "", emoji: "🍳", title: "周末早午餐", date: "2024-03-15", tags: ["日常", "美食"] },
        { id: 8, image: "", emoji: "🎢", title: "游乐园的一天", date: "2024-04-20", tags: ["旅行"] },
        { id: 9, image: "", emoji: "📚", title: "书店的下午", date: "2024-02-14", tags: ["日常"] },
        { id: 10, image: "", emoji: "🌸", title: "春天第一朵花", date: "2024-03-01", tags: ["日常"] },
        { id: 11, image: "", emoji: "🍲", title: "火锅之夜", date: "2024-05-10", tags: ["美食", "日常"] },
        { id: 12, image: "", emoji: "🌅", title: "海边的日落", date: "2024-02-14", tags: ["旅行"] }
    ],
    wishes: [
        { id: 1, name: "一起去日本看樱花", desc: "在京都的樱花树下野餐，拍一套和服写真", priority: "high", done: false },
        { id: 2, name: "一起学潜水证", desc: "去仙本那或马尔代夫，在海底牵一次手", priority: "high", done: false },
        { id: 3, name: "养一只橘猫", desc: "取名'团子'，每天抱着它看电影", priority: "medium", done: false },
        { id: 4, name: "看一场周杰伦演唱会", desc: "在《简单爱》响起的时候，和你一起大合唱", priority: "medium", done: false },
        { id: 5, name: "一起去迪士尼", desc: "东京迪士尼海洋，那是全世界最浪漫的迪士尼", priority: "high", done: true, doneDate: "2024-01-01" },
        { id: 6, name: "一起做一本相册", desc: "把我们手机里的照片打印出来，做成厚厚的相册", priority: "low", done: false },
        { id: 7, name: "去大理环洱海", desc: "租小电驴环湖，在双廊看日落", priority: "medium", done: true, doneDate: "2023-07-08" },
        { id: 8, name: "一起拼一座乐高城堡", desc: "霍格沃茨城堡，拼完摆在客厅最显眼的地方", priority: "low", done: false },
        { id: 9, name: "一起去冰岛看极光", desc: "在极光下许愿，泡蓝湖温泉", priority: "high", done: false },
        { id: 10, name: "学会做对方的拿手菜", desc: "我学你的糖醋排骨，你学我的提拉米苏", priority: "low", done: false }
    ],
    messages: [
        { id: 1, sender: "小宇", content: "今天路过我们第一次约会的那家电影院，门口换了新的海报。想起那天你穿着白裙子站在那里等我的样子，心跳还是和那天一样快。", time: "2024-05-20 08:30", mood: "💌" },
        { id: 2, sender: "小云", content: "早上醒来看到你还在睡，睫毛长长的，呼吸轻轻的。突然觉得好幸福——能每天醒来第一眼就看到你。虽然有时候你会抢我被子，但你睡着的样子实在太可爱了。", time: "2024-05-18 07:15", mood: "💗" },
        { id: 3, sender: "小宇", content: "今天工作特别累，但一进门闻到你在厨房炖汤的味道，所有的疲惫都不见了。你围着围裙探出头来说'马上就好'——那一刻我觉得，这就是家的味道。", time: "2024-05-10 19:20", mood: "🏠" },
        { id: 4, sender: "小云", content: "翻到去年在大理的照片，你骑着小电驴，我在后座搂着你，风吹得头发糊了一脸。那张照片拍得很糊，但我一直舍不得删——因为那是我们第一次一起旅行。", time: "2024-04-25 22:08", mood: "📸" },
        { id: 5, sender: "小宇", content: "你出差的第一天，家里突然好安静。平时嫌你吵，你一不在我才发现——没有你的唠叨的房间，不是家。想你。", time: "2024-04-12 23:45", mood: "🥺" },
        { id: 6, sender: "小云", content: "今天是我们在一起的第十五个月。说长不长，说短不短，但每一天都像昨天一样清晰。我爱你，每一天都比前一天多一点。", time: "2024-04-01 00:00", mood: "💕" }
    ],
    places: [
        { id: 1, name: "大理", date: "2023-07-08", lat: 25.6065, lng: 100.2681, memory: "第一次一起旅行。租小电驴环洱海，在双廊看日落。", checked: true, photo: "" },
        { id: 2, name: "上海迪士尼", date: "2024-01-01", lat: 31.1443, lng: 121.6608, memory: "迪士尼跨年。城堡下倒数，烟花照亮你的脸。", checked: true, photo: "" },
        { id: 3, name: "厦门", date: "2024-02-14", lat: 24.4798, lng: 118.0894, memory: "在一起一周年旅行。鼓浪屿的小巷，海边的日落。", checked: true, photo: "" },
        { id: 4, name: "成都", date: "2024-04-05", lat: 30.5728, lng: 104.0668, memory: "清明小长假。火锅串串大熊猫，宽窄巷子锦里。", checked: true, photo: "" },
        { id: 5, name: "杭州", date: "2023-10-01", lat: 30.2741, lng: 120.1551, memory: "国庆游西湖。租了自行车绕湖，在龙井村喝茶。", checked: true, photo: "" }
    ]
};

/* ---------- localStorage 持久化引擎 ---------- */
function loadData() {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
        try { return JSON.parse(stored); }
        catch (e) { console.warn('localStorage 数据损坏，回退到预设数据'); }
    }
    const data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveData(data);
    return data;
}

function saveData(data) {
    const key = getStorageKey();
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) {
        if (e.name === 'QuotaExceededError') alert('存储空间不足！请删除一些照片或内容后再试。');
    }
}

function generateId(arr) {
    if (!arr || arr.length === 0) return 1;
    return Math.max(...arr.map(item => item.id || 0)) + 1;
}

/* ---------- 导出 / 导入 ---------- */
function exportDataJSON() {
    const data = JSON.parse(JSON.stringify(APP_DATA));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loveus_backup_' + getTodayDateStr() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importDataJSON(jsonStr) {
    try {
        const imported = JSON.parse(jsonStr);
        if (!imported || typeof imported !== 'object') throw new Error('无效的数据格式');
        const merged = JSON.parse(JSON.stringify(DEFAULT_DATA));
        Object.keys(merged).forEach(k => {
            if (imported[k] !== undefined) merged[k] = imported[k];
        });
        APP_DATA = merged;
        saveData(APP_DATA);
        return true;
    } catch (e) {
        alert('导入失败：' + e.message);
        return false;
    }
}

/* ---------- 全局数据对象 ---------- */
let APP_DATA = loadData();

function getData() { return APP_DATA; }
function refreshData() { APP_DATA = loadData(); }

/* ---------- 向后兼容的访问器 ---------- */
function getCOUPLE_INFO() {
    const d = getData();
    return {
        partner1: { name: d.person1.name, initial: d.person1.initial, intro: d.person1.intro },
        partner2: { name: d.person2.name, initial: d.person2.initial, intro: d.person2.intro },
        togetherDate: d.startDate,
        story: d.timelineNodes,
        hobbies: d.hobbies,
        stats: { moviesWatched: 47, placesVisited: d.places.length, photosTaken: d.photos.length * 100 + 83, daysTogether: 0 }
    };
}

/* ---------- 颜色主题 ---------- */
const COLORS = {
    primary: "#FF8C94", secondary: "#F9E4D4", accent: "#C9B8A8",
    bg: "#FFF9F5", text: "#5D4E37", textLight: "#8B7D6B",
    white: "#FFFFFF", shadow: "rgba(139, 125, 107, 0.12)"
};
