# Ads & Business integrations

Settings -> Integrations provides Meta Lead Ads, Google Ads lead forms and WhatsApp Cloud API in one section. Live accounts are not connected until an administrator supplies credentials and configures provider subscriptions.

## Access and secrets

Only tenant Super Admins can read/change connections or send templates. Sign out/in once after this release: new login tokens include the company ID; older or other-company tokens are rejected by integration administration routes. Each company's settings/events remain in its own database. A dedicated INTEGRATION_ENCRYPTION_KEY (64 hex characters) encrypts credentials with AES-256-GCM and tenant/provider authenticated context. Keep this key stable and include it in protected server backups. Access tokens and app secrets are never returned to the UI; blank inputs preserve saved values. Webhook verification keys are visible to the administrator for provider setup.

## Meta Ads

Enter Page ID, Page access token, app secret, API version and webhook verify token. Save/enable, then verify credentials. In the Meta developer app configure the callback URL from this screen, subscribe to Page leadgen and install/subscribe the app on the Page. Grant lead retrieval access/permissions and complete any required Meta app review. Use Meta's Lead Ads Testing Tool to check a real test delivery. The server checks HMAC signatures and configured Page IDs, retrieves field_data via the Graph API, and creates an unassigned CRM lead. Retries deduplicate by provider lead ID. A name and phone are required. Campaign management, spend reporting and historical bulk imports are outside this connection.

## Google Ads lead forms

Generate/save a webhook key and enable. Copy callback URL/key to the Google Ads lead-form webhook setup. Send test data from Google: valid is_test events verify the callback and do not create dummy leads. Real submissions map FULL_NAME/FIRST_NAME/LAST_NAME, PHONE_NUMBER, EMAIL, CITY, STATE, POSTAL_CODE to new unassigned leads. google_key is checked before import and lead IDs are deduplicated. No Google OAuth/API developer token is needed for this webhook workflow; campaign management/conversion uploads are separate integrations.

## WhatsApp Business Cloud API

Enter WABA ID, Phone Number ID, system-user access token, Meta app secret, API version and webhook verify token. Save/enable and verify phone credentials, then subscribe messages in the provider dashboard using the callback URL/key. Use approved templates with matching language and text body parameters. This composer does not support media/header/button parameters. Recipient must include country code without + and opt-in must be confirmed before sending. No messages are sent automatically by saving or verifying credentials. Accepted is the provider API's acceptance, not delivery; signed webhooks record sent/delivered/read/failed statuses separately. Incoming events store sender/type, not message content; this release is not a full chat inbox.

## Validation and limits

node --test solar_crm_backend/tests/integrations.test.js checks encryption isolation, HMAC rejection, admin/tenant access, Google test behavior, duplicate lead deliveries, Meta retrieval and WhatsApp consent using mocked external providers. Frontend lint and production build also run. Live provider tests require the customer's business accounts, app access and credentials. No real test messages or ad changes were made. Callback requests have a per-company/IP 300/minute in-process limit and provider fetch timeouts. Invalid imports return non-2xx for retry; provider dashboards should be monitored for failures. Integration activity shows the latest 30 successful import/message/delivery records. Back up integration tables with the existing tenant database backup process.

Primary documentation:
- https://developers.google.com/google-ads/webhook/docs/implementation
- https://developers.google.com/google-ads/webhook/docs/faq
- https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen
- https://developers.facebook.com/docs/whatsapp/cloud-api
