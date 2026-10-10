'use strict';

/* =========================================================
   Мобільне меню
   ========================================================= */
(function initMenu() {
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('mobile-menu');
  if (!burger || !menu) return;

  const desktopQuery = window.matchMedia('(min-width: 768px)');

  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    menu.hidden = !open;
  }

  burger.addEventListener('click', function () {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  // Закриваємо меню після переходу за посиланням
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  // Esc закриває меню й повертає фокус на кнопку
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });

  // Якщо вікно розширили до планшета — меню більше не потрібне
  desktopQuery.addEventListener('change', function (event) {
    if (event.matches) setOpen(false);
  });
})();

/* =========================================================
   Форма заявки
   ========================================================= */
(function initForm() {
  const form = document.getElementById('request-form');
  if (!form) return;

  const status = document.getElementById('form-status');
  const submitButton = form.querySelector('.form__submit');

  // Правила перевірки для кожного поля: повертають текст помилки або ''
  const validators = {
    phone: function (value) {
      if (value === '') return 'Вкажіть номер телефону.';
      if (!/^\+?[\d\s()-]+$/.test(value)) {
        return 'Номер може містити лише цифри, пробіли, дужки, дефіс і «+» на початку.';
      }
      const digits = value.replace(/\D/g, '');
      if (!value.startsWith('+')) return 'Почніть номер із коду країни, наприклад +380.';
      if (digits.length < 10 || digits.length > 15) {
        return 'Номер із кодом країни має містити від 10 до 15 цифр.';
      }
      return '';
    },
    instagram: function (value) {
      if (value === '') return ''; // поле необов'язкове
      if (!/^@?[A-Za-z0-9._]{1,30}$/.test(value)) {
        return 'Нікнейм Instagram: до 30 латинських літер, цифр, крапок і «_».';
      }
      return '';
    }
  };

  function validateField(input) {
    const rule = validators[input.name];
    if (!rule) return true;

    const message = rule(input.value.trim());
    const errorEl = document.getElementById(input.id + '-error');

    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) errorEl.textContent = message;
      return false;
    }

    input.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  // Перевіряємо поле, коли користувач з нього виходить,
  // а після першої помилки — одразу під час введення
  Object.keys(validators).forEach(function (name) {
    const input = form.elements[name];
    if (!input) return;

    input.addEventListener('blur', function () {
      if (input.value.trim() !== '') validateField(input);
    });

    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      status.hidden = true;
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    let firstInvalid = null;
    Object.keys(validators).forEach(function (name) {
      const input = form.elements[name];
      if (input && !validateField(input) && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      status.hidden = true;
      firstInvalid.focus();
      return;
    }

    sendRequest();
  });

  function showStatus(type, message) {
    status.className = 'form__status form__status--' + type;
    status.textContent = message;
    status.hidden = false;
  }

  // Надсилаємо заявку у Formspree (адреса — в атрибуті action форми)
  async function sendRequest() {
    const data = new FormData(form);
    data.set('phone', data.get('phone').trim());
    data.set('instagram', data.get('instagram').trim());
    data.append('_subject', 'Нова заявка з сайту');

    submitButton.disabled = true;
    submitButton.textContent = 'Надсилаємо…';
    status.hidden = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        form.reset();
        showStatus('success', 'Дякуємо! Заявку надіслано, ми зв\'яжемося з вами найближчим часом.');
        return;
      }

      // Formspree повертає опис помилки у JSON
      const result = await response.json().catch(function () { return {}; });
      const details = result.errors && result.errors.length
        ? ' (' + result.errors.map(function (e) { return e.message; }).join(', ') + ')'
        : '';
      showStatus('error', 'Не вдалося надіслати заявку' + details + '. Спробуйте ще раз трохи пізніше.');
    } catch (error) {
      showStatus('error', 'Не вдалося надіслати заявку: перевірте підключення до інтернету й спробуйте ще раз.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Залишити заявку';
    }
  }
})();
