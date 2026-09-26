# Klear And Klarity

Career guidance for students: a 150+ pathway Career Tree, an onboarding profile, a student
discussion board, and a full admin panel.

- **Frontend** `frontend/` - React 19, Vite, React Router 7, Tailwind CSS 4
- **Backend** `backend/` - Java 21, Spring Boot 3.4, Spring Security with JWT, Spring Data JPA
- **Database** MySQL 8

---

## 1. Prerequisites

| Tool | Version used | Notes |
|------|--------------|-------|
| Java | 21 | `java -version` |
| Node.js | 24 | `node -v`, npm 11 |
| MySQL | 8.0+ | the `MySQL80` service is enough |
| Maven | not needed | use the bundled `backend\mvnw.cmd` wrapper |

---

## 2. Configuration: `backend/.env`

Everything secret lives in `backend\.env`. It is loaded automatically at startup, so you never
have to export variables in your terminal.

A ready-to-edit file is already there. Fill in the MySQL password and, if you want real emails,
the Gmail app password:

```properties
DB_URL=jdbc:mysql://localhost:3306/klearity?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8
DB_USERNAME=root
DB_PASSWORD=your-mysql-password

JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRATION_MINUTES=720

MAIL_USERNAME=your.address@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=Klear And Klarity
MAIL_FROM_ADDRESS=your.address@gmail.com
MAIL_BASE_URL=http://localhost:5173
MAIL_VERIFICATION_REQUIRED=

SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173
```

`backend\.env.example` is the documented template. Keep the real `.env` out of version control.

Precedence is: **real environment variable > `.env` > default in `application.yml`**. That means
a hosting platform that injects env vars works without any changes here.

### If you forgot the MySQL root password

Ask your admin to reset it, or on a local install where you have administrator rights:

```powershell
net stop MySQL80
net start MySQL80 --skip-grant-tables
# connect, run: ALTER USER 'root'@'localhost' IDENTIFIED BY 'new-password'; FLUSH PRIVILEGES;
net stop MySQL80
net start MySQL80
```

---

## 3. Database

`createDatabaseIfNotExist=true` in the default `DB_URL` means MySQL Connector/J creates the
`klearity` schema for you, and Hibernate creates the tables. There is no migration step.

To use a dedicated least-privilege account instead of `root`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-db.ps1
```

It asks for the root password, creates the `klearity` database with `utf8mb4`, creates the
`klarity_app` user, and prints the three `DB_*` lines to paste into `backend\.env`.

### Seeded content

Runs automatically on first start, and is safe to re-run (it matches on the dataset id):

- 5 classes: `10th`, `Inter/Diploma`, `UG`, `PG`, `Others`
- 150 dataset pathways, 25 in each of categories A-F, mapped to those classes
- 13 extra postgraduate cards, for 163 items in total
- 2 onboarding questions: class (single choice with an `Others` text box) and interests
  (26 multi-choice chips)
- Discussion categories and site settings

### Seeded admin

| Field | Value |
|-------|-------|
| Email | `admin@klearity.com` |
| Password | `Admin@123` |

The account is flagged `mustChangePassword`, so the app routes it to **Profile** and blocks every
other page until a new password is set. Change it immediately.

---

## 4. Run the backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Listens on `http://localhost:8080`. Or build once and run the jar:

```powershell
.\mvnw.cmd -DskipTests package
java -jar target\guidance-plus-1.0.0.jar
```

---

## 5. Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Serves on `http://localhost:5173` and proxies `/api` to port 8080 (see `vite.config.js`).

| Script | Purpose |
|--------|---------|
| `npm run dev` | dev server with HMR |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the production build |
| `npm run lint` | oxlint |

---

## 6. Email

Without SMTP the app still works end to end: verification and reset links are written to the
backend log instead of emailed, and `MAIL_VERIFICATION_REQUIRED` left blank means login is not
blocked. Once `MAIL_USERNAME` and `MAIL_PASSWORD` are both set, verification is enforced
automatically.

To send real mail, use a **Gmail app password**, not your account password. Enable 2-Step
Verification, then create an app password at `https://myaccount.google.com/apppasswords`.

| Variable | Default | Notes |
|----------|---------|-------|
| `MAIL_HOST` | `smtp.gmail.com` | |
| `MAIL_PORT` | `587` | STARTTLS |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | empty | both must be set, or sending is skipped with a warning |
| `MAIL_FROM_NAME` | `Klear And Klarity` | shown in the subject line |
| `MAIL_FROM_ADDRESS` | `noreply@klearity.com` | |
| `MAIL_BASE_URL` | `http://localhost:5173` | prefix inside emailed links |
| `MAIL_VERIFICATION_REQUIRED` | blank | blank = auto; `true` or `false` forces the behaviour |

If a student cannot receive email, an admin can set a password for them under
**Admin Panel > Registrations**.

---

## 7. How the roles work

| Role | Can do |
|------|--------|
| `STUDENT` | Everything a logged-in user can: Career Tree, discussion, profile |
| `EMPLOYEE` | Same as a student for now; no extra permissions yet |
| `ADMIN` | Everything in `/api/admin/**` |

Self-registration always creates a `STUDENT`. An admin promotes a user to `EMPLOYEE` or `ADMIN`
from the registrations table. The last admin cannot be demoted, disabled or deleted, and nobody
can disable or delete their own account.

---

## 8. Privacy rules baked into the code

- Discussion posts and replies expose `displayName` only: the first name, or `Anonymous` when the
  author ticks the box.
- No post or reply DTO carries an author id, email, contact number or profile link.
- Email, contact number, account id, gender and role are never sent to other students.
- The admin panel is the only place full registration data is visible.

---

## 9. Free deployment

The backend is a standard Spring Boot app and the frontend is a static Vite build, so both go on
free tiers. MySQL-compatible free tiers exist, and so does a free tier for Java hosting and static
hosting.

1. **Database** - create a MySQL database on a free tier (Oracle Cloud Always Free, Aiven, PlanetScale
   free tier, or the free MySQL instance some hosts provide).
2. **Backend** - set these on the host, no `.env` needed there:
   ```
   DB_URL=jdbc:mysql://HOST:PORT/DB?useSSL=true&serverTimezone=UTC
   DB_USERNAME=...
   DB_PASSWORD=...
   JWT_SECRET=<64+ random characters>
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain
   ```
   Start command: `./mvnw -DskipTests package && java -jar target/guidance-plus-1.0.0.jar`
3. **Frontend** - `npm run build` and serve `dist/` from Netlify, Vercel, Cloudflare Pages or
   GitHub Pages. Point the API base URL and the dev proxy at the deployed backend in
   `vite.config.js`.
4. Set `MAIL_BASE_URL` to the deployed frontend URL, otherwise emailed links point at localhost.
5. Update `logoPath` under **Admin Panel > Settings** if the logo moves.

Free-tier providers change their quotas, so re-check current limits before relying on one.

---

## 10. Project layout

```
backend/
  .env                      local secrets, loaded at startup
  src/main/java/com/klearity/guidance/
    config/      DataSeeder, SecurityConfig, AppProperties
    controller/  Auth, Career, Onboarding, Discussion, Public, Admin
    domain/      JPA entities and enums
    dto/         request and response records
    repository/  Spring Data repositories
    security/    JwtService, JwtAuthFilter
    service/     business logic, MailService, CurrentUser
  src/main/resources/
    application.yml
    seed/careers-150.json
frontend/
  src/
    components/  Navbar, Footer, Modal, Form, Feedback, Spinner, Logo, guards
    lib/         api client, auth context, settings context, formatters
    pages/       public pages, student pages, admin/ pages
scripts/
  setup-db.ps1  optional MySQL database and user creation
```

---

## 11. Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| `Access denied for user 'root'@'localhost'` | Wrong `DB_PASSWORD` in `backend\.env`. Verify with `mysql -u root -p -e "SELECT 1"`. |
| `Unknown database 'klearity'` | Drop `createDatabaseIfNotExist=true` from `DB_URL`, or create the schema with `scripts\setup-db.ps1`. |
| `Public Key Retrieval is not allowed` | Add `allowPublicKeyRetrieval=true` to `DB_URL`. |
| `Communications link failure` | MySQL80 service is stopped. `Start-Service MySQL80`. |
| Frontend shows "Cannot reach the server" | Backend is not on port 8080, or the `/api` proxy in `vite.config.js` points elsewhere. |
| Career Tree is empty | The seeder did not run. Check the backend log for seed errors and confirm `seed/careers-150.json` is on the classpath. |
| No email arrives | SMTP is not configured, or you used your account password instead of an app password. Both `MAIL_USERNAME` and `MAIL_PASSWORD` must be present. |
| `MAIL_VERIFICATION_REQUIRED` ignored | Leave it blank for auto, or set exactly `true` or `false`. |
| Admin panel redirects to the dashboard | The signed-in account is not `ADMIN`. Promote it from the registrations table using another admin. |
| Stuck on "change your password" | Expected for the seeded admin. Set a new password on the Profile page. |
