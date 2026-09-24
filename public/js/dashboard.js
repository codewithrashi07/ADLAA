/* Dashboard: live aggregate analytics plus an editable application table. */

const state = { page: 1, limit: 8, search: '', status: '', difficulty: '', statuses: [] };

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data } = await api.get('/api/catalog/statuses');
        state.statuses = data;
    } catch {
        state.statuses = ['Submitted', 'In Review', 'Action Needed', 'Approved', 'Rejected'];
    }

    bindToolbar();
    await refresh();
    setInterval(() => refresh({ silent: true }), 20000);
});

function bindToolbar() {
    const search = document.getElementById('searchInput');
    let timer = null;
    search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            state.search = search.value.trim();
            state.page = 1;
            loadTable();
        }, 300);
    });

    document.getElementById('statusFilter').addEventListener('change', (event) => {
        state.status = event.target.value;
        state.page = 1;
        loadTable();
    });

    document.getElementById('difficultyFilter').addEventListener('change', (event) => {
        state.difficulty = event.target.value;
        state.page = 1;
        loadTable();
    });

    document.getElementById('refreshBtn').addEventListener('click', () => refresh());

    document.getElementById('prevPage').addEventListener('click', () => {
        if (state.page > 1) {
            state.page -= 1;
            loadTable();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        state.page += 1;
        loadTable();
    });
}

async function refresh({ silent = false } = {}) {
    await Promise.all([loadStats(silent), loadTable(), loadLatest()]);
    document.getElementById('updatedAt').textContent = `Updated ${new Date().toLocaleTimeString('en-GB')}`;
}

/* ================= STATS ================= */

async function loadStats() {
    try {
        const { data } = await api.get('/api/stats');

        countUp(document.getElementById('kpiTotal'), data.total);
        countUp(document.getElementById('kpiResolution'), data.resolutionRate, '%');
        countUp(document.getElementById('kpiTime'), data.averages.taskTime);
        document.getElementById('kpiTimeSuffix').textContent = 'seconds average completion';
        countUp(document.getElementById('kpiDays'), data.averages.estimatedDays);

        renderDonut(data.byDifficulty, data.total);
        renderCategoryBars(data.byCategory);
        renderTrend(data.trend);
        renderStatusBars(data.byStatus, data.total);
        renderBehaviour(data.averages);
        renderLocations(data.topLocations);
    } catch {
        toast('Could not load analytics.', 'error');
    }
}

function renderDonut(byDifficulty, total) {
    const colours = { LOW: '#16a34a', MEDIUM: '#d97706', HIGH: '#dc2626' };
    const donut = document.getElementById('difficultyDonut');
    const legend = document.getElementById('difficultyLegend');

    if (!total) {
        donut.style.background = 'conic-gradient(#e2e8f0 0 100%)';
        document.getElementById('donutTotal').textContent = '0';
        legend.innerHTML = '<div><i style="background:#e2e8f0"></i>No data yet</div>';
        return;
    }

    let cursor = 0;
    const segments = Object.entries(byDifficulty).map(([key, count]) => {
        const start = (cursor / total) * 100;
        cursor += count;
        const end = (cursor / total) * 100;
        return `${colours[key]} ${start}% ${end}%`;
    });

    donut.style.background = `conic-gradient(${segments.join(', ')})`;
    document.getElementById('donutTotal').textContent = total;

    legend.innerHTML = Object.entries(byDifficulty)
        .map(
            ([key, count]) =>
                `<div><i style="background:${colours[key]}"></i>${key}<b>${count} (${Math.round((count / total) * 100)}%)</b></div>`
        )
        .join('');
}

function renderCategoryBars(byCategory) {
    const max = Math.max(1, ...byCategory.map((entry) => entry.count));
    document.getElementById('categoryChart').innerHTML = byCategory
        .map(
            (entry) => `
        <div class="bar-row">
            <span title="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(entry.count / max) * 100}%"></div></div>
            <b>${entry.count}</b>
        </div>`
        )
        .join('');
}

function renderStatusBars(byStatus, total) {
    const classes = {
        Submitted: '',
        'In Review': 'medium',
        'Action Needed': 'high',
        Approved: 'low',
        Rejected: 'high'
    };
    const max = Math.max(1, ...Object.values(byStatus));
    document.getElementById('statusChart').innerHTML = Object.entries(byStatus)
        .map(
            ([status, count]) => `
        <div class="bar-row">
            <span>${escapeHtml(status)}</span>
            <div class="bar-track"><div class="bar-fill ${classes[status] || ''}" style="width:${(count / max) * 100}%"></div></div>
            <b>${count}</b>
        </div>`
        )
        .join('');
    document.getElementById('statusTotal').textContent = total ? `${total} total` : '';
}

function renderTrend(trend) {
    const max = Math.max(1, ...trend.map((day) => day.count));
    document.getElementById('trendChart').innerHTML = trend
        .map(
            (day) => `
        <div class="spark-col" title="${day.date}">
            <em>${day.count}</em>
            <div class="spark-bar" style="height:${(day.count / max) * 78}%"></div>
            <small>${escapeHtml(day.label)}</small>
        </div>`
        )
        .join('');
}

function renderBehaviour(averages) {
    const rows = [
        ['Average clicks', averages.clicks],
        ['Validation errors', averages.validationErrors],
        ['Back navigations', averages.backActions],
        ['Assistance requests', averages.helpRequests],
        ['Analysis confidence', `${averages.confidence}%`]
    ];
    document.getElementById('behaviourList').innerHTML = rows
        .map(([label, val]) => `<div><span>${label}</span><strong>${val}</strong></div>`)
        .join('');
}

function renderLocations(locations) {
    const host = document.getElementById('locationList');
    if (!locations.length) {
        host.innerHTML = '<div><span>No submissions yet</span><strong>--</strong></div>';
        return;
    }
    host.innerHTML = locations
        .map((entry) => `<div><span>${escapeHtml(entry.location)}</span><strong>${entry.count}</strong></div>`)
        .join('');
}

/* ================= LATEST ================= */

async function loadLatest() {
    const host = document.getElementById('latestPanel');
    try {
        const trackingId = localStorage.getItem('adlaaTrackingId');
        const { data } = trackingId
            ? await api.get(`/api/applications/track/${encodeURIComponent(trackingId)}`).catch(() => api.get('/api/applications/latest'))
            : await api.get('/api/applications/latest');

        host.innerHTML = `
            <div class="summary-list">
                <div><span>Tracking ID</span><strong class="mono">${escapeHtml(data.trackingId)}</strong></div>
                <div><span>Applicant</span><strong>${escapeHtml(data.name)}</strong></div>
                <div><span>Service</span><strong>${escapeHtml(data.service)}</strong></div>
                <div><span>Category</span><strong>${escapeHtml(data.categoryName)}</strong></div>
                <div><span>Complexity</span><strong><span class="pill ${data.difficulty.toLowerCase()}">${data.difficulty}</span></strong></div>
                <div><span>Status</span><strong><span class="pill ${statusClass(data.status)}">${escapeHtml(data.status)}</span></strong></div>
                <div><span>Estimated time</span><strong>${data.estimatedDays} days</strong></div>
                <div><span>Completed in</span><strong>${formatDuration(data.metrics?.taskTime)}</strong></div>
            </div>
            <p style="margin-top:16px;color:var(--muted);font-size:14px;">${escapeHtml(data.resultMessage)}</p>
            <a class="btn btn-secondary btn-sm" style="margin-top:14px;" href="/track.html?id=${encodeURIComponent(data.trackingId)}">View full timeline</a>
        `;
    } catch {
        host.innerHTML =
            '<div class="empty-state"><strong>No applications yet</strong>Submit an application and it will appear here instantly.<div style="margin-top:16px"><a class="btn btn-primary btn-sm" href="/form.html">Start an application</a></div></div>';
    }
}

/* ================= TABLE ================= */

async function loadTable() {
    const body = document.getElementById('tableBody');

    try {
        const params = new URLSearchParams({ page: state.page, limit: state.limit });
        if (state.search) params.set('search', state.search);
        if (state.status) params.set('status', state.status);
        if (state.difficulty) params.set('difficulty', state.difficulty);

        const { data, pagination } = await api.get(`/api/applications?${params.toString()}`);

        if (!data.length) {
            body.innerHTML =
                '<tr><td colspan="7"><div class="empty-state"><strong>Nothing to show</strong>No applications match the current filters.</div></td></tr>';
        } else {
            body.innerHTML = data.map(rowTemplate).join('');
            bindRowActions();
        }

        document.getElementById('pageInfo').textContent = `Page ${pagination.page} of ${pagination.pages} · ${pagination.total} application(s)`;
        document.getElementById('prevPage').disabled = pagination.page <= 1;
        document.getElementById('nextPage').disabled = pagination.page >= pagination.pages;
    } catch {
        body.innerHTML = '<tr><td colspan="7"><div class="empty-state"><strong>Could not load applications</strong>Check that the server is running.</div></td></tr>';
    }
}

function rowTemplate(item) {
    return `
    <tr data-id="${escapeHtml(item.id)}">
        <td><span class="mono">${escapeHtml(item.trackingId)}</span></td>
        <td>
            <strong>${escapeHtml(item.name)}</strong>
            <div style="color:var(--muted);font-size:12.5px;">${escapeHtml(item.location)} · age ${escapeHtml(item.age)}</div>
        </td>
        <td>
            ${escapeHtml(item.service)}
            <div style="color:var(--muted);font-size:12.5px;">${escapeHtml(item.categoryName)}</div>
        </td>
        <td><span class="pill ${item.difficulty.toLowerCase()}">${item.difficulty}</span></td>
        <td>
            <select class="status-select" data-action="status">
                ${state.statuses
                    .map((status) => `<option value="${escapeHtml(status)}"${status === item.status ? ' selected' : ''}>${escapeHtml(status)}</option>`)
                    .join('')}
            </select>
        </td>
        <td style="white-space:nowrap;color:var(--muted);font-size:13px;">${formatDate(item.createdAt)}</td>
        <td>
            <div class="row-actions">
                <a class="btn btn-ghost btn-sm" href="/track.html?id=${encodeURIComponent(item.trackingId)}">View</a>
                <button class="icon-btn" data-action="delete" title="Delete application">✕</button>
            </div>
        </td>
    </tr>`;
}

function bindRowActions() {
    document.querySelectorAll('[data-action="status"]').forEach((select) => {
        select.addEventListener('change', async (event) => {
            const id = event.target.closest('tr').dataset.id;
            try {
                await api.patch(`/api/applications/${id}`, { status: event.target.value });
                toast(`Status updated to ${event.target.value}.`, 'success');
                loadStats();
                loadLatest();
            } catch {
                toast('Could not update status.', 'error');
                loadTable();
            }
        });
    });

    document.querySelectorAll('[data-action="delete"]').forEach((button) => {
        button.addEventListener('click', async (event) => {
            const row = event.target.closest('tr');
            if (!confirm('Delete this application permanently?')) return;
            try {
                await api.delete(`/api/applications/${row.dataset.id}`);
                toast('Application deleted.', 'success');
                refresh();
            } catch {
                toast('Could not delete application.', 'error');
            }
        });
    });
}
