#!/bin/bash

  echo "=== Starting setup at $(date) ===" >> /var/log/startup-script.log

  apt update -y && apt upgrade -y
  apt install -y curl git ufw

  groupadd devs
  mkdir -p /opt/apps
  chown root:devs /opt/apps
  chmod 775 /opt/apps

  useradd -m -s /bin/bash -G devs devuser

  mkdir -p /home/devuser/.ssh
  cat >> /home/devuser/.ssh/authorized_keys << 'EOF'
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL5Y1c2xKTXZZmrenAFtR14kyF8Fip7QGDIBD9uYA2IR catOnDebian
  EOF
  chmod 700 /home/devuser/.ssh
  chmod 600 /home/devuser/.ssh/authorized_keys
  chown -R devuser:devuser /home/devuser/.ssh

  usermod -aG devs ubuntu

  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt install -y nodejs
  node -v
  npm -v
  npm install -g pnpm pm2
  pnpm -v

  curl -fsSL https://get.docker.com | sh
  usermod -aG docker ubuntu
  usermod -aG docker devuser
  docker --version
  docker compose version

  apt install -y nginx
  systemctl enable nginx
  systemctl start nginx

  apt install -y certbot python3-certbot-nginx

  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  yes | ufw enable
  ufw status

  echo "=== Setup complete at $(date) ===" >> /var/log/startup-script.log