Refind Summary (Multi-School Gap Closure)

Backend
- Added a School domain model with enums for type/status and structured address/contact/settings fields in `backend/src/domain/school/entities/school.entity.ts`.
- Introduced a school repository contract and token in `backend/src/domain/ports/out/school-repository.port.ts` and `backend/src/domain/ports/out/repository.tokens.ts`.
- Implemented a Mongoose school schema with tenant scoping, indexes, and unique code constraint in `backend/src/infrastructure/adapters/persistence/mongoose/schemas/school.schema.ts`.
- Added a tenant-scoped Mongoose repository for school CRUD access in `backend/src/infrastructure/adapters/persistence/mongoose/mongoose-school.repository.ts`.
- Implemented school list and create use cases with tenant-based code generation in `backend/src/application/services/school/*`.
- Added DTOs for school create requests and responses in `backend/src/presentation/dtos/requests/schools/create-school.dto.ts` and `backend/src/presentation/dtos/responses/schools/school.response.dto.ts`.
- Exposed `GET /schools` and `POST /schools` with tenant context enforcement in `backend/src/presentation/controllers/schools.controller.ts`.
- Wired the new Schools module and schema into the application in `backend/src/modules/schools/schools.module.ts` and `backend/src/app.module.ts`.

Frontend
- School selector now consumes `GET /schools` via `frontend/src/app/core/school/school.service.ts` and persists active school state in `frontend/src/app/core/school/school-context.service.ts`.
- Top bar shows the active school (single school case) or a dropdown when multiple schools exist in `frontend/src/app/shared/components/global-toolbar/global-toolbar.component.html`.
- Added school context header injection with `X-School-Id` in `frontend/src/app/core/interceptors/school-context.interceptor.ts` and wired it in `frontend/src/app/app.config.ts`.
- School switching now includes search/filter, empty state, and a Manage Schools link in `frontend/src/app/shared/components/global-toolbar/global-toolbar.component.html` and `frontend/src/app/shared/components/global-toolbar/global-toolbar.component.scss`.
- School context publishes change events for data refresh consumers in `frontend/src/app/core/school/school-context.service.ts`.
