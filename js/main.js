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

/* ===== Password Gate ===== */
function checkAccess(onGranted, onDenied) {
    var meta = getSpaceMeta();
    if (!meta || !meta.passwordHash) {
        setLoggedIn();
        onGranted();
        return;
    }
    if (isLoggedIn()) {
        onGranted();
        return;
    }
    onDenied();
}

function showPasswordGate(onSuccess) {
    var container = document.getElementById('passwordGate');
    if (!container) {
        var main = document.querySelector('.main-container');
        container = document.createElement('div');
        container.id = 'passwordGate';
        container.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:60vh;';
        main.insertBefore(container, main.firstChild);
    }
    container.innerHTML =
        '<div class="pw-gate-card fade-in">' +
        '<div class="pw-gate-icon">🔐</div>' +
        '<h2 class="pw-gate-title">' + escapeHTML(getSpaceName()) + '</h2>' +
        '<p class="pw-gate-desc">这个空间已被主人设置密码保护<br>请输入密码进入</p>' +
        '<div class="pw-gate-input-row" id="pwInputRow">' +
        '<input type="password" id="pwGateInput" class="pw-gate-input" placeholder="输入密码..." autofocus autocomplete="off">' +
        '<button class="btn btn-primary pw-gate-btn" id="pwGateBtn">进入我们的空间</button>' +
        '</div>' +
        '<p class="pw-gate-error" id="pwGateError" style="display:none;">密码不正确，请重试</p>' +
        '</div>';

    container.style.display = 'flex';
    document.getElementById('homeHero').style.display = 'none';
    document.getElementById('countdownCard').style.display = 'none';
    var qn = document.querySelector('.quick-nav');
    if (qn) qn.style.display = 'none';
    var rd = document.getElementById('recentDiaries');
    if (rd) rd.parentElement.style.display = 'none';

    function handleSubmit() {
        var input = document.getElementById('pwGateInput').value.trim();
        if (!input) return;
        var meta = getSpaceMeta();
        hashPasswordSHA256(input).then(function(hash) {
            if (hash === meta.passwordHash) {
                setLoggedIn();
                document.getElementById('passwordGate').style.display = 'none';
                document.getElementById('homeHero').style.display = 'block';
                var qn2 = document.querySelector('.quick-nav');
                if (qn2) qn2.style.display = '';
                var rd2 = document.getElementById('recentDiaries');
                if (rd2) rd2.parentElement.style.display = '';
                onSuccess();
            } else {
                var error = document.getElementById('pwGateError');
                error.style.display = 'block';
                var row = document.getElementById('pwInputRow');
                row.classList.add('pw-shake');
                setTimeout(function() { row.classList.remove('pw-shake'); }, 500);
                document.getElementById('pwGateInput').value = '';
                document.getElementById('pwGateInput').focus();
            }
        });
    }

    document.getElementById('pwGateBtn').addEventListener('click', handleSubmit);
    document.getElementById('pwGateInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleSubmit();
    });
}

function hidePasswordGate() {
    var gate = document.getElementById('passwordGate');
    if (gate) gate.style.display = 'none';
    document.getElementById('homeHero').style.display = 'block';
    document.getElementById('countdownCard').style.display = 'block';
    var qn = document.querySelector('.quick-nav');
    if (qn) qn.style.display = '';
    var rd = document.getElementById('recentDiaries');
    if (rd) rd.parentElement.style.display = '';
}

function showCreateSpaceModal() {
    showModal({
        title: '创建我们的空间',
        bodyHTML:
            '<div class="form-group"><label class="form-label">空间名称（如：我们的故事）</label><input type="text" id="spaceNameInput" class="form-input" placeholder="为你们的空间起个名字"></div>' +
            '<div class="form-group"><label class="form-label">设置密码（4位以上，强烈建议）</label><input type="password" id="spacePasswordInput" class="form-input" placeholder="设置访问密码..." autocomplete="new-password"></div>' +
            '<div class="form-group"><label class="form-label">确认密码</label><input type="password" id="spacePasswordConfirm" class="form-input" placeholder="再次输入密码" autocomplete="new-password"></div>' +
            '<p style="font-size:0.78rem;color:var(--text-lighter);margin-top:-4px;">密码保护你们的私密空间，分享时需一并告知密码。<br>留空则不设置密码。</p>',
        onSave: function(close) {
            var name = document.getElementById('spaceNameInput').value.trim();
            if (!name) { alert('请输入空间名称'); return; }
            var pw = document.getElementById('spacePasswordInput').value;
            var pwConfirm = document.getElementById('spacePasswordConfirm').value;
            if (pw && pw !== pwConfirm) { alert('两次密码不一致'); return; }
            if (pw && pw.length < 4) { alert('密码至少需要4位'); return; }
            var hash = 'space' + Date.now().toString(36);
            if (pw) {
                hashPasswordSHA256(pw).then(function(hashPwd) {
                    setSpaceMeta(name, hashPwd);
                    window.location.hash = hash;
                    setLoggedIn();
                    close();
                    setTimeout(function() { window.location.reload(); }, 300);
                });
            } else {
                setSpaceMeta(name);
                window.location.hash = hash;
                setLoggedIn();
                close();
                setTimeout(function() { window.location.reload(); }, 300);
            }
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
            (s.hasPassword ? '<span class="space-pwd-badge">🔐 已加密</span>' : '') +
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