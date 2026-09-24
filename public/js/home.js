/* Home page: live category catalogue, platform counters and the live analyser demo. */

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadHeroStats();
    initLiveDemo();
});

async function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;

    try {
        const { data } = await api.get('/api/catalog/categories');
        grid.innerHTML = data
            .map(
                (category) => `
            <a class="category-card" href="/form.html?category=${encodeURIComponent(category.id)}">
                <div class="icon">${escapeHtml(category.icon)}</div>
                <h3>${escapeHtml(category.name)}</h3>
                <p>${escapeHtml(category.description)}</p>
                <div class="meta">
                    <span>${category.serviceCount} services</span>
                    <span>~${category.averageDays} days</span>
                </div>
            </a>`
            )
            .join('');
    } catch {
        grid.innerHTML = '<div class="empty-state"><strong>Catalogue unavailable</strong>Start the server to load service categories.</div>';
    }
}

async function loadHeroStats() {
    const host = document.getElementById('heroStats');
    if (!host) return;

    try {
        const [{ data: stats }, { data: categories }] = await Promise.all([
            api.get('/api/stats'),
            api.get('/api/catalog/categories')
        ]);

        const services = categories.reduce((sum, category) => sum + category.serviceCount, 0);
        setStat('statApplications', stats.total);
        setStat('statServices', services);
        setStat('statResolution', stats.resolutionRate, '%');
        setStat('statAvgDays', stats.averages.estimatedDays);
    } catch {
        host.style.display = 'none';
    }
}

function setStat(id, value, suffix = '') {
    const element = document.getElementById(id);
    if (element) countUp(element, value, suffix);
}

function initLiveDemo() {
    const categorySelect = document.getElementById('demoCategory');
    const serviceInput = document.getElementById('demoService');
    if (!categorySelect || !serviceInput) return;

    api
        .get('/api/catalog/categories')
        .then(({ data }) => {
            categorySelect.innerHTML = data
                .map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`)
                .join('');
            categorySelect.value = 'financial';
            runPreview();
        })
        .catch(() => {
            categorySelect.innerHTML = '<option>Unavailable</option>';
        });

    let timer = null;
    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(runPreview, 320);
    };

    categorySelect.addEventListener('change', schedule);
    serviceInput.addEventListener('input', schedule);

    async function runPreview() {
        const badge = document.getElementById('demoDifficulty');
        const days = document.getElementById('demoDays');
        const message = document.getElementById('demoMessage');
        if (!badge) return;

        try {
            const { data } = await api.post('/api/applications/preview', {
                category: categorySelect.value,
                service: serviceInput.value,
                description: serviceInput.value
            });

            badge.textContent = data.difficulty;
            badge.className = `difficulty-badge ${data.difficulty.toLowerCase()}`;
            days.textContent = `~${data.estimatedDays} days`;
            message.textContent = data.matchedService
                ? `Matched "${data.matchedService}". ${data.requiredDocuments.length} document(s) usually required.`
                : 'Type a service name to see ADLAA match it against the catalogue.';
        } catch {
            message.textContent = 'Live analysis unavailable right now.';
        }
    }
}
