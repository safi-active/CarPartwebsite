const EMAILJS_CONFIG = {
  publicKey: 'Al-C2Yy-0sUwwFOpM',
  serviceId: 'service_2ctmvj3',
  templateId: 'template_99nxv06'
};
const BUSINESS_EMAIL = 'safingendahayo@gmail.com';

const form = document.querySelector('#inquiry-form');
const statusMessage = document.querySelector('#form-status');
const submitButton = form?.querySelector('button[type="submit"]');
const defaultButtonText = 'Send inquiry';

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

function setFormStatus(message, type) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.className = `form-status ${type}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasEmailJsConfiguration() {
  return Object.values(EMAILJS_CONFIG).every((value) => value && !value.startsWith('YOUR_'));
}

function getBusinessEmail() {
  const mailtoLink = document.querySelector('.contact-details a[href^="mailto:"]');
  const extractedEmail = mailtoLink?.getAttribute('href')?.replace('mailto:', '').trim();
  return extractedEmail || BUSINESS_EMAIL;
}

function describeEmailJsError(error) {
  const details = error?.text || error?.message || 'Unknown EmailJS error';
  if (details.toLowerCase().includes('recipients address is empty')) {
    return 'EmailJS rejected the message because the recipient email is not configured in the EmailJS template. Set the template recipient to safingendahayo@gmail.com.';
  }
  if (details.toLowerCase().includes('invalid')) {
    return 'EmailJS rejected the message because the template or credentials are invalid.';
  }
  return `EmailJS error: ${details}`;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitButton?.disabled) return;

  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());
  const requiredFields = ['customer_name', 'customer_email', 'phone', 'vehicle', 'part_needed', 'message'];
  const missingField = requiredFields.some((field) => !String(values[field] || '').trim());

  if (missingField) {
    setFormStatus('Please complete all fields before sending your inquiry.', 'error');
    form.reportValidity();
    return;
  }

  if (!isValidEmail(String(values.customer_email).trim())) {
    setFormStatus('Please enter a valid email address.', 'error');
    form.elements.customer_email.focus();
    return;
  }

  if (!hasEmailJsConfiguration() || !window.emailjs || !getBusinessEmail()) {
    setFormStatus("We couldn't send your inquiry right now. Please try again or contact us directly.", 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  submitButton.firstChild.textContent = 'Sending inquiry...';
  setFormStatus('', '');

  const templateParams = {
    to_email: getBusinessEmail(),
    customer_name: String(values.customer_name).trim(),
    customer_email: String(values.customer_email).trim(),
    reply_to: String(values.customer_email).trim(),
    phone: String(values.phone).trim(),
    vehicle: String(values.vehicle).trim(),
    part_needed: String(values.part_needed).trim(),
    message: String(values.message).trim()
  };

  try {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams);
    form.reset();
    setFormStatus('Your inquiry has been sent successfully. We will contact you soon.', 'success');
  } catch (error) {
    const emailJsMessage = describeEmailJsError(error);
    setFormStatus(emailJsMessage, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.firstChild.textContent = defaultButtonText;
  }
});
