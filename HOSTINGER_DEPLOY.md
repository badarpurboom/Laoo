# 🚀 Deploying Laoo to Hostinger VPS

This guide will walk you through deploying your **Laoo Restaurant Management System** to a Hostinger **VPS (Virtual Private Server)** running Ubuntu or Debian.

## ✅ Prerequisites

1.  **Hostinger VPS:** You should have root access (SSH).
2.  **Domain Name (Optional but Recommended):** e.g., `myrestaurant.com` pointing to your VPS IP address.
3.  **GitHub Repo:** Your code is already here: `https://github.com/badarpurboom/Laoo.git`

---

## 🛠️ Step 1: Connect to Your VPS

Open your terminal (PowerShell or Command Prompt on Windows) and SSH into your server:

```bash
ssh root@<your_vps_ip_address>
# Enter your password when prompted
```

---

## 🛠️ Step 2: Install Node.js & NPM

Update your system and install the required tools:

```bash
# Update package list
apt update && apt upgrade -y

# Install Curl
apt install curl -y

# Install Node.js (Version 18 or 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node -v
npm -v
```

---

## 🛠️ Step 3: Clone Your Repository

Download your project code to the server:

```bash
# Navigate to the web directory (standard practice)
cd /var/www

# Clone the repository
git clone https://github.com/badarpurboom/Laoo.git

# Enter the project folder
cd Laoo
```

---

## 🛠️ Step 4: Install Dependencies & Build

Install all the libraries and build the frontend for production:

```bash
# Install all dependencies
npm install

# Build the Frontend (React/Vite)
npm run build
```

*This will create a `dist` folder with your optimized frontend files.*

---

## 🛠️ Step 5: Configure the Backend for Production

We need to make sure the backend serves the frontend files.

1.  **Edit `server/index.js` (or primary server file):**
    We need to ensure it serves the `dist` folder. (The current setup likely does this, but let's verify).

2.  **Environment Variables:**
    Create a `.env` file in the root if your project needs secrets (like API keys).
    ```bash
    nano .env
    # Paste your environment variables here
    # Ctrl+O to save, Enter to confirm, Ctrl+X to exit
    ```

---

## 🛠️ Step 6: Use PM2 to Keep App Running

**PM2** is a process manager that keeps your app running 24/7, even if the server restarts.

```bash
# Install PM2 globally
npm install pm2 -g

# Start the Backend Server
# (Make sure you are in the root directory)
pm2 start server/index.js --name "laoo-backend"

# Save the process list so it restarts on boot
pm2 save
pm2 startup
```

---

## 🌐 Step 7: Expose to the World (Nginx Reverse Proxy)

Running on port 5000 is okay for testing, but for a real website, you want port 80 (HTTP) or 443 (HTTPS). We use **Nginx** for this.

1.  **Install Nginx:**
    ```bash
    apt install nginx -y
    ```

2.  **Configure Nginx:**
    Create a config file for your site:
    ```bash
    nano /etc/nginx/sites-available/laoo
    ```

3.  **Paste the Configuration:**
    Replace `your_domain_or_ip` with your actual Domain or VPS IP.

    ```nginx
    server {
        listen 80;
        server_name your_domain_or_ip;

        location / {
            proxy_pass http://localhost:5000; # Points to your Node.js backend
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

4.  **Enable the Site:**
    ```bash
    ln -s /etc/nginx/sites-available/laoo /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default  # Remove default config if present
    nginx -t  # Test configuration for errors
    systemctl restart nginx
    ```

---

## 🎉 Done!

Visit `http://<your_vps_ip>` (or your domain) in your browser. You should see your **Laoo Restaurant System** live!

### 💡 Pro Tip: Secure with SSL (HTTPS)
If you have a domain, run this to get free HTTPS:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```
