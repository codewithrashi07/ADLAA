/* Tracking page: look up an application by its ADLAA tracking ID. */

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('trackInput');
    const form = document.getElementById('trackForm');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        lookup(input.value.trim());
    });

    const preset = new URLSearchParams(location.search).get('id') || localStorage.getItem('adlaaTrackingId');
    if (preset) {
        input.value = preset;
        lookup(preset);
    }
});

async function lookup(trackingId) {
    const host = document.getElementById('trackResult');
    if (!trackingId) {
        host.innerHTML = '<div class="empty-state"><strong>Enter a tracking ID</strong>It looks like ADL-XXXX-XXXXXX and was shown when you submitted.</div>';
        return;
    }

    host.innerHTML = '<div class="empty-state">Looking up your application…</div>';

    try {
        const { data } = await api.get(`/api/applications/track/${encodeURIComponent(trackingId)}`);
        localStorage.setItem('adlaaTrackingId', data.trackingId);
        render(data, host);
    } catch (error) {
        host.innerHTML = `<div class="empty-state"><strong>Not found</strong>${escapeHtml(error.message)}</div>`;
    }
}

function render(data, host) {
    host.innerHTML = `
    <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center;">
            <div>
                <span class="mono">${escapeHtml(data.trackingId)}</span>
                <h2 style="font-size:24px;margin-top:6px;">${escapeHtml(data.service)}</h2>
                <p style="color:var(--muted);">${escapeHtml(data.categoryName)} · submitted ${formatDate(data.createdAt)}</p>
            </div>
            <div style="text-align:right;display:grid;gap:8px;justify-items:end;">
                <span class="pill ${statusClass(data.status)}">${escapeHtml(data.status)}</span>
                <span class="difficulty-badge ${data.difficulty.toLowerCase()}">${data.difficulty}</span>
            </div>
        </div>
    </div>

    <div class="result-grid">
        <div class="card">
            <h3>Application Summary</h3>
            <div class="summary-list">
                <div><span>Applicant</span><strong>${escapeHtml(data.name)}</strong></div>
                <div><span>Age</span><strong>${escapeHtml(data.age)}</strong></div>
                <div><span>Location</span><strong>${escapeHtml(data.location)}</strong></div>
                <div><span>Requirement</span><strong>${escapeHtml(data.description)}</strong></div>
                <div><span>Estimated time</span><strong>${data.estimatedDays} days</strong></div>
                <div><span>Analysis confidence</span><strong>${data.confidence}%</strong></div>
            </div>
        </div>

        <div class="card">
            <h3>Required Documents</h3>
            <ul class="doc-list">${data.requiredDocuments.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            <p style="margin-top:16px;color:var(--muted);font-size:14px;">${escapeHtml(data.resultMessage)}</p>
        </div>

        <div class="card">
            <h3>Progress Timeline</h3>
            <ul class="timeline">
                ${(data.timeline || [])
                    .slice()
                    .reverse()
                    .map(
                        (entry) =>
                            `<li><strong>${escapeHtml(entry.status)}</strong><small>${formatDate(entry.at)}</small><p>${escapeHtml(entry.note)}</p></li>`
                    )
                    .join('')}
            </ul>
        </div>

        <div class="card">
            <h3>Your Action Plan</h3>
            <ul class="plan-list">
                ${(data.actionPlan || [])
                    .map(
                        (item) =>
                            `<li><span class="step-no">${item.step}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div></li>`
                    )
                    .join('')}
            </ul>
        </div>
    </div>`;
}
