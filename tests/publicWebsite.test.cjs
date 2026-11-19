const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../solar_landing_page');
const routes = ['', 'solar-crm-software', 'solar-sales-crm', 'solar-project-management', 'how-it-works', 'downloads', 'start-trial', 'privacy-policy', 'terms-and-conditions'];
const read = route => fs.readFileSync(path.join(root, route ? `${route}.html` : 'index.html'), 'utf8');

test('canonical public pages keep crawlable metadata and clean links', () => {
  const descriptions = new Set();
  for (const route of routes) {
    const html = read(route);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, route);
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert(title && title.length >= 15 && title.length <= 80, route);
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert(description && description.length >= 60 && description.length <= 180, route);
    assert(!descriptions.has(description), `Duplicate description: ${route}`);
    descriptions.add(description);
    assert(html.includes(`rel="canonical" href="https://solops.cloud/${route}"`), route);
    assert(!/<a\b[^>]*href="[^"]*\.html/.test(html), route);
    assert(!html.includes('>?</button>'), `Damaged icon encoding: ${route}`);
    assert(html.includes('tel:+919024154995') && html.includes('mailto:digiink2505@gmail.com'), route);
  }
});

test('sitemap contains exactly the canonical public routes', () => {
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(locations.sort(), routes.map(r => `https://solops.cloud/${r}`).sort());
  assert(!locations.some(url => url.includes('#') || url.endsWith('.html')));
});

test('structured data remains valid and does not invent ratings or paid pricing', () => {
  const graphs = [];
  for (const route of routes) {
    for (const match of read(route).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      const schema = JSON.parse(match[1]);
      assert.equal(schema['@context'], 'https://schema.org');
      graphs.push(...(schema['@graph'] || [schema]));
    }
  }
  const app = graphs.find(item => item['@type'] === 'SoftwareApplication');
  assert(app && app.operatingSystem === 'Web');
  assert.equal(app.aggregateRating, undefined);
  assert.equal(app.offers, undefined);
  const faq = graphs.find(item => item['@type'] === 'FAQPage');
  assert(faq && faq.mainEntity.length >= 6);
  for (const item of faq.mainEntity) {
    assert(read('').includes(item.name), 'FAQ markup must match visible questions');
    assert(read('').includes(item.acceptedAnswer.text), 'FAQ markup must match visible answers');
  }
});

test('local navigation resolves to actual pages and fragment targets', () => {
  for (const route of routes) {
    for (const match of read(route).matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const url = new URL(match[1], `https://solops.cloud/${route}`);
      if (url.origin !== 'https://solops.cloud') continue;
      let file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (!path.extname(file)) file += '.html';
      const target = path.resolve(root, file);
      assert(target.startsWith(root + path.sep) && fs.existsSync(target), `${route}: ${url.href}`);
      if (url.hash) assert(fs.readFileSync(target, 'utf8').includes(`id="${url.hash.slice(1)}"`), `${route}: missing ${url.hash}`);
    }
  }
});

test('Android APK is not advertised as downloadable before a release is supplied', () => {
  const html = read('downloads');
  assert(/<button[^>]*disabled[^>]*>.*?Download Android APK/s.test(html));
  assert(!/<a[^>]*href="[^"]*\.apk/.test(html));
  assert(html.includes('download will be available here soon'));
});
