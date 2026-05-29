require('dotenv').config();

const { chromium } = require('playwright');

const DATE = process.argv[2];
const NOTE = process.argv[3] || '';

const {
  BAMBOO_URL,
  BAMBOO_USER,
  BAMBOO_PASSWORD,
  MORNING_START,
  MORNING_END,
  AFTERNOON_START,
  AFTERNOON_END
} = process.env;

async function getCsrfToken(page) {
  const token = await page.evaluate(() => {
    return (
      document.querySelector('meta[name="csrf-token"]')?.content ||
      document.querySelector('meta[name="csrf"]')?.content ||
      document.querySelector('input[name="CSRFToken"]')?.value ||
      window.CSRF_TOKEN ||
      window.csrfToken ||
      null
    );
  });

  if (!token) {
    await page.screenshot({
      path: 'debug-no-csrf.png',
      fullPage: true
    });

    throw new Error('Unable to find CSRF token');
  }

  return token;
}

async function detectEmployeeId(page) {
  await page.goto(`${BAMBOO_URL}/home`, {
    waitUntil: 'networkidle'
  });

  try {
    const href = await page
      .locator('a[href*="/employees/timesheet/"]')
      .first()
      .getAttribute('href');

    const match = href?.match(/id=(\d+)/);

    if (match) {
      return match[1];
    }
  } catch {
    // Ignore and fallback to HTML parsing
  }

  const html = await page.content();

  const match =
    html.match(/\/employees\/timesheet\/\?id=(\d+)/) ||
    html.match(/employee\.php\?id=(\d+)/);

  if (match) {
    return match[1];
  }

  await page.screenshot({
    path: 'debug-home-no-employee-id.png',
    fullPage: true
  });

  throw new Error('Unable to detect employee ID');
}

(async () => {
  let context;

  try {
    for (const key of [
      'BAMBOO_URL',
      'BAMBOO_USER',
      'BAMBOO_PASSWORD'
    ]) {
      if (!process.env[key]) {
        throw new Error(`Missing ${key} in .env`);
      }
    }

    context = await chromium.launchPersistentContext(
      `${process.env.HOME}/.bamboohr-hours/profile`,
      {
        headless: false,
        viewport: {
          width: 1600,
          height: 1000
        }
      }
    );

    const page = await context.newPage();

    console.log('Opening BambooHR...');

    await page.goto(`${BAMBOO_URL}/login.php`, {
      waitUntil: 'networkidle'
    });

    if (page.url().includes('/login.php')) {
      console.log('Logging in...');

      await page.locator('#lemail').fill(BAMBOO_USER);
      await page.locator('#password').fill(BAMBOO_PASSWORD);
      await page.locator('#password').press('Enter');

      await page.waitForTimeout(5000);
    }

    if (page.url().includes('/login.php')) {
      await page.screenshot({
        path: 'debug-login-failed.png',
        fullPage: true
      });

      throw new Error('Login failed');
    }

    const employeeId = await detectEmployeeId(page);

    console.log(`Employee ID: ${employeeId}`);

    const timesheetUrl =
      `${BAMBOO_URL}/employees/timesheet/?id=${employeeId}`;

    console.log('Opening timesheet...');

    await page.goto(timesheetUrl, {
      waitUntil: 'networkidle'
    });

    const csrfToken = await getCsrfToken(page);

    console.log('CSRF token detected');

    const payload = {
      entries: [
        {
          id: null,
          trackingId: 1,
          employeeId: Number(employeeId),
          date: DATE,
          start: MORNING_START || '09:00',
          end: MORNING_END || '14:00',
          note: NOTE,
          projectId: null,
          taskId: null,
          breakId: null
        },
        {
          id: null,
          trackingId: 2,
          employeeId: Number(employeeId),
          date: DATE,
          start: AFTERNOON_START || '15:00',
          end: AFTERNOON_END || '18:00',
          note: NOTE,
          projectId: null,
          taskId: null,
          breakId: null
        }
      ]
    };

    console.log('Submitting time entries...');

    const response = await page.request.post(
      `${BAMBOO_URL}/timesheet/clock/entries`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json;charset=UTF-8',
          origin: BAMBOO_URL,
          referer: timesheetUrl,
          'x-csrf-token': csrfToken
        },
        data: payload
      }
    );

    const body = await response.text();

    if (!response.ok()) {
      console.error('\n❌ BambooHR Error');
      console.error(`Status: ${response.status()}`);
      console.error(`Response: ${body}`);

      process.exitCode = 1;
      return;
    }

    console.log(`✅ Hours successfully submitted for ${DATE}`);
  } catch (err) {
    console.error('\n❌ Unexpected error');
    console.error(err.message);

    process.exitCode = 1;
  } finally {
    if (context) {
      try {
        await context.close();
        console.log('🔒 Browser closed');
      } catch {
        // Ignore browser close errors
      }
    }
  }
})();
