# API v1

Base URL: `/api/v1`

Autentikasi: `Authorization: Bearer <token>`  
Tenant: header `X-Organization-Id`

## Auth

- `POST /auth/login` `{ email, password }`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/organization` `{ organization_id }`

## Training

- `GET /programs`
- `GET /programs/{id}`
- `GET /lessons/{id}`
- `POST /quizzes/{id}/attempts`
- `GET /labs` · `GET /labs/{id}`
- `GET /challenges` · `GET /challenges/{id}`

## Project & BIM document

- `GET|POST /projects`
- `GET|PUT|DELETE /projects/{id}`
- `GET|PUT /projects/{id}/document`
- `POST /projects/{id}/operations`
- `GET|POST /projects/{id}/levels`
- `GET|POST /projects/{id}/grids`
- `GET|POST /projects/{id}/elements`
- `POST /projects/{id}/elements/batch`
- `GET|POST /projects/{id}/versions`
- `POST /projects/{id}/validate`
- `POST /projects/{id}/submit`
- `POST /projects/{id}/ifc/export`

Dokumen BIM (source of truth):

```json
{
  "schemaVersion": "1.0.0",
  "project": {},
  "levels": [],
  "grids": [],
  "elements": [],
  "materials": [],
  "settings": {}
}
```

Mesh Babylon tidak disimpan.

## Submission & review

- `GET /submissions`
- `GET /submissions/{id}`
- `POST /submissions/{id}/review`
- `POST /submissions/{id}/revision`
- `POST /submissions/{id}/approve`

## Issues

- `GET|POST /projects/{id}/issues`
- `PUT /issues/{id}`
- `POST /issues/{id}/comments`

## Sertifikat publik

- `GET /certificates/verify/{token}`
