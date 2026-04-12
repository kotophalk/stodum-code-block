/**
 * StoDum Code Block Migrator - Admin JS
 */
(function () {
    'use strict';

    var scanBtn      = document.getElementById('cs-scan-btn');
    var migrateAllBtn = document.getElementById('cs-migrate-all-btn');
    var statusEl     = document.getElementById('cs-scan-status');
    var resultsContainer = document.getElementById('cs-scan-results');
    var resultsArea  = document.getElementById('cs-results-area');
    var modal        = document.getElementById('cs-preview-modal');
    var modalTitle   = document.getElementById('cs-modal-title');
    var modalBody    = document.getElementById('cs-modal-body');
    var modalMigrateBtn = document.getElementById('cs-modal-migrate-btn');

    // Bail if the migrate tab elements aren't present
    if (!scanBtn || !modal) return;

    var scannedPosts = [];

    // =========================================================================
    //  Helpers
    // =========================================================================

    function ajax(action, data, callback) {
        var fd = new FormData();
        fd.append('action', action);
        fd.append('nonce', csDevtoolsMigrate.nonce);
        if (data) {
            Object.keys(data).forEach(function (k) {
                fd.append(k, data[k]);
            });
        }
        fetch(csDevtoolsMigrate.ajaxUrl, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (resp) {
                if (resp && resp.success) {
                    callback(null, resp.data);
                } else if (resp && resp.data) {
                    callback(resp.data);
                } else if (resp === -1 || resp === 0) {
                    callback('Session expired — please reload the page and try again.');
                } else {
                    callback('Server error. Please check you are logged in and try again.');
                }
            })
            .catch(function (err) {
                callback(err.message || 'Network error');
            });
    }

    function setStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.className = 'cs-status' + (type ? ' ' + type : '');
    }

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // =========================================================================
    //  Scan
    // =========================================================================

    function doScan() {
        scanBtn.disabled = true;
        setStatus(csDevtoolsMigrate.i18n.scanning, '');
        resultsContainer.style.display = 'block';
        resultsArea.innerHTML = '<p class="cs-loading"><span class="cs-spinner"></span> ' + csDevtoolsMigrate.i18n.scanning + '</p>';

        ajax('stodum_migrate_scan', {}, function (err, data) {
            scanBtn.disabled = false;

            if (err) {
                setStatus(csDevtoolsMigrate.i18n.scan_failed + ' ' + err, 'error');
                return;
            }

            scannedPosts = data.posts;

            if (data.total_posts === 0) {
                setStatus(csDevtoolsMigrate.i18n.no_blocks, 'success');
                resultsArea.innerHTML = '<p class="cs-migrate-hint">' + csDevtoolsMigrate.i18n.no_blocks_hint + '</p>';
                migrateAllBtn.disabled = true;
                return;
            }

            setStatus(csDevtoolsMigrate.i18n.found_blocks.replace('%1$s', data.total_blocks).replace('%2$s', data.total_posts), 'success');
            migrateAllBtn.disabled = false;
            renderResults(data);
        });
    }

    function renderResults(data) {
        var html = '';

        // Summary
        html += '<div class="cs-migrate-summary">';
        html += '<div class="cs-stat"><strong>' + data.total_posts + '</strong>' + csDevtoolsMigrate.i18n.posts_with_legacy + '</div>';
        html += '<div class="cs-stat"><strong>' + data.total_blocks + '</strong>' + csDevtoolsMigrate.i18n.total_blocks_mig + '</div>';
        html += '</div>';

        // Table
        html += '<table class="cs-migrate-table">';
        html += '<thead><tr>';
        html += '<th>' + csDevtoolsMigrate.i18n.post + '</th>';
        html += '<th style="width:90px;text-align:center;">' + csDevtoolsMigrate.i18n.blocks + '</th>';
        html += '<th style="width:80px;">' + csDevtoolsMigrate.i18n.status + '</th>';
        html += '<th style="width:200px;">' + csDevtoolsMigrate.i18n.actions + '</th>';
        html += '</tr></thead>';
        html += '<tbody>';

        data.posts.forEach(function (post) {
            html += '<tr id="cs-row-' + post.id + '">';
            html += '<td>';
            html += '<div class="cs-post-title"><a href="' + escHtml(post.view_url) + '" target="_blank">' + escHtml(post.title) + '</a></div>';
            html += '<div class="cs-post-meta">' + escHtml(post.date) + ' &middot; ' + escHtml(post.status) + ' &middot; ID: ' + post.id + '</div>';
            html += '</td>';
            html += '<td style="text-align:center;"><span class="cs-block-count">' + post.block_count + '</span></td>';
            html += '<td class="cs-status-cell">' + csDevtoolsMigrate.i18n.pending + '</td>';
            html += '<td class="cs-actions">';
            html += '<button class="button button-small cs-preview-btn" data-post-id="' + post.id + '">' + csDevtoolsMigrate.i18n.preview + '</button> ';
            html += '<button class="button button-primary button-small cs-single-migrate-btn" data-post-id="' + post.id + '">' + csDevtoolsMigrate.i18n.migrate + '</button>';
            html += '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';

        resultsArea.innerHTML = html;

        // Bind preview buttons
        resultsArea.querySelectorAll('.cs-preview-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openPreview(parseInt(this.getAttribute('data-post-id')));
            });
        });

        // Bind single migrate buttons
        resultsArea.querySelectorAll('.cs-single-migrate-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                migrateSingle(parseInt(this.getAttribute('data-post-id')), this);
            });
        });
    }

    // =========================================================================
    //  Preview Modal
    // =========================================================================

    function openPreview(postId) {
        modal.style.display = 'flex';
        modalTitle.textContent = csDevtoolsMigrate.i18n.loading_preview;
        modalBody.innerHTML = '<p class="cs-loading"><span class="cs-spinner"></span> ' + csDevtoolsMigrate.i18n.loading_block_prev + '</p>';
        modalMigrateBtn.setAttribute('data-post-id', postId);

        ajax('stodum_migrate_preview', { post_id: postId }, function (err, data) {
            if (err) {
                modalBody.innerHTML = '<p style="color:#d63638;">' + csDevtoolsMigrate.i18n.error + ' ' + escHtml(err) + '</p>';
                return;
            }

            modalTitle.textContent = data.title + ' (' + data.block_count + ' block' + (data.block_count !== 1 ? 's' : '') + ')';

            var html = '';
            data.blocks.forEach(function (block) {
                html += '<div class="cs-preview-block">';
                html += '<div class="cs-preview-block-header">';
                html += '<span class="cs-block-num">' + block.index + '</span>';
                html += '<span class="cs-block-lang">' + escHtml(block.language) + '</span>';
                html += '<span class="cs-block-lang" style="background:#f3e8ff;color:#7c3aed;">' + escHtml(block.type || 'wp:code') + '</span>';
                html += '<span class="cs-block-firstline">' + escHtml(block.first_line) + '</span>';
                html += '</div>';
                html += '<div class="cs-preview-diff">';
                html += '<div class="cs-preview-side cs-before">';
                html += '<div class="cs-preview-side-label">Before (wp:code)</div>';
                html += '<pre>' + escHtml(block.original) + '</pre>';
                html += '</div>';
                html += '<div class="cs-preview-side cs-after">';
                html += '<div class="cs-preview-side-label">After (stodum/code-block)</div>';
                html += '<pre>' + escHtml(block.converted) + '</pre>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            });

            modalBody.innerHTML = html;
        });
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // Modal close handlers
    modal.querySelector('.cs-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelectorAll('.cs-modal-close, .cs-modal-close-btn').forEach(function (el) {
        el.addEventListener('click', closeModal);
    });

    // Migrate from modal
    modalMigrateBtn.addEventListener('click', function () {
        var postId = parseInt(this.getAttribute('data-post-id'));
        if (!postId) return;

        this.disabled = true;
        this.textContent = csDevtoolsMigrate.i18n.migrating;

        ajax('stodum_migrate_single', { post_id: postId }, function (err, data) {
            modalMigrateBtn.disabled = false;
            modalMigrateBtn.innerHTML = '<span class="dashicons dashicons-yes-alt"></span> ' + csDevtoolsMigrate.i18n.migrate_this_post;

            if (err) {
                alert(csDevtoolsMigrate.i18n.migration_failed + ' ' + err);
                return;
            }

            closeModal();
            markRowMigrated(postId, data.blocks_migrated);
            setStatus(data.message, 'success');
        });
    });

    // =========================================================================
    //  Single Migrate (from table button)
    // =========================================================================

    function migrateSingle(postId, btn) {
        if (!confirm(csDevtoolsMigrate.i18n.confirm_migrate)) return;

        btn.disabled = true;
        btn.textContent = csDevtoolsMigrate.i18n.migrating;

        ajax('stodum_migrate_single', { post_id: postId }, function (err, data) {
            if (err) {
                btn.disabled = false;
                btn.textContent = csDevtoolsMigrate.i18n.migrate;
                alert(csDevtoolsMigrate.i18n.migration_failed + ' ' + err);
                return;
            }

            markRowMigrated(postId, data.blocks_migrated);
            setStatus(data.message, 'success');
        });
    }

    function markRowMigrated(postId, blockCount) {
        var row = document.getElementById('cs-row-' + postId);
        if (!row) return;

        row.classList.add('cs-migrated');

        var statusCell = row.querySelector('.cs-status-cell');
        if (statusCell) {
            statusCell.innerHTML = '<span class="cs-migrated-badge"><span class="dashicons dashicons-yes"></span> ' + csDevtoolsMigrate.i18n.done + '</span>';
        }

        var actionsCell = row.querySelector('.cs-actions');
        if (actionsCell) {
            actionsCell.innerHTML = '<a href="' + getViewUrl(postId) + '" target="_blank" class="button button-small">' + csDevtoolsMigrate.i18n.view_post + '</a>';
        }

        // Check if all rows are migrated
        var pending = document.querySelectorAll('.cs-single-migrate-btn');
        if (pending.length === 0) {
            migrateAllBtn.disabled = true;
            setStatus(csDevtoolsMigrate.i18n.all_migrated, 'success');
        }
    }

    function getViewUrl(postId) {
        for (var i = 0; i < scannedPosts.length; i++) {
            if (parseInt(scannedPosts[i].id, 10) === parseInt(postId, 10)) return scannedPosts[i].view_url;
        }
        return '#';
    }

    // =========================================================================
    //  Migrate All
    // =========================================================================

    function doMigrateAll() {
        var pending = document.querySelectorAll('.cs-single-migrate-btn');
        var count = pending.length;

        if (count === 0) {
            alert('No remaining posts to migrate.');
            return;
        }

        if (!confirm(csDevtoolsMigrate.i18n.confirm_all)) {
            return;
        }

        migrateAllBtn.disabled = true;
        migrateAllBtn.textContent = csDevtoolsMigrate.i18n.migrating;
        setStatus(csDevtoolsMigrate.i18n.migrating, '');

        var postIds = [];
        pending.forEach(function (el) {
            postIds.push(parseInt(el.getAttribute('data-post-id')));
        });

        ajax('stodum_migrate_all', { post_ids: postIds }, function (err, data) {
            migrateAllBtn.innerHTML = '<span class="dashicons dashicons-update"></span> ' + csDevtoolsMigrate.i18n.done;

            if (err) {
                migrateAllBtn.disabled = false;
                setStatus(csDevtoolsMigrate.i18n.migration_failed + ' ' + err, 'error');
                return;
            }

            setStatus(csDevtoolsMigrate.i18n.all_migrated, 'success');

            // Mark all rows as done
            data.details.forEach(function (detail) {
                var match = detail.match(/^#(\d+)/);
                if (match) {
                    markRowMigrated(parseInt(match[1]), 0);
                }
            });

            migrateAllBtn.disabled = true;
        });
    }

    // =========================================================================
    //  Event Bindings
    // =========================================================================

    scanBtn.addEventListener('click', doScan);
    migrateAllBtn.addEventListener('click', doMigrateAll);

    // Escape key closes modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            closeModal();
        }
    });

})();
