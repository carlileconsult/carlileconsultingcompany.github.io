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

        <div class="ai-advisor__cta">
          <a class="btn btn-primary" href="contact.html">Schedule Discovery Call</a>
        </div>

        <form class="ai-advisor__lead-form" novalidate>
          <h3>Get a tailored follow-up</h3>
          <label for="ai-name">Name</label>
          <input id="ai-name" name="name" autocomplete="name" required />
          <label for="ai-email">Work email</label>
          <input id="ai-email" name="email" type="email" autocomplete="email" required />
          <label for="ai-company">Company</label>
          <input id="ai-company" name="company" autocomplete="organization" required />
          <label for="ai-notes">Project notes (optional)</label>
          <textarea id="ai-notes" name="notes" rows="2"></textarea>
          <button type="submit" class="btn">Send details</button>
        </form>
      </section>
    `;
    document.body.appendChild(widget);

    const toggleButton = widget.querySelector('.ai-advisor__toggle');
    const panel = widget.querySelector('.ai-advisor__panel');
    const closeButton = widget.querySelector('.ai-advisor__close');
    const chatForm = widget.querySelector('.ai-advisor__chat-form');
    const leadForm = widget.querySelector('.ai-advisor__lead-form');
    const status = widget.querySelector('.ai-advisor__status');
    const response = widget.querySelector('.ai-advisor__response');

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

      try {
        const res = await fetch(`${apiBase}/advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, source: 'website_widget' })
        });

        if (!res.ok) throw new Error('Service unavailable');
        const data = await res.json();
        renderResponse(response, data);
        response.hidden = false;
        status.textContent = '';
      } catch (error) {
        status.textContent = 'We could not reach the advisor right now. Please try again or schedule a discovery call.';
      }
    });

    leadForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const submitButton = leadForm.querySelector('button[type="submit"]');
      const payload = {
        name: leadForm.name.value.trim(),
        email: leadForm.email.value.trim(),
        company: leadForm.company.value.trim(),
        notes: leadForm.notes.value.trim(),
        source: 'website_widget'
      };

      if (!payload.name || !payload.email || !payload.company) {
        status.textContent = 'Please complete name, work email, and company.';
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';

      try {
        const res = await fetch(`${apiBase}/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Lead submit failed');
        leadForm.reset();
        status.textContent = 'Thank you. We will follow up soon.';
      } catch (error) {
        status.textContent = 'Lead form could not be submitted right now. Please use the contact page.';
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Send details';
      }
    });
  }

  function renderResponse(container, data) {
    const summary = data.summary || 'Here are practical next steps based on your request.';
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    const risks = Array.isArray(data.risks) ? data.risks : [];

    const recommendationsHtml = recommendations.length
      ? `<h3>Recommended next steps</h3><ul>${recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    const risksHtml = risks.length
      ? `<h3>Implementation considerations</h3><ul>${risks.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    container.innerHTML = `
      <article>
        <h3>Advisor summary</h3>
        <p>${escapeHtml(summary)}</p>
        ${recommendationsHtml}
        ${risksHtml}
      </article>
    `;
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
