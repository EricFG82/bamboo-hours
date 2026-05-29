# Bamboo Hours

Automation tool for submitting work hours to BambooHR using Playwright and BambooHR's internal Timesheet API.

The script logs into BambooHR, automatically detects the employee ID, retrieves the CSRF token, and submits time entries through the Timesheet REST endpoint.

## Features

* Automatic BambooHR login
* Automatic Employee ID detection
* Automatic CSRF token retrieval
* Time entry submission via REST API
* Configuration through `.env`
* Friendly error handling
* Automatic browser shutdown
* Configurable working hours
* Optional note/comment support
* Persistent browser profile support
* Automatic dependency installation (optional)

## Requirements

* Node.js >= 18
* pnpm (recommended) or npm
* macOS, Linux, or Windows

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd bamboo-hours
```

Install dependencies:

```bash
pnpm install
```

Install the Playwright browser:

```bash
npx playwright install chromium
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the values in `.env`:

```env
BAMBOO_URL=https://your-company.bamboohr.com
BAMBOO_USER=your.email@company.com
BAMBOO_PASSWORD=your_password

MORNING_START=09:00
MORNING_END=14:00

AFTERNOON_START=15:00
AFTERNOON_END=18:00
```

### Environment Files

The repository includes an example configuration file:

```text
.env.example
```

This file contains all supported configuration variables without sensitive information.

Example `.env.example`:

```env
BAMBOO_URL=https://your-company.bamboohr.com
BAMBOO_USER=your.email@company.com
BAMBOO_PASSWORD=your_password

MORNING_START=09:00
MORNING_END=14:00

AFTERNOON_START=15:00
AFTERNOON_END=18:00
```

Never commit your real `.env` file to source control.

## First Login and Multi-Factor Authentication (MFA)

Depending on your BambooHR security settings, the first execution may require Multi-Factor Authentication (MFA).

You may see a screen similar to:

```text
2-Step Login Required
Enter the code from your authenticator app
```

If prompted:

1. Open your authenticator app.
2. Enter the verification code.
3. Enable **"Remember this computer"**.
4. Continue the login process.

After successful authentication, BambooHR will mark the browser profile as trusted and store the session in Playwright's persistent profile directory:

```text
~/.bamboohr-hours/profile
```

In most cases, future executions will not require MFA again unless:

* The session expires.
* BambooHR security policies change.
* The profile directory is deleted.
* The trusted device is revoked by BambooHR.

If MFA is requested again, simply repeat the verification process.

## Usage

Submit hours for today:

```bash
./bamboo-hours.sh
```

Submit hours for a specific date:

```bash
./bamboo-hours.sh 2026-05-29
```

Submit hours with a note:

```bash
./bamboo-hours.sh 2026-05-29 "Sprint 42"
```

## Default Schedule

The script submits two time blocks:

| Start | End   |
| ----- | ----- |
| 09:00 | 14:00 |
| 15:00 | 18:00 |

These values can be customized through the `.env` file.

## Project Structure

```text
.
├── .env
├── .env.example
├── .gitignore
├── bamboo-hours.sh
├── fill-hours.js
├── package.json
├── package-lock.json
└── README.md

User profile storage:
~/.bamboohr-hours/
└── profile/
```

## Execution Flow

1. Opens BambooHR.
2. Logs in automatically.
3. Detects the Employee ID.
4. Navigates to the Timesheet page.
5. Retrieves the CSRF token.
6. Sends the time entries through the internal API:

```http
POST /timesheet/clock/entries
```

7. Displays the result.
8. Closes the browser.

## Error Handling

Example:

```text
❌ BambooHR Error
Status: 400
Response: You cannot add an entry for today or in the future
```

Common errors:

| Error                        | Description                              |
| ---------------------------- | ---------------------------------------- |
| Login failed                 | Invalid username or password             |
| Unable to find CSRF token    | BambooHR page structure may have changed |
| Unable to detect employee ID | Timesheet link could not be found        |
| HTTP 400                     | Validation error returned by BambooHR    |
| MFA required                 | A verification code must be entered      |

## Automatic Dependency Installation

If desired, the shell script can automatically install dependencies when `node_modules` is missing:

```bash
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."

  if command -v pnpm >/dev/null 2>&1; then
    pnpm install
  elif command -v npm >/dev/null 2>&1; then
    npm install
  else
    echo "No package manager found (pnpm or npm)"
    exit 1
  fi

  npx playwright install chromium
fi
```

This makes the project easier to run on a new machine without manual setup.

## Security

Credentials are stored in `.env`.

Make sure `.env` is included in `.gitignore`:

```gitignore
.env
node_modules/
```

Never commit credentials, session data, or browser profiles to source control.

## Notes

This project relies on BambooHR's internal Timesheet endpoints. If BambooHR changes its UI or internal APIs, selectors, payloads, request headers, or endpoints may need to be updated.

Because the implementation uses a persistent Playwright browser profile, login sessions can survive between executions, reducing the need for repeated authentication.

## License

Internal use only.
