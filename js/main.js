function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function initSpaceUI() {
    var spaceName = getSpaceName();
    var navSpace = document.getElementById('nav-space-name');
    if (navSpace) navSpace.innerHTML = '<div class="space-tag" title="' + escapeHTML(spaceName) + '">' + escapeHTML(spaceName) + '</div>';
}

function updateNavSpaceName() {
    initSpaceUI();
}

function showCreateSpaceModal() {
    showModal({
        title: '创建我们的空间',
        bodyHTML: '<div class="form-group"><label class="form-label">空间名称（如：我们的故事）</label><input type="text" id="spaceNameInput" class="form-input" placeholder="为你们的空间起个名字"></div>',
        onSave: function(close) {
            var name = document.getElementById('spaceNameInput').value.trim();
            if (!name) { alert('请输入空间名称'); return; }
            var hash = 'space' + Date.now().toString(36);
            setSpaceMeta(name);
            window.location.hash = hash;
            close();
            setTimeout(function() { window.location.reload(); }, 300);
        }
    });
}

function showSpaceSwitcher() {
    var spaces = listAllSpaces();
    var current = getSpaceHash();
    var html = '<div style="max-height:300px;overflow-y:auto;padding:4px;">';
    if (spaces.length === 0) html += '<p style="color:var(--text-light);text-align:center;padding:20px;">暂无其他空间</p>';
    spaces.forEach(function(s) {
        var isCurrent = s.key === current;
        html += '<div class="space-item' + (isCurrent ? ' space-current' : '') + '" onclick="switchToSpace(\'' + escapeHTML(s.key) + '\')">' +
            '<div style="font-weight:500;color:var(--text);">' + escapeHTML(s.name) + '</div>' +
            '<div style="font-size:.8rem;color:var(--text-lighter);">' + (s.created ? new Date(s.created).toLocaleDateString() : '') + '</div>' +
            (isCurrent ? '<div style="font-size:.75rem;color:var(--primary);margin-top:4px;">✓ 当前空间</div>' : '') +
            '</div>';
    });
    html += '</div>';
    showModal({
        title: '切换空间',
        bodyHTML: html,
        onSave: null,
        showCancel: false,
        showSave: false
    });
}

function switchToSpace(key) {
    window.location.hash = key;
    setTimeout(function() { window.location.reload(); }, 300);
}

function initNav() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    document.addEventListener('click', function(e) {
        if (hamburger && !hamburger.contains(e.target) && navLinks && !navLinks.contains(e.target) && navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

function initScrollAnimations() {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.05 });
    document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });
}

function initPetals() {
    if (document.body.classList.contains('no-petals')) return;
    var container = document.createElement('div');
    container.className = 'petal-container';
    for (var i = 0; i < 12; i++) {
        var petal = document.createElement('div');
        petal.className = 'petal';
        container.appendChild(petal);
    }
    document.body.appendChild(container);
}

function showModal(options) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    var card = document.createElement('div');
    card.className = 'modal-card' + (options.wide ? ' modal-wide' : '') + (options.type === 'confirm' ? ' modal-confirm' : '');
    var header = '<div class="modal-header"><h3>' + escapeHTML(options.title) + '</h3><button class="modal-close">&times;</button></div>';
    var body = '<div class="modal-body">' + (options.bodyHTML || '') + '</div>';
    var footer = '';
    if (options.onSave || options.onCancel) {
        footer = '<div class="modal-footer">' +
            (options.showCancel !== false ? '<button class="btn btn-outline" id="modalCancel">取消</button>' : '') +
            (options.showSave !== false ? '<button class="btn btn-primary" id="modalSave">' + (options.saveText || '保存') + '</button>' : '') +
            '</div>';
    }
    card.innerHTML = header + body + footer;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('active'); }, 10);
    var closeModal = function() {
        overlay.classList.remove('active');
        setTimeout(function() { document.body.removeChild(overlay); }, 250);
    };
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    if (options.onCancel) {
        overlay.querySelector('#modalCancel').addEventListener('click', function() {
            if (options.onCancel) options.onCancel();
            closeModal();
        });
    } else if (options.showCancel !== false) {
        overlay.querySelector('#modalCancel').addEventListener('click', closeModal);
    }
    if (options.onSave) {
        overlay.querySelector('#modalSave').addEventListener('click', function() {
            options.onSave(closeModal);
        });
    }
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
    });
}

function showConfirm(message, onConfirm) {
    showModal({
        title: '确认',
        type: 'confirm',
        bodyHTML: '<p style="color:var(--text);line-height:1.6;">' + escapeHTML(message) + '</p>',
        onSave: function(close) { onConfirm(); close(); },
        saveText: '确定'
    });
}

function addFAB(onClick) {
    var fab = document.createElement('button');
    fab.className = 'fab-add';
    fab.innerHTML = '+';
    fab.title = '添加';
    fab.addEventListener('click', onClick);
    document.body.appendChild(fab);
}

function createCardActions(onEdit, onDelete) {
    var container = document.createElement('div');
    container.className = 'card-actions';
    var editBtn = document.createElement('button');
    editBtn.className = 'action-btn action-edit';
    editBtn.innerHTML = '✎';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', function(e) { e.stopPropagation(); onEdit(); });
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn action-delete';
    deleteBtn.innerHTML = '✕';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', function(e) { e.stopPropagation(); onDelete(); });
    container.appendChild(editBtn);
    container.appendChild(deleteBtn);
    return container;
}

function createImageUploadHTML(inputId, previewId, currentImage) {
    return '<div class="image-upload">' +
        '<div class="upload-area" id="' + inputId + '_area">' +
        '<input type="file" accept="image/*" id="' + inputId + '" style="display:none;">' +
        '<div style="font-size:2rem;margin-bottom:6px;">📷</div>' +
        '<div>点击上传图片（2MB以内）</div>' +
        '</div>' +
        (currentImage ? '<div id="' + previewId + '" style="margin-top:12px;text-align:center;"><img src="' + currentImage + '" style="max-width:200px;max-height:120px;border-radius:8px;border:2px solid var(--accent-light);"></div>' : '<div id="' + previewId + '"></div>') +
        '</div>';
}

function bindImageUpload(inputId, previewId, callback) {
    var input = document.getElementById(inputId);
    var area = document.getElementById(inputId + '_area');
    var preview = document.getElementById(previewId);
    if (!input || !area) return;
    area.addEventListener('click', function() { input.click(); });
    input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('图片大小不能超过2MB'); return; }
        var reader = new FileReader();
        reader.onload = function(e) {
            var base64 = e.target.result;
            preview.innerHTML = '<img src="' + base64 + '" style="max-width:200px;max-height:120px;border-radius:8px;border:2px solid var(--accent-light);">';
            if (callback) callback(base64);
        };
        reader.readAsDataURL(file);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initNav();
    initScrollAnimations();
    initPetals();
    initSpaceUI();
});