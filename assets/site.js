(function () {
  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('mobile-open');
    });
  }

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');

      try {
        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Sending...';
        }

        const response = await fetch(form.action, {
          method: form.method || 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (response.ok) {
          window.location.href = '/thanks.html';
          return;
        }

        alert('There was a problem submitting the form. Please email support@carlileconsultingcompany.com.');
      } catch (error) {
        alert('Network error. Please email support@carlileconsultingcompany.com.');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = 'Send project request';
        }
      }
    });
  }

  initAiAdvisorWidget();

  function initAiAdvisorWidget() {
    const apiBase = window.CARLILE_AI_API_BASE || 'https://carlile-ai-advisor-api.onrender.com/api';
    const widget = document.createElement('aside');
    widget.className = 'ai-advisor';
    widget.innerHTML = `
      <button type="button" class="ai-advisor__toggle" aria-expanded="false" aria-controls="ai-advisor-panel">
        Ask Carlile AI Advisor
      </button>
      <section id="ai-advisor-panel" class="ai-advisor__panel" hidden>
        <div class="ai-advisor__header">
          <h2>Carlile AI Advisor</h2>
          <button type="button" class="ai-advisor__close" aria-label="Close advisor">×</button>
        </div>
        <p class="ai-advisor__intro">Describe your goals or challenges to get practical guidance and next steps.</p>

        <form class="ai-advisor__chat-form" novalidate>
          <label for="ai-message">Your question</label>
          <textarea id="ai-message" name="message" rows="3" placeholder="Example: How can we reduce manual reporting work?" required></textarea>
          <button type="submit" class="btn btn-primary">Get Advice</button>
        </form>

        <div class="ai-advisor__status" aria-live="polite"></div>
        <div class="ai-advisor__response" hidden></div>

        <div class="ai-advisor__cta" hidden>
          <a class="btn" href="discovery.html">Schedule a Discovery Call</a>
        </div>
      </section>
    `;
    document.body.appendChild(widget);

    const toggleButton = widget.querySelector('.ai-advisor__toggle');
    const panel = widget.querySelector('.ai-advisor__panel');
    const closeButton = widget.querySelector('.ai-advisor__close');
    const chatForm = widget.querySelector('.ai-advisor__chat-form');
    const status = widget.querySelector('.ai-advisor__status');
    const response = widget.querySelector('.ai-advisor__response');
    const cta = widget.querySelector('.ai-advisor__cta');

    function openPanel() {
      panel.hidden = false;
      toggleButton.setAttribute('aria-expanded', 'true');
      widget.classList.add('is-open');
    }

    function closePanel() {
      panel.hidden = true;
      toggleButton.setAttribute('aria-expanded', 'false');
      widget.classList.remove('is-open');
    }

    toggleButton.addEventListener('click', function () {
      if (panel.hidden) openPanel();
      else closePanel();
    });

    closeButton.addEventListener('click', closePanel);

    chatForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const message = chatForm.message.value.trim();
      if (!message) return;

      status.textContent = 'Thinking...';
      response.hidden = true;
      cta.hidden = true;

      try {
        const res = await fetch(`${apiBase}/advisor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, source: 'website_widget' })
        });

        if (!res.ok) throw new Error(`Service unavailable (${res.status})`);
        const data = await res.json();
        renderResponse(response, data);
        response.hidden = false;
        status.textContent = '';
        cta.hidden = false;
      } catch (error) {
        console.warn('AI advisor request failed.', error);
        status.textContent = 'Sorry, the AI Advisor is temporarily unavailable. Please try again in a moment or schedule a discovery call.';
      }
    });

  }

  function renderResponse(container, data) {
    const summary = getFirstText(data.summary, data.responseSummary, data.message) || 'Here are practical next steps based on your request.';
    const opportunityArea = getFirstText(data.opportunityArea);
    const recommendedNextStep = getFirstText(data.recommendedNextStep);
    const consultingFit = getFirstText(data.consultingFit);
    const callToAction = getFirstText(data.callToAction);
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    const risks = Array.isArray(data.risks) ? data.risks : [];
    const followUpQuestions = normalizeList(data.followUpQuestions);

    const recommendationsHtml = recommendations.length
      ? `<h3>Recommended next steps</h3><ul>${recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    const risksHtml = risks.length
      ? `<h3>Implementation considerations</h3><ul>${risks.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    const opportunityAreaHtml = opportunityArea
      ? `<h3>Opportunity area</h3><p>${escapeHtml(opportunityArea)}</p>`
      : '';

    const nextStepHtml = recommendedNextStep
      ? `<h3>Recommended next step</h3><p>${escapeHtml(recommendedNextStep)}</p>`
      : '';

    const consultingFitHtml = consultingFit
      ? `<h3>Consulting fit</h3><p>${escapeHtml(consultingFit)}</p>`
      : '';

    const followUpQuestionsHtml = followUpQuestions.length
      ? `<h3>Helpful follow-up questions</h3><ul>${followUpQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    const callToActionHtml = callToAction
      ? `<h3>Suggested action</h3><p>${escapeHtml(callToAction)}</p>`
      : '';

    container.innerHTML = `
      <article>
        <h3>Advisor summary</h3>
        <p>${escapeHtml(summary)}</p>
        ${opportunityAreaHtml}
        ${nextStepHtml}
        ${consultingFitHtml}
        ${recommendationsHtml}
        ${risksHtml}
        ${followUpQuestionsHtml}
        ${callToActionHtml}
      </article>
    `;
  }

  function getFirstText() {
    for (const value of arguments) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  }

  function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
