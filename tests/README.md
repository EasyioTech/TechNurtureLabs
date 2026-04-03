# Test Files

Test configurations, scripts, and test data for TechNurture LMS.

## 📋 Contents

### Configuration Files
- **.env.test** - Test environment variables
- **docker-compose.test.yml** - Docker setup for testing

### Test Scripts
- **run-load-test.sh** - Load testing script
- **run-security-tests.sh** - Security testing script

### Test Code
- **load-test.js** - Load test implementation
- **test_hash.js** - Hash testing utility
- **security-fixes.integration.test.ts** - Security fixes integration tests

### Test Results
- **perf_test_results.txt** - Performance test results

## 🚀 Running Tests

### Load Tests
```bash
bash run-load-test.sh
```

### Security Tests
```bash
bash run-security-tests.sh
```

### View Results
```bash
cat perf_test_results.txt
```

## 🔗 Related
- [../docs/operations/LOAD_TEST_10K_USERS.md](../docs/operations/LOAD_TEST_10K_USERS.md)
- [../docs/operations/PERFORMANCE_TEST_GUIDE.md](../docs/operations/PERFORMANCE_TEST_GUIDE.md)
