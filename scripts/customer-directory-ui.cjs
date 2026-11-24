const { chromium } = require('../.tmp/project-ui/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.setDefaultTimeout(15000);
      const errors = [],
        writes = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem('token', 'qa');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 1,
            role_id: 1,
            role_name: 'Admin',
            full_name: 'QA Admin',
            is_password_changed: 1,
          })
        );
        localStorage.setItem('solar_crm_tour_done', 'true');
      });
      const invoice = {
        key: 'invoice-1',
        invoice_id: 1,
        invoice_number: 'QA-INV-1',
        amount: 100000,
        credit_notes: 0,
        final_amount: 100000,
        payments_received: 40000,
        loan_sanctioned: 0,
        loan_disbursed: 0,
        total_received: 40000,
        refunds_paid: 0,
        balance_due: 60000,
        refund_due: 0,
        next_due_date: '2026-11-20',
        days_overdue: 4,
        milestones: [],
      };
      const ledger = {
        balance_due: 60000,
        refund_due: 20000,
        invoice_count: 2,
        has_financial_record: true,
        loan_awaited: 0,
        next_due_date: '2026-11-20',
        days_overdue: 4,
        invoices: [invoice],
      };
      const customer = {
        id: 1,
        customer_name: 'QA Customer',
        customer_code: 'QA-1',
        mobile_number: '9876543210',
        solar_requirement: 'Residential',
        ledger,
        collection_owner_name: 'QA Sales',
        followup_status: 'Not contacted',
      };
      await page.route('**/*', (route) => {
        const u = new URL(route.request().url());
        if (!u.pathname.startsWith('/api'))
          return u.origin === 'http://127.0.0.1:4187' ? route.continue() : route.abort();
        const p = u.pathname;
        if (route.request().method() !== 'GET') {
          writes.push({ p, body: route.request().postDataJSON() });
          return route.fulfill({ json: { success: true } });
        }
        let data = [];
        if (p.endsWith('/directory'))
          data = {
            rows: [customer],
            totals: { customers: 1, outstanding: 60000, refund_due: 20000 },
            cards: {
              outstanding: 60000,
              refund_due: 20000,
              outstanding_customers: 1,
              refund_customers: 1,
            },
            options: {
              owners: [{ id: 3, full_name: 'QA Sales' }],
              sources: ['Referral'],
              stages: ['Installation In Progress'],
            },
            pages: 1,
            today: '2026-11-24',
          };
        if (p.endsWith('/collections')) data = { ledger, activity: [] };
        if (p.endsWith('/subscription/status')) data = { status: 'Active', plan: { max_users: 0 } };
        return route.fulfill({ json: { success: true, data } });
      });
      console.log('UI width', width);
      await page.goto('http://127.0.0.1:4187/customers');
      console.log('loaded');
      await page
        .getByRole('heading', { name: 'Customer directory' })
        .waitFor({ timeout: 20000 })
        .catch(async (e) => {
          console.log(
            'UI errors',
            errors,
            'body',
            (await page.locator('body').innerText()).slice(0, 800)
          );
          throw e;
        });
      await page.getByRole('button', { name: /Outstanding to receive.*Click to filter/ }).click();
      await page.waitForURL(/balance=outstanding/);
      await page.getByRole('button', { name: 'Breakdown', exact: true }).click();
      await page.getByText('Invoice & payment breakdown', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Record payment', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByLabel(/Amount/)
        .fill('10000');
      assert.equal(
        await page
          .getByRole('dialog')
          .getByLabel(/Amount/)
          .inputValue(),
        '10,000'
      );
      await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
      await page.locator('.MuiDialog-root').waitFor({ state: 'hidden' });
      assert.equal(writes.find((w) => w.p.endsWith('/collection-payment')).body.amount, '10000');
      await page.getByRole('button', { name: 'Close breakdown' }).click();
      await page.getByRole('button', { name: 'Add note', exact: true }).click();
      await page
        .getByLabel('Discussion / follow-up note')
        .fill('Customer called; follow up tomorrow.');
      await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
      await page.locator('.MuiDialog-root').waitFor({ state: 'hidden' });
      assert(writes.some((w) => w.body.action === 'note'));
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2
      );
      assert.equal(overflow, false, 'Page overflow at ' + width);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: '.tmp/customer-directory-' + width + '.png', fullPage: true });
      await page.close();
    }
    console.log(
      'PASS: desktop/mobile directory, clickable card URL filters, breakdown, formatted payment, note save and no page overflow.'
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
