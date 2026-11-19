(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let edited = false,
    config = null,
    widget = null,
    token = '',
    verifiedEmail = '',
    resendAt = 0,
    busy = false;
  const show = (message) => {
    $('status').textContent = message;
  };
  function step(name) {
    for (const [form, value] of [
      ['emailForm', 'email'],
      ['verifyForm', 'verify'],
      ['signupForm', 'business'],
      ['success', 'success'],
    ])
      $(form).hidden = value !== name;
    for (const [id, value] of [
      ['stepEmail', 'email'],
      ['stepVerify', 'verify'],
      ['stepBusiness', 'business'],
    ]) {
      if (value === name) $(id).setAttribute('aria-current', 'step');
      else $(id).removeAttribute('aria-current');
    }
    show('');
  }
  function buttons() {
    const wait = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
    $('sendCode').disabled = busy || !config || wait > 0 || (config.human_verification && !token);
    $('resendCode').disabled = busy || wait > 0;
    $('resendCode').textContent = wait ? 'Resend in ' + wait + 's' : 'Resend code';
    $('sendCode').textContent = wait ? 'Send again in ' + wait + 's' : 'Send verification code';
    $('createWorkspace').disabled = busy || !$('agree').checked;
  }
  setInterval(buttons, 1000);
  async function api(path, body) {
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 180000);
    try {
      const response = await fetch('/api/public/trial/' + path, {
        method: body ? 'POST' : 'GET',
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw Error(result.message || 'Unable to continue. Please try again.');
      return result.data;
    } finally {
      clearTimeout(timeout);
    }
  }
  function error(e) {
    show(
      e.name === 'AbortError'
        ? 'The request took longer than expected. Check your email before retrying, or contact our team.'
        : e.message
    );
  }
  function resetHuman() {
    token = '';
    if (widget !== null && window.turnstile) window.turnstile.reset(widget);
    buttons();
  }
  function editEmail() {
    if (busy) return;
    verifiedEmail = '';
    $('code').value = '';
    step('email');
    resetHuman();
    $('email').focus();
  }
  $('email').addEventListener('blur', () => {
    const value = $('email').value.trim();
    if (value && !value.includes('@')) $('email').value = value + '@gmail.com';
  });
  $('business_name').addEventListener('input', () => {
    if (!edited)
      $('subdomain').value = $('business_name')
        .value.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 30);
  });
  $('subdomain').addEventListener('input', () => {
    edited = true;
    $('subdomain').value = $('subdomain')
      .value.toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  });
  $('agree').addEventListener('change', buttons);
  $('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !config) return;
    busy = true;
    buttons();
    show('Sending your code...');
    try {
      const result = await api('request-code', { email: $('email').value, turnstile_token: token });
      resendAt = Date.now() + result.resend_after * 1000;
      verifiedEmail = '';
      step('verify');
      $('codeHelp').textContent =
        'If available for registration, a code has been sent to ' +
        result.email +
        '. Existing workspace owners receive sign-in guidance instead.';
      $('code').focus();
    } catch (e) {
      error(e);
    } finally {
      busy = false;
      resetHuman();
    }
  });
  $('verifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    $('verifyCode').disabled = true;
    buttons();
    show('Verifying your email...');
    try {
      const result = await api('verify-code', { code: $('code').value.trim() });
      verifiedEmail = result.email;
      $('verifiedEmail').textContent = verifiedEmail;
      $('code').value = '';
      step('business');
      $('business_name').focus();
    } catch (e) {
      error(e);
    } finally {
      busy = false;
      $('verifyCode').disabled = false;
      buttons();
    }
  });
  $('resendCode').addEventListener('click', () => {
    if (Date.now() < resendAt || busy) return;
    step('email');
    resetHuman();
    show('Confirm your email, then send a new code. Any earlier code will stop working.');
    $('email').focus();
  });
  $('editEmail').addEventListener('click', editEmail);
  $('changeVerifiedEmail').addEventListener('click', editEmail);
  $('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !$('agree').checked || !verifiedEmail) return;
    busy = true;
    buttons();
    $('changeVerifiedEmail').disabled = true;
    show('Creating your company workspace. Please keep this page open...');
    const data = Object.fromEntries(new FormData(e.target));
    data.email = verifiedEmail;
    data.agree = true;
    data.policy_version = '2026-11-19';
    try {
      const result = await api('complete', data);
      success(result);
    } catch (e) {
      error(e);
    } finally {
      busy = false;
      $('changeVerifiedEmail').disabled = false;
      buttons();
    }
  });
  function success(result) {
    step('success');
    for (const id of ['workspaceLink', 'openWorkspace']) $(id).href = result.workspace_url;
    $('workspaceLink').textContent = result.workspace_url;
    $('username').textContent = result.username;
    $('password').textContent =
      result.temporary_password ||
      'Already created. Use the login details from your email, or contact support.';
    $('expires').textContent =
      new Date(result.trial_ends_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' (your local time)';
    $('mailStatus').textContent = result.already_created
      ? 'Your workspace was already created. Check your email for login details; contact us if you cannot find them.'
      : result.email_sent
        ? 'Your login details have also been sent to your verified email.'
        : 'Your workspace is ready, but the welcome email could not be sent. Save these login details securely or contact our team.';
    $('openWorkspace').focus();
  }
  async function init() {
    try {
      config = await api('config');
      if (config.human_verification) {
        await new Promise((resolve, reject) => {
          window.solopsHumanReady = resolve;
          const script = document.createElement('script');
          script.src =
            'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=solopsHumanReady&render=explicit';
          script.async = true;
          script.onerror = () =>
            reject(
              Error('Human verification could not load. Please check your connection and retry.')
            );
          document.head.append(script);
        });
        widget = window.turnstile.render('#humanCheck', {
          sitekey: config.site_key,
          action: 'trial_signup',
          size: window.innerWidth < 370 ? 'compact' : 'flexible',
          callback: (value) => {
            token = value;
            buttons();
          },
          'expired-callback': () => {
            token = '';
            buttons();
          },
          'error-callback': () => {
            token = '';
            buttons();
            show('Human verification could not complete. Please retry.');
          },
        });
      }
      const state = await api('session');
      if (state.workspace) {
        success(state.workspace);
      } else if (state.email) {
        $('email').value = state.email;
        if (state.verified) {
          verifiedEmail = state.email;
          $('verifiedEmail').textContent = state.email;
          step('business');
        } else {
          step('verify');
          $('codeHelp').textContent =
            'Enter the code sent to ' + state.email + '. Codes expire in 10 minutes.';
        }
      }
      buttons();
    } catch (e) {
      config = null;
      buttons();
      error(e);
    }
  }
  init();
})();
