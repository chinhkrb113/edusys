# Curriculum Management Backend

Enterprise-grade REST API for comprehensive curriculum framework management with AI assistance, version control, and multi-tenant support.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Redis (optional, for queues)

### Installation

1. **Install dependencies:**

```bash
cd backend
npm install
```

2. **Environment setup:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup:**

```bash
# Create database
mysql -u root -p < ../backend-schema.sql

# Or run migration
npm run migrate
```

4. **Start development server:**

```bash
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Database, environment config
│   ├── middleware/       # Auth, error handling, validation
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic, queues
│   ├── utils/           # Logger, helpers
│   └── server.ts        # Express app entry point
├── dist/                # Compiled JavaScript
├── logs/                # Application logs
├── uploads/             # File uploads
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Configuration

### Environment Variables

| Variable      | Description      | Default                  |
| ------------- | ---------------- | ------------------------ |
| `NODE_ENV`    | Environment      | `development`            |
| `PORT`        | Server port      | `3001`                   |
| `DB_HOST`     | MySQL host       | `localhost`              |
| `DB_PORT`     | MySQL port       | `3306`                   |
| `DB_USER`     | MySQL user       | `root`                   |
| `DB_PASSWORD` | MySQL password   | ``                       |
| `DB_NAME`     | Database name    | `curriculum_management`  |
| `JWT_SECRET`  | JWT signing key  | Required                 |
| `REDIS_URL`   | Redis connection | `redis://localhost:6379` |

## 🗄️ Database Schema

Complete MySQL schema with 15+ tables:

- **Core:** `tenants`, `campuses`, `users`, `curriculum_frameworks`, `curriculum_framework_versions`
- **Content:** `course_blueprints`, `unit_blueprints`, `unit_resources`
- **Workflow:** `approvals`, `comments`, `audit_logs`
- **Features:** `tags`, `saved_views`, `kct_mappings`
- **Analytics:** `kct_usage_tracking`, `learning_outcomes_tracking`

### Key Relationships

```
Tenant → Campus → Users
Framework → Versions → Courses → Units → Resources
Framework → Mappings → Target (Course/Class)
All entities → Comments/Audit (Collaboration/Compliance)
```

## 🔐 Authentication & Authorization

### JWT Authentication

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@tenant.com",
  "password": "secure_password"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refresh_token_here",
  "expires_in": 86400,
  "user": {
    "id": 123,
    "email": "user@tenant.com",
    "role": "curriculum_designer"
  }
}
```

### Role-Based Access Control

- `viewer` - Read-only access
- `curriculum_designer` - Create/edit drafts
- `qa` - Review and provide feedback
- `program_owner` - Approve versions
- `bgh` - Publish and manage
- `admin` - System administration

## 📡 API Endpoints

### Curriculum Management

```http
GET    /api/v1/kct              # List frameworks
POST   /api/v1/kct              # Create framework
GET    /api/v1/kct/{id}         # Get framework
PATCH  /api/v1/kct/{id}         # Update framework
DELETE /api/v1/kct/{id}         # Delete framework
```

### Version Control

```http
POST   /api/v1/kct/{id}/versions    # Create version
GET    /api/v1/versions/{id}       # Get version details
POST   /api/v1/versions/{id}/submit # Submit for review
POST   /api/v1/versions/{id}/approve # Approve version
POST   /api/v1/versions/{id}/publish # Publish version
```

### Content Management

```http
POST   /api/v1/versions/{id}/courses   # Create course
PATCH  /api/v1/courses/{id}           # Update course
POST   /api/v1/courses/{id}/units      # Create unit
PATCH  /api/v1/units/{id}             # Update unit
POST   /api/v1/units/{id}/resources    # Add resource
```

### Deployment & Mapping

```http
POST   /api/v1/mappings                 # Create mapping
POST   /api/v1/mappings/{id}/apply      # Apply mapping
GET    /api/v1/mappings/{id}/validate   # Validate mapping
```

### Validation & Quality

```http
POST   /api/v1/versions/{id}/validate   # Validate version
GET    /api/v1/kct/{id}/readiness       # Readiness checklist
```

### Export & Publishing

```http
GET    /api/v1/versions/{id}/export     # Export version
GET    /api/v1/exports/{job_id}/status  # Export status
```

### Analytics & Reports

```http
GET    /api/v1/reports/kct/coverage     # Coverage analytics
GET    /api/v1/reports/kct/approval-time # Approval metrics
GET    /api/v1/reports/kct/cefr-matrix  # CEFR coverage
GET    /api/v1/reports/kct/impact       # Impact analysis
```

## 🎯 Business Logic

### Version State Transitions

```
draft → submit → pending_review → approve → published
   ↓                                        ↓
archived                               archived (with rollback)
```

### Validation Rules

1. **Hours Integrity:** Σ(unit.hours) ≈ course.hours (±5%)
2. **CEFR Completeness:** Minimum 80% skill coverage per level
3. **Resource Requirements:** ≥1 resource per unit
4. **Rubric Requirements:** All assessments need rubrics
5. **Link Health:** No broken URLs in resources
6. **Accessibility:** Required features present

### Export Rules

- Draft versions: Watermark always applied
- Published versions: QR verification required
- Campus branding: Automatic application
- Link expiry: Configurable access windows

## 🔄 Background Processing

### Queue System (Bull + Redis)

- **Export Queue:** PDF/DOCX/SCORM generation
- **Validation Queue:** Automated quality checks
- **Health Checks:** Resource validation
- **Notifications:** Email/webhook delivery

### Job Types

```typescript
interface ExportJobData {
  versionId: number;
  format: "pdf" | "docx" | "scorm";
  language: string;
  watermark: boolean;
  userId: number;
  tenantId: number;
}

interface ValidationJobData {
  versionId: number;
  userId: number;
  tenantId: number;
}
```

## 📊 Monitoring & Logging

### Winston Logger

- **Console logging** for development
- **File logging** for production (error, combined, audit)
- **Structured JSON** format
- **Log rotation** and archival

### Audit Trail

- **All changes logged** with before/after states
- **User actions tracked** (create, update, delete, publish)
- **Security events** (login, logout, permission changes)
- **Compliance ready** with tamper-proof logs

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### API Testing

```bash
# Using curl
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## 🚀 Deployment

### Production Setup

1. **Environment variables** configured
2. **SSL certificates** installed
3. **Database connection** optimized
4. **Redis cluster** configured
5. **File storage** (S3/CloudFront) set up
6. **Load balancer** configured
7. **Monitoring** (PM2, New Relic) enabled

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["npm", "start"]
```

### Scaling Considerations

- **Horizontal scaling** with load balancer
- **Database read replicas** for analytics
- **Redis cluster** for queue scalability
- **CDN** for static assets
- **Background job workers** on separate instances

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run unit tests
npm run lint         # Run ESLint
npm run migrate      # Run database migrations
npm run seed         # Seed database with test data
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code consistency
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Jest** for testing framework

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation:** See `/api-documentation.md`
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** support@curriculum-management.com

---

**Version:** 1.0.0
**Last Updated:** October 28, 2024
