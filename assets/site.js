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
})();
