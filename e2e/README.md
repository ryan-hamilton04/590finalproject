# Lecture 22 - CI/CD Test for Smoothie Stand

This project contains automated end-to-end tests for the Smoothie Stand application using Playwright.

## Test Scenario

The test performs a complete workflow:

1. **Login** - Logs in using the CI/CD test user credentials
2. **Navigate to Customer Page** - Goes to the customer dashboard
3. **Create Draft Order** - Selects "milk" as an ingredient
4. **Save Draft** - Saves the draft order
5. **Submit Order** - Submits the order to the queue
6. **Navigate to Operator Page** - Switches to the operator dashboard
7. **Verify Order** - Confirms the order is visible and available to work on

## Prerequisites

1. **Smoothie Stand App Running**
   - The smoothie stand app must be running on `http://localhost:3000`
   - Navigate to `examples/lecture18-oauth-smoothie-stand`
   - Run `npm run dev`

2. **CI/CD Test Password Configured**
   - The smoothie stand app must have `NUXT_CICD_TEST_PASSWORD` set in its `.env` file
   - This enables the CI/CD test login feature

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install chromium
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set CICD_TEST_PASSWORD to match the smoothie stand app
   ```

## Running Tests

### Run all tests (headless)
```bash
npm test
```

### Run tests with browser visible
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests with UI mode
```bash
npm run test:ui
```

## Environment Variables

- `CICD_TEST_PASSWORD` - Password for CI/CD test user (must match the smoothie stand app)

## Test Structure

```
tests/
  └── smoothie-order.spec.ts  # Main test file with complete workflow
```

## CI/CD Integration

This test is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  env:
    CICD_TEST_PASSWORD: ${{ secrets.CICD_TEST_PASSWORD }}
  run: |
    cd examples/lecture22-cicd-test
    npm install
    npx playwright install chromium
    npm test
```

## Troubleshooting

### Test fails at login
- Verify the smoothie stand app is running on port 3000
- Check that `NUXT_CICD_TEST_PASSWORD` is set in the smoothie stand app
- Ensure the password in this test's `.env` matches the app's password

### Test fails to find elements
- The app UI may have changed
- Check the test selectors in `smoothie-order.spec.ts`
- Run with `--headed` or `--debug` to see what's happening

### Order not visible on operator page
- Check that the CI/CD test user has the `operator` role
- Verify the order was actually submitted (check the database or app logs)

## Notes

- Tests run sequentially (not in parallel) to avoid race conditions
- Screenshots are taken on failure for debugging
- Test reports are generated in `playwright-report/`
