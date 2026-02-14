# Deploying Laoo (Bistro) to VPS

This guide explains how to deploy your **Laoo Restaurant Management System** to a VPS (Virtual Private Server) like DigitalOcean, Hetzner, or AWS Lightsail.

## Prerequisites

-   **VPS Server:** Ubuntu 22.04 or 24.04 (Min 2GB RAM, recommended 4GB).
-   **Domain Name:** Pointed to your VPS IP address.
-   **GitHub Repository:** Ensure your local code is pushed to GitHub.

---

## ⚠️ Important: Push Your Code First!

Your local code has updates (Database schema changes, Customer UI fixes) that are **NOT** on GitHub yet. Before deploying, run these commands in your project folder:

```bash
git add .
git commit -m "feat: Prepare for deployment (Add build scripts & UI fixes)"
git push origin main
```

---

## Step 1: Prepare the Server

SSH into your server:

```bash
ssh root@your_server_ip
```

Update and install dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx unzip
```

### Install Node.js (v20)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Setup Database User & DB:**

```bash
sudo -u postgres psql
```

Inside the SQL prompt:

```sql
CREATE DATABASE bistro_db;
CREATE USER bistro_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE bistro_db TO bistro_user;
ALTER DATABASE bistro_db OWNER TO bistro_user;
\q
```

---

## Step 2: Clone & Build the App

Clone your repository (replace with your repo URL):

```bash
cd /var/www
git clone https://github.com/badarpurboom/Laoo.git
cd Laoo
```

### Setup Backend

1.  Navigate to server folder:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create `.env` file:
    ```bash
    nano .env
    ```
    Add this content:
    ```env
    PORT=5000
    DATABASE_URL="postgresql://bistro_user:secure_password_here@localhost:5432/bistro_db?schema=public"
    # Add other secrets here (JWT_SECRET, etc.)
    ```
4.  Build and Migrate:
    ```bash
    npm run build
    npx prisma migrate deploy
    ```
5.  Start Backend with PM2:
    ```bash
    pm2 start dist/index.js --name "laoo-api"
    pm2 save
    ```

### Setup Frontend

1.  Go back to root:
    ```bash
    cd ..
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build Frontend:
    ```bash
    npm run build
    ```
    This creates a `dist` folder with your static files.

---

## Step 3: Configure Nginx

Create a new Nginx config:

```bash
sudo nano /etc/nginx/sites-available/laoo
```

Paste this configuration (replace `your_domain.com`):

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    root /var/www/Laoo/dist;
    index index.html;

    # Serve Frontend (React)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy Uploads
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/laoo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 4: SSL (HTTPS)

Secure your site with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

---

**🎉 Done! Your app should now be live at https://your_domain.com**
