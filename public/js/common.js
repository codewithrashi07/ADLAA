/* Shared helpers: API client, toasts, formatting, mobile nav. */

const api = {
    async request(path, options = {}) {
        const response = await fetch(path, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok || !payload || payload.success === false) {
            const error = new Error((payload && payload.error) || `Request failed (${response.status})`);
            error.status = response.status;
            error.fields = payload && payload.fields;
            throw error;
        }

        return payload;
    },

    get(path) {
        return this.request(path);
    },

    post(path, body) {
        return this.request(path, { method: 'POST', body });
    },

    patch(path, body) {
        return this.request(path, { method: 'PATCH', body });
    },

    delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
};

function toast(message, type = '') {
    let host = document.querySelector('.toast-host');
    if (!host) {
        host = document.createElement('div');
        host.className = 'toast-host';
        document.body.appendChild(host);
    }

    const node = document.createElement('div');
    node.className = `toast ${type}`.trim();
    node.textContent = message;
    host.appendChild(node);

    setTimeout(() => node.remove(), 3800);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function formatDuration(seconds) {
    const total = Number(seconds) || 0;
    if (total < 60) return `${total} sec`;
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return rest ? `${minutes} min ${rest} sec` : `${minutes} min`;
}

function formatDate(iso) {
    if (!iso) return '--';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusClass(status) {
    return `status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;
}

function countUp(element, target, suffix = '') {
    const end = Number(target) || 0;
    const duration = 550;
    const start = performance.now();

    function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        element.textContent = `${Math.round(end * (1 - Math.pow(1 - progress, 3)))}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
}

document.addEventListener('DOMContentLoaded', initNav);
