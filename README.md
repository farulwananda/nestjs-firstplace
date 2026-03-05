# NestJS Notes API

Production-grade REST API built with **NestJS**, **Drizzle ORM** (MySQL), **JWT Authentication**, and **Winston** logging.

## Tech Stack

| Category   | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | NestJS v11                          |
| Language   | TypeScript (strict)                 |
| ORM        | Drizzle ORM                         |
| Database   | MySQL (mysql2 driver)               |
| Auth       | Passport.js + JWT                   |
| Validation | class-validator + class-transformer |
| Logging    | Winston (nest-winston)              |
| Security   | Helmet + Throttler                  |
| API Docs   | Swagger (OpenAPI)                   |
| Hashing    | bcrypt                              |
| Queue      | BullMQ (Redis-backed jobs)          |
| Email      | Nodemailer + Mailtrap SMTP          |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** ≥ 8.0
- **Redis** ≥ 6.0
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-firstplace

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Configuration

Edit `.env` with your credentials:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/nestjs_firstplace
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-mailtrap-user
MAILTRAP_PASSWORD=your-mailtrap-password
MAIL_FROM=noreply@firstplace.local
```

> ⚠️ **IMPORTANT**: In production, use a strong random string for `JWT_SECRET` (at least 32 characters).

### Database Setup

```bash
# Create the database in MySQL
mysql -u root -p -e "CREATE DATABASE nestjs_firstplace;"

# Generate migrations
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

### Running the Application

```bash
# Development (hot-reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

After starting, visit:

- **API**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/api/docs`

### Queue & Email (BullMQ + Mailtrap)

Welcome email is queued through BullMQ and processed asynchronously by a worker in the same NestJS app.

```bash
# Run Redis (example with Docker)
docker run --name notes-redis -p 6379:6379 -d redis:7-alpine

# Start app
npm run start:dev
```

Then register a user via `POST /api/v1/auth/register`, and check Mailtrap inbox for the welcome email.

---

## Project Structure

```
src/
├── main.ts                              # Bootstrap, global pipes, logger, Swagger
├── app.module.ts                        # Root module with all imports
│
├── common/                              # Shared utilities (reusable across modules)
│   ├── config/
│   │   └── env.validation.ts            # Environment variable validation (fail-fast)
│   ├── decorators/
│   │   └── current-user.decorator.ts    # @CurrentUser() param decorator
│   ├── filters/
│   │   └── http-exception.filter.ts     # Global exception handler
│   ├── guards/
│   │   └── jwt-auth.guard.ts            # JWT authentication guard
│   ├── interceptors/
│   │   └── transform.interceptor.ts     # Standardize response format
│   └── logger/
│       └── winston.config.ts            # Winston logger configuration
│
├── database/
│   ├── database.module.ts               # Drizzle provider (DRIZZLE token)
│   └── schema/
│       ├── index.ts                     # Re-export all schemas
│       ├── users.schema.ts              # Users table definition
│       └── notes.schema.ts              # Notes table definition
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts              # POST register, POST login, GET profile
│   ├── auth.service.ts                 # Business logic (bcrypt, JWT, queue welcome email)
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   └── strategies/
│       └── jwt.strategy.ts             # Passport JWT strategy
│
├── mail/
│   ├── mail.module.ts                  # Queue + worker wiring
│   ├── mail-queue.service.ts           # Queue producer
│   ├── mail.worker.ts                  # BullMQ worker/processor
│   ├── mail.service.ts                 # Mailtrap SMTP sender
│   └── mail-queue.config.ts            # Redis connection resolver
│
└── notes/
    ├── notes.module.ts
    ├── notes.controller.ts             # CRUD endpoints (protected)
    ├── notes.service.ts                # Business logic with ownership checks
    └── dto/
        ├── create-note.dto.ts
        └── update-note.dto.ts
```

---

## API Endpoints

### Auth

| Method | Endpoint                | Description              | Auth |
| ------ | ----------------------- | ------------------------ | ---- |
| `POST` | `/api/v1/auth/register` | Register new user        | ❌   |
| `POST` | `/api/v1/auth/login`    | Login, get JWT token     | ❌   |
| `GET`  | `/api/v1/auth/profile`  | Get current user profile | ✅   |

### Notes

| Method   | Endpoint            | Description                               | Auth |
| -------- | ------------------- | ----------------------------------------- | ---- |
| `POST`   | `/api/v1/notes`     | Create a note                             | ✅   |
| `GET`    | `/api/v1/notes`     | List all notes (filter: `?archived=true`) | ✅   |
| `GET`    | `/api/v1/notes/:id` | Get a specific note                       | ✅   |
| `PATCH`  | `/api/v1/notes/:id` | Update a note                             | ✅   |
| `DELETE` | `/api/v1/notes/:id` | Delete a note                             | ✅   |

### Response Format

All responses follow a standardized format:

**Success:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

**Error:**

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "BadRequestException",
  "timestamp": "2026-03-05T00:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

## Coding Style & Conventions

### 1. Module Structure

Every feature is a **self-contained module** with its own controller, service, DTOs, and tests:

```
feature/
├── feature.module.ts       # Module definition
├── feature.controller.ts   # HTTP layer (routing, guards)
├── feature.service.ts      # Business logic
└── dto/
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

### 2. DTO Validation (class-validator)

Always use DTOs with `class-validator` decorators. The global `ValidationPipe` is configured to:

- **whitelist**: Strip unknown properties
- **forbidNonWhitelisted**: Throw error on unknown properties
- **transform**: Auto-transform payloads to DTO instances

```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ example: 'Example', description: 'Feature name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
```

### 3. Guard Usage

Use `JwtAuthGuard` on protected routes:

```typescript
// Single endpoint
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser('id') userId: string) { ... }

// Entire controller
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController { ... }
```

### 4. Drizzle ORM Pattern

Inject the database using the `DRIZZLE` token:

```typescript
import { Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '../database/database.module.js';
import * as schema from '../database/schema/index.js';

@Injectable()
export class MyService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(schema.myTable);
  }
}
```

### 5. Error Handling

Use NestJS built-in exceptions. The global `HttpExceptionFilter` formats them consistently:

```typescript
throw new NotFoundException('Resource not found');
throw new ConflictException('Email already registered');
throw new ForbiddenException('Access denied');
throw new UnauthorizedException('Invalid credentials');
```

### 6. Naming Conventions

| Item           | Convention  | Example               |
| -------------- | ----------- | --------------------- |
| Files          | kebab-case  | `create-note.dto.ts`  |
| Classes        | PascalCase  | `NotesService`        |
| Methods        | camelCase   | `findAll()`           |
| DB columns     | snake_case  | `created_at`          |
| DTO properties | camelCase   | `isArchived`          |
| Constants      | UPPER_SNAKE | `DRIZZLE`             |
| Endpoints      | kebab-case  | `/api/v1/my-resource` |

### 7. Import Style

Always use `.js` extension in imports (ESM resolution with `nodenext` module):

```typescript
import { AuthService } from './auth.service.js';
import { users } from '../database/schema/index.js';
```

---

## Database Migrations

```bash
# Generate migration after schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push

# Open Drizzle Studio (database browser)
npx drizzle-kit studio
```

---

## Logging

Winston is configured with:

- **Console**: Colorized output in development, JSON in production
- **File**: `logs/error.log` (errors only) + `logs/combined.log` (all levels)
- **Max file size**: 5MB with 5 file rotation

Use the Winston logger via dependency injection:

```typescript
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MyService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  doSomething() {
    this.logger.info('Something happened', { context: 'MyService' });
  }
}
```

---

## Security

| Feature          | Implementation                      |
| ---------------- | ----------------------------------- |
| Password hashing | bcrypt (12 salt rounds)             |
| JWT tokens       | RS256, configurable expiry          |
| HTTP headers     | Helmet (XSS, HSTS, etc.)            |
| Rate limiting    | 60 requests/minute per IP           |
| Input validation | Whitelist + forbidNonWhitelisted    |
| SQL injection    | Drizzle ORM (parameterized queries) |
| CORS             | Configurable origins                |

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (≥ 32 random characters)
- [ ] Configure `CORS_ORIGIN` to specific domains
- [ ] Enable SSL/TLS at reverse proxy level
- [ ] Use connection pooling for MySQL
- [ ] Set up log aggregation (ELK, Datadog, etc.)
- [ ] Configure health check endpoint
- [ ] Use PM2 or Docker for process management
- [ ] Set up CI/CD pipeline
- [ ] Enable database backups

---

## Scripts

```bash
npm run build         # Compile TypeScript
npm run start:dev     # Development with hot-reload
npm run start:prod    # Run compiled JS
npm run lint          # ESLint check + fix
npm run format        # Prettier formatting
npm run test          # Unit tests
npm run test:cov      # Coverage report
npm run test:e2e      # End-to-end tests
```

---

## Recommended Libraries (Industry-Mature)

| Library                    | Purpose       | Why                                             |
| -------------------------- | ------------- | ----------------------------------------------- |
| `drizzle-orm`              | ORM           | Type-safe, SQL-first, lightweight               |
| `class-validator`          | Validation    | Decorator-based, NestJS official recommendation |
| `passport` + `@nestjs/jwt` | Auth          | Industry standard, extensible strategies        |
| `winston`                  | Logging       | Most popular Node.js logger, multi-transport    |
| `helmet`                   | Security      | Sets secure HTTP headers automatically          |
| `@nestjs/throttler`        | Rate Limiting | Built-in NestJS module, Redis-compatible        |
| `@nestjs/swagger`          | API Docs      | Auto-generated OpenAPI from decorators          |
| `bcrypt`                   | Hashing       | Battle-tested, timing-safe password hashing     |
| `@nestjs/config`           | Config        | Env validation + type-safe access               |
| `class-transformer`        | Transform     | DTO transformation, works with class-validator  |

---

## License

[UNLICENSED](LICENSE)
