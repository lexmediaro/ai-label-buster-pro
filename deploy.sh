#!/bin/bash
# Deploy ailabelbuster.com to the VPS (nginx site /etc/nginx/sites-available/ailabelbuster.com, Let's Encrypt SSL).
# Stamps ?v= on the stylesheet so browsers pick up changes.
set -euo pipefail
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M%S)
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude .git --exclude deploy.sh --exclude CNAME --exclude .nojekyll ./ "$TMP/"
find "$TMP" -name '*.html' -exec sed -i '' -E "s#/(landing|style)\.css(\?v=[0-9]+)?#/\1.css?v=$V#g" {} +
rsync -az --delete "$TMP/" root@72.61.81.27:/var/www/ailabelbuster.com/
ssh root@72.61.81.27 'chown -R www-data:www-data /var/www/ailabelbuster.com && find /var/www/ailabelbuster.com -type d -exec chmod 755 {} + && find /var/www/ailabelbuster.com -type f -exec chmod 644 {} +'
echo "Deployed to https://ailabelbuster.com (v=$V)"
