---
title: 'REST API Design Cheatsheet'
slug: 'api-cheatsheet'
description: 'Quick reference guide for designing RESTful APIs with best practices'
type: 'cheatsheet'
requiresSubscription: false
requiredTier: null
priceInCents: null
priceInCredits: 500
published: true
---

# REST API Design Cheatsheet

A quick reference guide for API design patterns, HTTP best practices, and common pitfalls.

## HTTP Methods

| Method | Purpose           | Idempotent | Safe |
| ------ | ----------------- | ---------- | ---- |
| GET    | Retrieve resource | Yes        | Yes  |
| POST   | Create resource   | No         | No   |
| PUT    | Replace resource  | Yes        | No   |
| PATCH  | Partial update    | No         | No   |
| DELETE | Remove resource   | Yes        | No   |

## Status Codes

### 2xx Success

- **200 OK** - Request succeeded
- **201 Created** - Resource created
- **204 No Content** - Success with no response body

### 4xx Client Error

- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - No permission
- **404 Not Found** - Resource not found

### 5xx Server Error

- **500 Internal Server Error** - Server error
- **502 Bad Gateway** - Gateway error
- **503 Service Unavailable** - Service temporarily down

## Request Headers

```
Content-Type: application/json
Authorization: Bearer {token}
X-Request-ID: {unique-id}
Accept: application/json
```

## Response Format

```json
{
  "success": true,
  "data": {
    /* ... */
  },
  "error": null,
  "meta": {
    "timestamp": "2024-02-21T10:00:00Z",
    "version": "v1"
  }
}
```

## API Versioning

- **URL Versioning** (preferred): `/api/v1/users`
- **Header Versioning**: `API-Version: 1`
- **Query Parameter**: `?version=1`

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1613898000
```

## Download Formats

This cheatsheet includes:

- PDF version (1 page)
- PNG image (high resolution)
- Markdown source file

**Price:** 500 credits (one-time access)
