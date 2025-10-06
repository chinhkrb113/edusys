# Curriculum Management API Documentation

## Overview

REST API for comprehensive curriculum framework management with AI assistance, version control, and enterprise features.

**Base URL:** `https://api.syseduai.com/v1`

**Authentication:** JWT Bearer Token

```
Authorization: Bearer <token>
```

**Content-Type:** `application/json`

**Rate Limits:** 1000 requests/hour per tenant

---

## 1. Authentication & Authorization

### POST /auth/login

Login with email/password

**Request:**

```json
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
  "expires_in": 3600,
  "user": {
    "id": 123,
    "email": "user@tenant.com",
    "full_name": "John Doe",
    "role": "curriculum_designer",
    "tenant_id": 1
  }
}
```

### POST /auth/refresh

Refresh access token

**Request:**

```json
{
  "refresh_token": "refresh_token_here"
}
```

---

## 2. Curriculum Frameworks

### GET /kct

List curriculum frameworks with filtering

**Query Parameters:**

- `status` - draft,pending_review,approved,published,archived
- `language` - en,vi,jp
- `age_group` - kids,teens,adults
- `target_level` - CEFR A1, IELTS 6.0
- `owner_user_id` - Filter by owner
- `campus_id` - Filter by campus
- `tag` - Tag name
- `q` - Search query
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20)
- `sort` - created_at,updated_at,name

**Response:**

```json
{
  "data": [
    {
      "id": 101,
      "code": "EN-KIDS-A1",
      "name": "English for Kids A1",
      "language": "en",
      "age_group": "kids",
      "target_level": "CEFR A1",
      "total_hours": 120,
      "status": "published",
      "owner_user_id": 7,
      "latest_version": {
        "id": 501,
        "version_no": "v1.2",
        "state": "published"
      },
      "tags": ["Kids", "Foundation"],
      "updated_at": "2024-10-28T10:00:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 63,
  "total_pages": 4
}
```

### POST /kct

Create new curriculum framework

**Request:**

```json
{
  "code": "EN-KIDS-A1",
  "name": "English for Kids A1",
  "language": "en",
  "target_level": "CEFR A1",
  "age_group": "kids",
  "total_hours": 120,
  "owner_user_id": 7,
  "campus_id": 2,
  "description": "Foundation English program for children aged 6-9",
  "learning_objectives": [
    "Basic greetings and introductions",
    "Family vocabulary",
    "Simple present tense"
  ]
}
```

**Response:** 201 Created

```json
{
  "id": 101,
  "code": "EN-KIDS-A1",
  "name": "English for Kids A1",
  "status": "draft",
  "created_at": "2024-10-28T10:00:00Z",
  "updated_at": "2024-10-28T10:00:00Z"
}
```

### GET /kct/{id}

Get curriculum framework details

**Response:**

```json
{
  "id": 101,
  "code": "EN-KIDS-A1",
  "name": "English for Kids A1",
  "language": "en",
  "target_level": "CEFR A1",
  "age_group": "kids",
  "total_hours": 120,
  "status": "published",
  "owner_user_id": 7,
  "latest_version_id": 501,
  "description": "Foundation program...",
  "learning_objectives": ["..."],
  "prerequisites": ["None"],
  "assessment_strategy": "Continuous assessment with portfolio",
  "created_by": 5,
  "updated_by": 7,
  "created_at": "2024-09-01T00:00:00Z",
  "updated_at": "2024-10-28T10:00:00Z"
}
```

### PATCH /kct/{id}

Update curriculum framework

**Request:** (only changed fields)

```json
{
  "name": "English for Young Learners A1",
  "description": "Updated description",
  "total_hours": 130
}
```

### DELETE /kct/{id}

Soft delete curriculum framework

---

## 3. Version Management

### POST /kct/{id}/versions

Create new version

**Request:**

```json
{
  "version_no": "v1.0",
  "changelog": "Initial version with 3 courses and 15 units"
}
```

**Response:** 201 Created

```json
{
  "id": 501,
  "framework_id": 101,
  "version_no": "v1.0",
  "state": "draft",
  "changelog": "Initial version...",
  "created_by": 7,
  "created_at": "2024-10-28T10:00:00Z"
}
```

### GET /versions/{version_id}

Get version details with full structure

**Query Parameters:**

- `expand` - courses,units,resources (comma-separated)

**Response:**

```json
{
  "id": 501,
  "framework_id": 101,
  "version_no": "v1.0",
  "state": "draft",
  "is_frozen": false,
  "changelog": "Initial version...",
  "courses": [
    {
      "id": 201,
      "title": "Greetings and Basics",
      "level": "A1",
      "hours": 40,
      "order_index": 1,
      "units": [
        {
          "id": 301,
          "title": "Hello and Goodbye",
          "objectives": ["Greet people", "Say goodbye"],
          "skills": ["speaking", "listening"],
          "hours": 4,
          "completeness_score": 85,
          "resources": [
            {
              "id": 401,
              "title": "Greeting Flashcards",
              "kind": "pdf",
              "url": "https://...",
              "ai_tags": { "skill": "speaking", "level": "A1" }
            }
          ]
        }
      ]
    }
  ],
  "created_at": "2024-10-28T10:00:00Z"
}
```

### POST /versions/{version_id}/submit

Submit for review

**Request:**

```json
{
  "note": "Ready for QA review"
}
```

### POST /versions/{version_id}/approve

Approve version (BGH/Program Owner only)

**Request:**

```json
{
  "note": "Approved with minor suggestions"
}
```

### POST /versions/{version_id}/publish

Publish version

**Request:**

```json
{
  "note": "Release to production"
}
```

---

## 4. Course & Unit Management

### POST /versions/{version_id}/courses

Create course

**Request:**

```json
{
  "code": "EN-A1-C1",
  "title": "Greetings and Introductions",
  "level": "A1",
  "hours": 40,
  "order_index": 1,
  "summary": "Basic communication skills",
  "learning_outcomes": ["Can greet people", "Can introduce themselves"]
}
```

### PATCH /courses/{course_id}

Update course

### POST /courses/{course_id}/units

Create unit

**Request:**

```json
{
  "title": "Hello and Goodbye",
  "objectives": [
    "Greet people formally and informally",
    "Say goodbye appropriately"
  ],
  "skills": ["speaking", "listening"],
  "activities": [
    { "type": "class", "name": "Role-play greetings", "duration": 15 },
    { "type": "group", "name": "Pair introductions", "duration": 20 }
  ],
  "rubric": {
    "criteria": [
      {
        "name": "Pronunciation",
        "levels": [
          { "score": 1, "description": "Unclear pronunciation" },
          { "score": 2, "description": "Mostly clear" },
          { "score": 3, "description": "Clear pronunciation" }
        ]
      }
    ]
  },
  "homework": "Practice greetings with family",
  "hours": 4,
  "order_index": 1
}
```

### POST /units/{unit_id}/resources

Add resource

**Request:**

```json
{
  "kind": "pdf",
  "title": "Greeting Flashcards",
  "description": "Printable flashcards for practice",
  "url": "https://cdn.example.com/flashcards.pdf",
  "ai_tags": {
    "skill": "speaking",
    "level": "A1",
    "topic": "greetings",
    "confidence": 0.92
  },
  "manual_tags": ["interactive", "printable"],
  "license_type": "CC-BY",
  "is_required": true
}
```

### POST /units:reorder

Reorder units within course

**Request:**

```json
{
  "course_id": 201,
  "orders": [
    { "unit_id": 301, "order_index": 1 },
    { "unit_id": 302, "order_index": 2 }
  ]
}
```

---

## 5. Mapping & Deployment

### POST /mappings

Create KCT mapping

**Request:**

```json
{
  "framework_id": 101,
  "version_id": 501,
  "target_type": "class_instance",
  "target_id": 9001,
  "campus_id": 2,
  "rollout_batch": "campus-a-phase-1"
}
```

**Response:**

```json
{
  "id": 701,
  "status": "planned",
  "mismatch_report": {
    "hours_diff": 2,
    "age_group_mismatch": false,
    "skills_gap": ["writing"],
    "level_mismatch": "minor"
  },
  "risk_assessment": "medium",
  "can_proceed": true
}
```

### POST /mappings/{id}/apply

Apply mapping to target

**Request:**

```json
{
  "override_reason": "Writing will be covered in separate module"
}
```

---

## 6. Validation & Guardrails

### POST /versions/{version_id}/validate

Validate version against rules

**Response:**

```json
{
  "ok": false,
  "errors": [
    {
      "code": "HOURS_MISMATCH",
      "message": "Unit hours (38) != course hours (40)",
      "course_id": 201,
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "code": "MISSING_RESOURCE",
      "message": "Unit lacks required resource",
      "unit_id": 301,
      "severity": "warning"
    }
  ],
  "readiness_score": 75
}
```

### GET /kct/{id}/readiness

Get readiness checklist

**Response:**

```json
{
  "overall_ready": false,
  "checks": {
    "hours_validation": true,
    "cefr_completeness": false,
    "rubric_requirements": true,
    "resource_minimums": true,
    "broken_links": true,
    "accessibility": false
  },
  "blocking_issues": [
    "CEFR completeness below 80% threshold",
    "Missing accessibility features"
  ]
}
```

---

## 7. Export & Publishing

### GET /versions/{version_id}/export

Export version

**Query Parameters:**

- `format` - pdf,docx,scorm
- `lang` - vi,en,dual
- `watermark` - auto,force,none
- `campus` - campus_id for branding

**Response:** 302 Redirect to download URL

### GET /exports/{job_id}/status

Check export status

**Response:**

```json
{
  "job_id": "export-123",
  "status": "completed",
  "progress": 100,
  "file_url": "https://cdn.example.com/exports/kct-101-v1.2.pdf",
  "checksum": "sha256:abc123...",
  "qr_code_url": "https://cdn.example.com/qr/export-123.png",
  "expires_at": "2025-10-28T10:00:00Z"
}
```

---

## 8. Analytics & Reports

### GET /reports/kct/coverage

Coverage analytics

**Query Parameters:**

- `scope` - campus,program,level
- `date_from` - YYYY-MM-DD
- `date_to` - YYYY-MM-DD

**Response:**

```json
{
  "overall_coverage": 87.5,
  "by_campus": [
    { "campus_id": 2, "name": "Campus A", "coverage": 92.3 },
    { "campus_id": 3, "name": "Campus B", "coverage": 82.1 }
  ],
  "by_program": [
    { "program": "Business English", "coverage": 95.0 },
    { "program": "IELTS", "coverage": 80.2 }
  ],
  "outdated_count": 5,
  "last_updated": "2024-10-28T10:00:00Z"
}
```

### GET /reports/kct/approval-time

Approval workflow analytics

**Response:**

```json
{
  "median_days": 7.2,
  "p95_days": 21.5,
  "by_reviewer": [
    { "reviewer_id": 8, "name": "Alice Johnson", "avg_days": 5.3 },
    { "reviewer_id": 9, "name": "Bob Smith", "avg_days": 9.1 }
  ],
  "bottlenecks": [
    {
      "stage": "pending_review",
      "avg_days": 12.4,
      "recommendation": "Increase reviewer capacity"
    }
  ]
}
```

### GET /reports/kct/cefr-matrix

CEFR coverage matrix

**Query Parameters:**

- `version_id` - Specific version
- `framework_id` - All versions of framework

**Response:**

```json
{
  "cefr_levels": ["A1", "A2", "B1", "B2"],
  "skills": ["listening", "speaking", "reading", "writing"],
  "coverage_matrix": {
    "A1": {
      "listening": 95,
      "speaking": 90,
      "reading": 85,
      "writing": 80
    },
    "A2": {
      "listening": 88,
      "speaking": 85,
      "reading": 90,
      "writing": 82
    }
  },
  "gaps": [
    { "cefr": "B2", "skill": "writing", "coverage": 68, "threshold": 80 }
  ]
}
```

### GET /reports/kct/impact

Curriculum impact analysis

**Query Parameters:**

- `version_id` - Version to analyze
- `window_days` - Analysis window (default: 90)

**Response:**

```json
{
  "version": "Business English B1-B2 v1.2",
  "rollout_date": "2024-09-15",
  "sample_size": 145,
  "confidence": 0.92,
  "metrics": {
    "pass_rate": {
      "before": 72.5,
      "after": 78.3,
      "change": 5.8,
      "p_value": 0.03
    },
    "completion_rate": {
      "before": 85.2,
      "after": 89.1,
      "change": 3.9,
      "p_value": 0.01
    },
    "avg_score": {
      "before": 7.2,
      "after": 7.8,
      "change": 0.6,
      "p_value": 0.02
    }
  },
  "conclusion": "Significant positive impact with 92% confidence"
}
```

---

## 9. Collaboration

### GET /comments

List comments

**Query Parameters:**

- `entity_type` - framework,version,course,unit,resource
- `entity_id` - Entity ID
- `resolved` - true/false
- `author_id` - Filter by author

**Response:**

```json
{
  "data": [
    {
      "id": 1001,
      "entity_type": "unit",
      "entity_id": 301,
      "author_id": 7,
      "author_name": "Alice Johnson",
      "body": "@Bob please check the rubric criteria",
      "mentions": [8],
      "is_resolved": false,
      "created_at": "2024-10-28T09:00:00Z"
    }
  ]
}
```

### POST /comments

Create comment

**Request:**

```json
{
  "entity_type": "unit",
  "entity_id": 301,
  "body": "The pronunciation rubric needs more detail",
  "mentions": [8, 9]
}
```

### POST /comments/{id}/resolve

Resolve comment

**Request:**

```json
{
  "note": "Updated rubric with detailed criteria"
}
```

---

## 10. Saved Views

### POST /saved-views

Save view configuration

**Request:**

```json
{
  "name": "Kids A1 Drafts",
  "view_type": "framework_list",
  "is_shared": true,
  "filters": {
    "age_group": "kids",
    "target_level": "A1",
    "status": ["draft"]
  },
  "columns": ["name", "status", "owner", "updated_at"],
  "sort_config": {
    "col": "updated_at",
    "dir": "desc"
  }
}
```

### GET /saved-views

List saved views

**Query Parameters:**

- `shared` - true for shared views
- `view_type` - framework_list,unit_editor,reports

---

## Error Responses

### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "version_no",
      "issue": "must match pattern v\\d+\\.\\d+"
    }
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User lacks required role: bgh"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Version v1.1 already exists"
  }
}
```

### 422 Unprocessable Entity

```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot publish: CEFR completeness below threshold",
    "details": {
      "cefr_level": "B2",
      "current_coverage": 68,
      "required_minimum": 80
    }
  }
}
```

---

## Webhooks

### Configuration

Set webhook URLs in tenant settings:

```json
{
  "webhook_endpoints": [
    {
      "url": "https://external-system.com/webhooks",
      "events": ["kct.version.published", "kct.mapping.applied"],
      "secret": "webhook_secret"
    }
  ]
}
```

### Event Payloads

#### kct.version.submitted

```json
{
  "event": "kct.version.submitted",
  "timestamp": "2024-10-28T10:00:00Z",
  "tenant_id": 1,
  "framework": {
    "id": 101,
    "code": "EN-KIDS-A1",
    "name": "English for Kids A1"
  },
  "version": {
    "id": 501,
    "version_no": "v1.0",
    "submitted_by": 7
  }
}
```

#### kct.version.published

```json
{
  "event": "kct.version.published",
  "timestamp": "2024-10-28T11:00:00Z",
  "tenant_id": 1,
  "framework": {
    "id": 101,
    "code": "EN-KIDS-A1"
  },
  "version": {
    "id": 501,
    "version_no": "v1.0",
    "published_by": 8
  },
  "export_urls": {
    "pdf": "https://cdn.example.com/kct-101-v1.0.pdf",
    "scorm": "https://cdn.example.com/kct-101-v1.0-scorm.zip"
  }
}
```

#### kct.mapping.applied

```json
{
  "event": "kct.mapping.applied",
  "timestamp": "2024-10-28T12:00:00Z",
  "tenant_id": 1,
  "mapping": {
    "id": 701,
    "framework_id": 101,
    "version_id": 501,
    "target_type": "class_instance",
    "target_id": 9001,
    "campus_id": 2,
    "applied_by": 9
  }
}
```

---

## Business Rules & Validation

### Version State Transitions

```
draft → submit → pending_review → approve → published
   ↓                                        ↓
archived                               archived
```

### Permissions by Role

- **viewer**: Read-only access
- **curriculum_designer**: Create/edit drafts, submit for review
- **qa**: Review and provide feedback
- **program_owner**: Approve/reject versions
- **bgh**: Full access + publish
- **admin**: System administration

### Validation Rules

1. **Hours Integrity**: Σ(unit.hours) ≈ course.hours (± tolerance)
2. **CEFR Completeness**: Minimum skill coverage per level
3. **Resource Requirements**: At least one resource per unit
4. **Rubric Requirements**: Assessments need rubrics
5. **Link Health**: No broken resource URLs
6. **Accessibility**: Required features present

### Export Rules

- Draft versions: Watermark always applied
- Published versions: QR verification required
- Campus branding: Applied based on export settings
- File expiry: Configurable per export type

This API provides comprehensive curriculum management with enterprise-grade features for educational institutions.
