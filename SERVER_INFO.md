# Server Information

**IP Address:** `93.127.206.108`
**Live Link:** [http://laoo.online](http://laoo.online)

## Quick Commands

### Login
```bash
ssh root@93.127.206.108
```

### Restart Backend
```bash
pm2 restart laoo-api
```

### Restart Frontend/Nginx
```bash
systemctl restart nginx
```

### View Logs
```bash
pm2 logs laoo-api
journalctl -u nginx -f
```

### Update Code (Deploys latest from GitHub)
```bash
cd /var/www/Laoo
git stash
git pull
git stash pop
npm install
npm run build
cd server
npm install
npm run build
npx prisma migrate deploy
npx prisma db push
pm2 restart laoo-api
systemctl restart nginx
```
