/* Multi-step application form driven by the ADLAA API. */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('applicationForm');
    if (!form) return;

    const steps = [document.getElementById('step1'), document.getElementById('step2'), document.getElementById('step3')];
    const progressSteps = document.querySelectorAll('.progress-step');
    const resultPanel = document.getElementById('resultPanel');
    const formShell = document.getElementById('formShell');

    const metrics = { startTime: Date.now(), clicks: 0, validationErrors: 0, backActions: 0, helpRequests: 0 };
    let currentStep = 1;

    form.addEventListener('click', () => { metrics.clicks += 1; });

    /* ---------- catalogue ---------- */

    const categorySelect = document.getElementById('category');
    const serviceList = document.getElementById('serviceOptions');

    api
        .get('/api/catalog/categories')
        .then(({ data }) => {
            categorySelect.innerHTML =
                '<option value="">Select a category</option>' +
                data.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join('');

            const preset = new URLSearchParams(location.search).get('category');
            if (preset && data.some((category) => category.id === preset)) {
                categorySelect.value = preset;
                loadServices(preset);
            }
        })
        .catch(() => toast('Could not load service categories.', 'error'));

    categorySelect.addEventListener('change', () => {
        loadServices(categorySelect.value);
        hideAssist();
    });

    async function loadServices(categoryId) {
        serviceList.innerHTML = '';
        const hint = document.getElementById('serviceHint');
        if (!categoryId) {
            hint.textContent = 'Select a category first to see suggestions.';
            return;
        }

        try {
            const { data } = await api.get(`/api/catalog/categories/${encodeURIComponent(categoryId)}/services`);
            serviceList.innerHTML = data.map((service) => `<option value="${escapeHtml(service.name)}"></option>`).join('');
            hint.textContent = `${data.length} common services in this category — start typing to autocomplete.`;
        } catch {
            hint.textContent = 'Suggestions unavailable, you can still type your service.';
        }
    }

    /* ---------- validation ---------- */

    const RULES = {
        name: (value) => (!value ? 'Please enter your full name.' : value.length < 2 ? 'Name looks too short.' : ''),
        age: (value) => {
            if (!value) return 'Please enter your age.';
            const age = Number(value);
            return !Number.isFinite(age) || age < 1 || age > 120 ? 'Please enter a valid age between 1 and 120.' : '';
        },
        location: (value) => (!value ? 'Please enter your city or district.' : ''),
        category: (value) => (!value ? 'Please select a service category.' : ''),
        service: (value) => (!value ? 'Please enter the required service.' : ''),
        description: (value) =>
            !value ? 'Please describe your requirement.' : value.length < 10 ? 'Please add a little more detail (at least 10 characters).' : ''
    };

    const STEP_FIELDS = { 1: ['name', 'age', 'location'], 2: ['category', 'service', 'description'] };

    function value(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    }

    function setFieldError(id, message) {
        const error = document.getElementById(`${id}Error`);
        const group = document.getElementById(id)?.closest('.form-group');
        if (error) error.textContent = message;
        if (group) group.classList.toggle('invalid', Boolean(message));
    }

    function validateStep(step) {
        let valid = true;
        STEP_FIELDS[step].forEach((id) => {
            const message = RULES[id](value(id));
            setFieldError(id, message);
            if (message) valid = false;
        });
        if (!valid) metrics.validationErrors += 1;
        return valid;
    }

    Object.keys(RULES).forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        element.addEventListener('blur', () => setFieldError(id, RULES[id](value(id))));
        element.addEventListener('input', () => {
            if (document.getElementById(`${id}Error`).textContent) setFieldError(id, RULES[id](value(id)));
        });
    });

    /* ---------- navigation ---------- */

    function showStep(step) {
        currentStep = step;
        steps.forEach((section, index) => section.classList.toggle('active', index === step - 1));
        progressSteps.forEach((node, index) => {
            node.classList.toggle('active', index === step - 1);
            node.classList.toggle('done', index < step - 1);
        });
        if (step === 3) updateSummary();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.getElementById('nextStep').addEventListener('click', () => {
        if (validateStep(1)) showStep(2);
    });

    document.getElementById('nextStep2').addEventListener('click', () => {
        if (validateStep(2)) showStep(3);
    });

    document.getElementById('prevStep').addEventListener('click', () => {
        metrics.backActions += 1;
        showStep(1);
    });

    document.getElementById('backToStep2').addEventListener('click', () => {
        metrics.backActions += 1;
        showStep(2);
    });

    function updateSummary() {
        const map = {
            summaryName: value('name'),
            summaryAge: value('age'),
            summaryLocation: value('location'),
            summaryCategory: categorySelect.options[categorySelect.selectedIndex]?.text || '—',
            summaryService: value('service'),
            summaryDescription: value('description')
        };
        Object.entries(map).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text || '—';
        });
    }

    /* ---------- smart assistance ---------- */

    const assistBtn = document.getElementById('smartHelpBtn');
    const assistOutput = document.getElementById('assistOutput');

    function hideAssist() {
        assistOutput.classList.remove('visible');
    }

    assistBtn.addEventListener('click', async () => {
        metrics.helpRequests += 1;

        if (!value('category')) {
            setFieldError('category', 'Please select a service category.');
            return;
        }

        assistBtn.disabled = true;
        assistBtn.textContent = 'Analysing…';

        try {
            const { data } = await api.post('/api/applications/preview', {
                category: value('category'),
                service: value('service'),
                description: value('description'),
                age: value('age')
            });

            assistOutput.innerHTML = `
                <div class="row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <span class="difficulty-badge ${data.difficulty.toLowerCase()}">${data.difficulty}</span>
                    <strong>~${data.estimatedDays} days</strong>
                </div>
                <p style="margin-top:10px;">${escapeHtml(data.resultMessage)}</p>
                <strong style="margin-top:12px;display:block;">Documents you will likely need</strong>
                <ul>${data.requiredDocuments.map((document_) => `<li>${escapeHtml(document_)}</li>`).join('')}</ul>
            `;
            assistOutput.classList.add('visible');
        } catch {
            toast('Assistance is unavailable right now.', 'error');
        } finally {
            assistBtn.disabled = false;
            assistBtn.textContent = 'Get Assistance';
        }
    });

    /* ---------- submission ---------- */

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateStep(1)) return showStep(1);
        if (!validateStep(2)) return showStep(2);

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        const payload = {
            name: value('name'),
            age: value('age'),
            location: value('location'),
            category: value('category'),
            service: value('service'),
            description: value('description'),
            metrics: {
                taskTime: Math.max(1, Math.round((Date.now() - metrics.startTime) / 1000)),
                clicks: metrics.clicks,
                validationErrors: metrics.validationErrors,
                backActions: metrics.backActions,
                helpRequests: metrics.helpRequests
            }
        };

        try {
            const { data } = await api.post('/api/applications', payload);
            localStorage.setItem('adlaaTrackingId', data.trackingId);
            renderResult(data);
        } catch (error) {
            if (error.fields) {
                Object.entries(error.fields).forEach(([field, message]) => setFieldError(field, message));
                showStep(STEP_FIELDS[1].includes(Object.keys(error.fields)[0]) ? 1 : 2);
                toast('Please correct the highlighted fields.', 'error');
            } else {
                toast(error.message || 'Could not submit your application.', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    });

    function renderResult(data) {
        formShell.style.display = 'none';
        document.querySelector('.progress-container').style.display = 'none';
        document.querySelector('.form-header').style.display = 'none';

        document.getElementById('trackingValue').textContent = data.trackingId;
        document.getElementById('resultService').textContent = data.matchedService || data.service;
        document.getElementById('resultCategory').textContent = data.categoryName;
        document.getElementById('resultEta').textContent = `${data.estimatedDays} days`;
        document.getElementById('resultConfidence').textContent = `${data.confidence}%`;
        document.getElementById('resultNextStep').textContent = data.nextStep;
        document.getElementById('resultMessage').textContent = data.resultMessage;

        const badge = document.getElementById('resultDifficulty');
        badge.textContent = data.difficulty;
        badge.className = `difficulty-badge ${data.difficulty.toLowerCase()}`;

        document.getElementById('scoreMeter').style.width = `${Math.min(100, Math.round((data.score / 14) * 100))}%`;
        document.getElementById('scoreLabel').textContent = `Complexity score ${data.score} / 14`;

        document.getElementById('docList').innerHTML = data.requiredDocuments
            .map((document_) => `<li>${escapeHtml(document_)}</li>`)
            .join('');

        document.getElementById('breakdownList').innerHTML = data.scoreBreakdown
            .map((item) => `<li><span>${escapeHtml(item.factor)}</span><b>+${item.points}</b></li>`)
            .join('');

        document.getElementById('planList').innerHTML = data.actionPlan
            .map(
                (item) => `<li><span class="step-no">${item.step}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div></li>`
            )
            .join('');

        document.getElementById('trackLink').href = `/track.html?id=${encodeURIComponent(data.trackingId)}`;

        resultPanel.classList.add('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.getElementById('copyTracking').addEventListener('click', async () => {
        const id = document.getElementById('trackingValue').textContent;
        try {
            await navigator.clipboard.writeText(id);
            toast('Tracking ID copied.', 'success');
        } catch {
            toast(`Your tracking ID is ${id}`);
        }
    });

    showStep(1);
});
