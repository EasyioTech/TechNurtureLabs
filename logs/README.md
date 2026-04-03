# Application Logs

Log files from Docker startup, deployment, and system operations.

## 📋 Contents

### Startup Logs
- **docker_startup.log** - Docker container startup log
- **docker_clean_startup.log** - Clean startup verification log

## 📖 How to Read Logs

### Check for errors
```bash
grep -i error logs/*.log
```

### View specific log
```bash
cat logs/docker_startup.log
```

### Follow live logs
```bash
docker logs -f LMS_app
```

## 🔗 Related Documentation
- [../docs/deployment/DOCKER_DEPLOYMENT_STATUS.md](../docs/deployment/DOCKER_DEPLOYMENT_STATUS.md)
- [../docs/deployment/DOCKER_CLEAN_STARTUP_COMPLETE.md](../docs/deployment/DOCKER_CLEAN_STARTUP_COMPLETE.md)

## ⚠️ Note
Log files may contain sensitive information. Handle carefully in shared environments.
