#!/bin/bash
# Remove all double quotes from the .env files
sed -i 's/\"//g' /root/TechNurtureLabs/.env.production
sed -i 's/\"//g' /root/TechNurtureLabs/.env
cd /root/TechNurtureLabs && docker compose restart app
