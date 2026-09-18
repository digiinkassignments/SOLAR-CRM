# Solar CRM — Local se VPS Deployment Guide
## Digiink Solutions — Internal Document

---

## Abhi Tak Kya Kiya (Local)

```
✅ solar_crm_backend   — Node.js + Express API
✅ solar_crm_frontend  — React (Client ka CRM)
✅ digiink_admin       — React (Super Admin Console)
✅ db_digiink_master   — Master DB (clients, plans, payments)
✅ db_client_XXX       — Har client ka alag DB
✅ Subscription layer  — Grace/Lock/Delete cron jobs
✅ Super Admin Console — Client create, payments confirm
```

---

## VPS Pe Kya Chahiye

```
VPS Minimum:
- RAM: 2GB (4GB recommended for 100 clients)
- Storage: 40GB SSD
- OS: Ubuntu 22.04 LTS
- Provider: DigitalOcean / Hetzner / Hostinger VPS

Domain:
- solarcrm.com (ya jo bhi domain lena hai)
- Subdomains: *.solarcrm.com (wildcard) — client1.solarcrm.com, client2.solarcrm.com
- admin.solarcrm.com — Super Admin Console
```

---

## Step 1 — VPS Kharido aur Connect Karo

```bash
# Local machine se SSH karo
ssh root@YOUR_VPS_IP

# Update karo
apt update && apt upgrade -y
```

---

## Step 2 — Node.js Install Karo

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Check karo
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

## Step 3 — MySQL Install Karo

```bash
apt install -y mysql-server

# Secure karo
mysql_secure_installation
# Root password set karo, baaki sab Yes

# MySQL mein login karo
mysql -u root -p

# Master DB create karo
CREATE DATABASE db_digiink_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# SQL import karo (file upload ke baad)
mysql -u root -p db_digiink_master < db_digiink_master.sql
```

---

## Step 4 — PM2 Install Karo (Process Manager)

```bash
npm install -g pm2

# PM2 ko system startup pe auto-start karo
pm2 startup
# Jo command aaye wo copy karke run karo
```

---

## Step 5 — Nginx Install Karo

```bash
apt install -y nginx

# Check karo
systemctl status nginx
```

---

## Step 6 — Code VPS Pe Upload Karo

### Option A — Git (Recommended)
```bash
# VPS pe
apt install -y git
cd /var/www
git clone https://github.com/YOUR_USERNAME/solar_crm_backend.git
git clone https://github.com/YOUR_USERNAME/solar_crm_frontend.git
git clone https://github.com/YOUR_USERNAME/digiink_admin.git
```

### Option B — Direct Upload (FileZilla / SCP)
```bash
# Local machine se
scp -r solar_crm_backend root@YOUR_VPS_IP:/var/www/
scp -r solar_crm_frontend root@YOUR_VPS_IP:/var/www/
scp -r digiink_admin root@YOUR_VPS_IP:/var/www/
```

---

## Step 7 — Backend Setup Karo

```bash
cd /var/www/solar_crm_backend
npm install

# .env file banao
nano .env
```

**.env content (VPS ke liye):**
```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=solar_crm

JWT_SECRET=koi_bhi_strong_random_string_yahan
JWT_EXPIRES_IN=30d

SUPER_ADMIN_JWT_SECRET=alag_strong_secret_yahan

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM="Solar CRM <your_email@gmail.com>"
```

```bash
# PM2 se start karo
pm2 start server.js --name solar-crm-backend
pm2 save
```

---

## Step 8 — Frontend Build Karo

### Solar CRM Frontend:
```bash
cd /var/www/solar_crm_frontend

# .env banao
nano .env
```
```env
VITE_API_BASE_URL=https://api.solarcrm.com/api
```
```bash
npm install
npm run build
# Build /var/www/solar_crm_frontend/dist mein hogi
```

### Digiink Admin:
```bash
cd /var/www/digiink_admin

# .env banao
nano .env
```
```env
VITE_API_BASE_URL=https://api.solarcrm.com/api/superadmin
```
```bash
npm install
npm run build
# Build /var/www/digiink_admin/dist mein hogi
```

---

## Step 9 — Domain aur DNS Setup Karo

Domain provider (GoDaddy/Namecheap/Cloudflare) mein jao:

```
Type    Name          Value
A       @             YOUR_VPS_IP
A       *             YOUR_VPS_IP    ← Wildcard (clients ke liye)
A       admin         YOUR_VPS_IP
A       api           YOUR_VPS_IP
```

**Wildcard `*` most important hai** — isse client1.solarcrm.com, client2.solarcrm.com sab automatically point honge.

---

## Step 10 — Nginx Config Karo

```bash
# Pehle default config hatao
rm /etc/nginx/sites-enabled/default

# Solar CRM Client Frontend
nano /etc/nginx/sites-available/solar-crm-client
```

**`solar-crm-client` config:**
```nginx
# Wildcard — sab client subdomains yahan aayenge
server {
    listen 80;
    server_name *.solarcrm.com;

    # Pehle API calls backend pe bhejo
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # Baaki sab React frontend serve karo
    root /var/www/solar_crm_frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**`admin.solarcrm.com` config:**
```bash
nano /etc/nginx/sites-available/solar-crm-admin
```
```nginx
server {
    listen 80;
    server_name admin.solarcrm.com;

    root /var/www/digiink_admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable karo
ln -s /etc/nginx/sites-available/solar-crm-client /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/solar-crm-admin /etc/nginx/sites-enabled/

# Test karo
nginx -t

# Restart karo
systemctl restart nginx
```

---

## Step 11 — SSL Certificate (HTTPS) Lagao

```bash
apt install -y certbot python3-certbot-nginx

# Wildcard SSL — Cloudflare use karo DNS ke liye (recommended)
certbot --nginx -d solarcrm.com -d *.solarcrm.com -d admin.solarcrm.com

# Auto-renewal check
certbot renew --dry-run
```

---

## Step 12 — Firewall Setup Karo

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Check karo
ufw status
```

---

## Step 13 — DBs Import Karo

```bash
# Master DB
mysql -u root -p < /var/www/solar_crm_backend/db_digiink_master.sql

# Super Admin password update karo
mysql -u root -p db_digiink_master
UPDATE super_admins SET password = 'NEW_BCRYPT_HASH' WHERE email = 'admin@digiink.in';
EXIT;
```

---

## Step 14 — Test Karo

```
1. admin.solarcrm.com → Digiink Admin Console login ✅
2. Admin Console se naya client banao (subdomain: "abc") ✅
3. Welcome email aayega abc ka ✅
4. abc.solarcrm.com → Solar CRM login karo ✅
5. Dashboard dikhega ✅
```

---

## Local vs VPS — Differences

| Cheez | Local | VPS |
|---|---|---|
| Domain | test.solarcrm.local (hosts file) | test.solarcrm.com (DNS) |
| API URL | localhost:5000 | api.solarcrm.com |
| Frontend | npm run dev | npm run build → Nginx serve |
| Backend | node server.js | PM2 |
| SSL | Nahi (Not secure) | Certbot (HTTPS) |
| Subdomains | hosts file mein manually | Wildcard DNS automatic |
| DB | Local MySQL | VPS MySQL |

---

## VPS Pe Code Update Karna (Future)

```bash
cd /var/www/solar_crm_backend
git pull
pm2 restart solar-crm-backend

cd /var/www/solar_crm_frontend
git pull
npm run build

cd /var/www/digiink_admin
git pull
npm run build

# Nginx reload
systemctl reload nginx
```

---

## PM2 Useful Commands

```bash
pm2 status                    # Sab processes dekho
pm2 logs solar-crm-backend    # Live logs
pm2 restart solar-crm-backend # Restart
pm2 stop solar-crm-backend    # Stop
```

---

## Checklist — VPS Ready Hai Jab:

```
✅ node --version → v20.x.x
✅ mysql --version → 8.x.x
✅ pm2 status → solar-crm-backend online
✅ nginx -t → syntax ok
✅ admin.solarcrm.com → Digiink login page
✅ *.solarcrm.com → Solar CRM login page
✅ SSL green lock dikh raha hai
✅ Naya client banaya → DB ban gaya → Login hua
```

---

*Digiink Solutions — Internal Document*
*Solar CRM Subscription System*
