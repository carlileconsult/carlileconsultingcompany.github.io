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
          <div class="ai-advisor__header-actions">
            <button type="button" class="ai-advisor__clear">Start over</button>
            <button type="button" class="ai-advisor__close" aria-label="Close advisor">×</button>
          </div>
        </div>
        <div class="ai-advisor__chat">
          <div class="ai-advisor__messages" aria-live="polite"></div>

          <form class="ai-advisor__chat-form" novalidate>
            <label for="ai-message" class="sr-only">Your question</label>
            <textarea id="ai-message" name="message" rows="3" placeholder="Example: How can we reduce manual reporting work?" required></textarea>
            <button type="submit" class="btn btn-primary">Send</button>
          </form>
        </div>
      </section>
    `;
    document.body.appendChild(widget);

    const toggleButton = widget.querySelector('.ai-advisor__toggle');
    const panel = widget.querySelector('.ai-advisor__panel');
    const closeButton = widget.querySelector('.ai-advisor__close');
    const clearButton = widget.querySelector('.ai-advisor__clear');
    const chatForm = widget.querySelector('.ai-advisor__chat-form');
    const messageInput = chatForm.querySelector('textarea[name="message"]');
    const messagesContainer = widget.querySelector('.ai-advisor__messages');
    const submitButton = chatForm.querySelector('button[type="submit"]');
    const messages = [];
    const historyLimit = 8;
    let loading = false;

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

    clearButton.addEventListener('click', function () {
      messages.length = 0;
      loading = false;
      messageInput.value = '';
      renderMessages();
      messageInput.focus();
    });

    chatForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      submitMessage();
    });

    messageInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
      }
    });

    async function submitMessage() {
      if (loading) return;

      const message = messageInput.value.trim();
      if (!message) return;

      const history = getRecentConversationHistory(messages, historyLimit);

      messages.push({ role: 'user', text: message });
      messageInput.value = '';
      loading = true;
      renderMessages();

      try {
        const res = await fetch(`${apiBase}/advisor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history, source: 'website_widget' })
        });

        if (!res.ok) throw new Error(`Service unavailable (${res.status})`);
        const data = await res.json();
        messages.push({ role: 'advisor', text: getAdvisorText(data) });
      } catch (error) {
        console.warn('AI advisor request failed.', error);
        messages.push({ role: 'advisor', text: 'Sorry, I had trouble getting a response. Please try again.' });
      } finally {
        loading = false;
        renderMessages();
        messageInput.focus();
      }
    }

    function getRecentConversationHistory(chatMessages, limit) {
      return chatMessages.slice(-limit).map(function (chatMessage) {
        return {
          role: chatMessage.role === 'advisor' ? 'assistant' : 'user',
          content: chatMessage.text
        };
      });
    }

    function renderMessages() {
      const renderedMessages = messages.map(function (message) {
        return `
          <div class="ai-advisor__message ai-advisor__message--${message.role}">
            ${escapeHtml(message.text)}
          </div>
        `;
      }).join('');

      const loadingMessage = loading
        ? '<div class="ai-advisor__message ai-advisor__message--advisor">Thinking...</div>'
        : '';

      messagesContainer.innerHTML = renderedMessages + loadingMessage;
      scrollMessagesToBottom();

      if (submitButton) {
        submitButton.disabled = loading;
        submitButton.textContent = loading ? 'Sending...' : 'Send';
      }

      if (clearButton) {
        clearButton.disabled = loading || messages.length === 0;
      }
    }

    function scrollMessagesToBottom() {
      requestAnimationFrame(function () {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }

    renderMessages();

  }

  function getAdvisorText(data) {
    return getFirstText(
      data.response,
      data.userFacingResponse,
      data.summary
    ) || 'Sorry, I could not generate a response.';
  }

  function getFirstText() {
    for (const value of arguments) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
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
