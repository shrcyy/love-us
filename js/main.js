/* ============================================
   全局脚本 - 导航 · 动画 · 模态框 · CRUD 工具
   空间管理 · 导出导入 · 分享
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initPetals();
    initSpaceUI();
});

/* ---------- 空间管理 UI ---------- */
function initSpaceUI() {
    const hash = getSpaceHash();
    const spaceName = hash ? getSpaceName() : '';
    updateNavSpaceName(spaceName);
}

function updateNavSpaceName(spaceName) {
    const container = document.getElementById('nav-space-name');
    if (container) {
        if (spaceName) {
            container.innerHTML = '<span class="space-tag">' + escapeHTML(spaceName) + '</span>';
            container.title = '切换空间';
            container.style.cursor = 'pointer';
            container.onclick = showSpaceSwitcher;
        } else {
            container.innerHTML = '';
            container.onclick = null;
        }
    }
}

function showSpaceSwitcher() {
    const spaces = listAllSpaces();
    const currentHash = getSpaceHash();
    let spaceListHTML = '';
    spaces.forEach(s => {
        const isCurrent = s.hash === currentHash;
        spaceListHTML += '<div class="space-item' + (isCurrent ? ' space-current' : '') + '" onclick="switchToSpace(\'' + escapeHTML(s.hash) + '\')">' +
            escapeHTML(s.spaceName) + (isCurrent ? ' <span style="color:var(--primary);font-size:0.8rem;">当前</span>' : '') +
            '</div>';
    });
    if (spaces.length === 0) {
        spaceListHTML = '<div style="padding:16px;text-align:center;color:var(--text-light);">还没有创建过空间</div>';
    }
    const bodyHTML = '<div style="margin-bottom:12px;text-align:center;font-size:0.9rem;color:var(--text-light);">选择一个空间切换</div>' +
        spaceListHTML +
        '<div style="margin-top:16px;text-align:center;">' +
        '<button class="btn btn-outline" onclick="document.querySelector(\'.modal-overlay.active\').remove();showCreateSpaceModal();" style="margin-right:8px;">新建空间</button>' +
        '<button class="btn btn-outline" onclick="switchToSpace(\'\')">默认空间</button>' +
        '</div>';
    showModal({
        title: '切换空间',
        bodyHTML: bodyHTML,
        wide: false
    });
}

function switchToSpace(hash) {
    const newHash = hash ? '#' + hash : '';
    window.location.hash = newHash;
    location.reload();
}

function showCreateSpaceModal() {
    showModal({
        title: '创建我们的空间',
        bodyHTML: '<div class="form-group"><label class="form-label">你们的名字（如：小宇 & 小云）</label><input type="text" id="createSpaceName" class="form-input" placeholder="例如：小宇和小云的秘密花园"></div><div class="form-group"><label class="form-label">自定义标识（英文/数字，用于链接）</label><input type="text" id="createSpaceHash" class="form-input" placeholder="例如：ourlove2024" style="font-family:monospace;"></div>',
        onSave: function(close) {
            const name = document.getElementById('createSpaceName').value.trim();
            let hash = document.getElementById('createSpaceHash').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
            if (!name) { alert('请输入名字'); return; }
            if (!hash) hash = 'love' + Date.now().toString(36);
            // Check if already exists
            if (localStorage.getItem('loveus_data_' + hash)) {
                if (!confirm('空间 ' + hash + ' 已存在，切换到该空间？')) return;
            }
            setSpaceMeta(hash, name);
            close();
            switchToSpace(hash);
        }
    });
}

/* ---------- 导航 ---------- */
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        if (a.getAttribute('href') === current) a.classList.add('active');
    });
}

/* ---------- 滚动动画 ---------- */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ---------- 花瓣动画 ---------- */
function initPetals() {
    const container = document.querySelector('.petals-container');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDelay = Math.random() * 8 + 's';
        petal.style.animationDuration = (Math.random() * 6 + 8) + 's';
        petal.style.opacity = Math.random() * 0.5 + 0.3;
        petal.style.fontSize = (Math.random() * 16 + 10) + 'px';
        petal.textContent = ['🌸', '💮', '🌷', '🌺', '✿'][Math.floor(Math.random() * 5)];
        container.appendChild(petal);
    }
}

/* ========== 模态框系统 ========== */

function showModal(opts) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const card = document.createElement('div');
    card.className = 'modal-card';
    if (opts.wide) card.classList.add('modal-wide');

    card.innerHTML =
        '<div class="modal-header">' +
        '<h3>' + (opts.title || '') + '</h3>' +
        '<button class="modal-close" type="button">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' + (opts.bodyHTML || '') + '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-outline modal-cancel" type="button">取消</button>' +
        '<button class="btn btn-primary modal-save" type="button">' + (opts.saveLabel || '保存') + '</button>' +
        '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('active'); });

    function close() {
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', function() { overlay.remove(); }, { once: true });
        if (opts.onClose) opts.onClose();
    }

    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    card.querySelector('.modal-close').addEventListener('click', close);
    card.querySelector('.modal-cancel').addEventListener('click', close);
    card.querySelector('.modal-save').addEventListener('click', function() { if (opts.onSave) opts.onSave(close, card); });

    var escHandler = function(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
    return { overlay: overlay, card: card, close: close };
}

function showConfirm(msg, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
        '<div class="modal-card modal-confirm">' +
        '<div class="modal-body" style="text-align:center;padding:32px 24px 20px;">' +
        '<p style="font-size:1.1rem;color:var(--text,#5D4E37);margin-bottom:24px;">' + msg + '</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;">' +
        '<button class="btn btn-outline cancel-btn" type="button">取消</button>' +
        '<button class="btn btn-primary confirm-btn" type="button">确认</button>' +
        '</div></div></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('active'); });
    function close() {
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', function() { overlay.remove(); }, { once: true });
    }
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    overlay.querySelector('.cancel-btn').addEventListener('click', close);
    overlay.querySelector('.confirm-btn').addEventListener('click', function() { close(); if (onConfirm) onConfirm(); });
}

/* ---------- "+" 浮动按钮 ---------- */
function addFAB(onClick) {
    if (document.querySelector('.fab-add')) return;
    var fab = document.createElement('button');
    fab.className = 'fab-add';
    fab.innerHTML = '+';
    fab.title = '添加';
    fab.addEventListener('click', onClick);
    document.body.appendChild(fab);
}

/* ---------- 图片上传 HTML + 绑定 ---------- */
function createImageUploadHTML(inputId, previewId, existingImage) {
    var previewSrc = existingImage || '';
    var previewStyle = existingImage ? '' : 'display:none;';
    return '<div class="image-upload" id="' + previewId + '-wrapper">' +
        '<input type="file" id="' + inputId + '" accept="image/*" style="display:none;">' +
        '<div class="upload-area" onclick="document.getElementById(\'' + inputId + '\').click()">' +
        '<img id="' + previewId + '" src="' + previewSrc + '" style="' + previewStyle + 'max-width:100%;max-height:200px;border-radius:12px;margin-bottom:8px;">' +
        '<span id="' + previewId + '-placeholder" style="' + (existingImage ? 'display:none;' : '') + '">📷 点击上传图片（最大 2MB）</span>' +
        '</div></div>';
}

function bindImageUpload(inputId, previewId, callback) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', function() {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('图片不能超过 2MB！'); this.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById(previewId);
            var placeholder = document.getElementById(previewId + '-placeholder');
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';
            if (callback) callback(e.target.result);
        };
        reader.readAsDataURL(file);
    });
}

/* ---------- 卡片操作按钮（编辑/删除） ---------- */
function createCardActions(onEdit, onDelete) {
    var div = document.createElement('div');
    div.className = 'card-actions';
    div.innerHTML = '<button class="action-btn action-edit" title="编辑">✎</button><button class="action-btn action-delete" title="删除">✕</button>';
    div.querySelector('.action-edit').addEventListener('click', function(e) { e.stopPropagation(); onEdit(); });
    div.querySelector('.action-delete').addEventListener('click', function(e) { e.stopPropagation(); onDelete(); });
    return div;
}

/* ---------- 工具函数 ---------- */
function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getNowStr() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}

function getTodayDateStr() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
}

function daysTogether() {
    var start = new Date(APP_DATA.startDate + 'T00:00:00');
    var now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.getFullYear() + '年' + String(d.getMonth() + 1).padStart(2, '0') + '月' + String(d.getDate()).padStart(2, '0') + '日';
}