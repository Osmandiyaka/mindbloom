# Hexagonal Architecture (Ports and Adapters)

This backend follows the **Hexagonal Architecture** pattern (also known as Ports and Adapters), which provides clean separation of concerns and makes the codebase more maintainable and testable.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Adapters Layer                        │
│  ┌──────────────────┐              ┌────────────────────┐   │
│  │  HTTP Adapters   │              │ Persistence        │   │
│  │  (Controllers)   │              │ Adapters           │   │
│  │  - REST APIs     │              │ (Repositories)     │   │
│  │  - DTOs          │              │ - Prisma           │   │
│  └──────────────────┘              └────────────────────┘   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Use Cases (Business Logic)               │   │
│  │  - CreateStudentUseCase                              │   │
│  │  - LoginUseCase                                      │   │
│  │  - GetAllStudentsUseCase                             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                          │
│  ┌──────────────┐        ┌──────────────────────────────┐   │
│  │  Entities    │        │  Ports (Interfaces)          │   │
│  │  - Student   │        │  - IStudentRepository        │   │
│  │  - User      │        │  - IUserRepository           │   │
│  └──────────────┘        └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. **Domain Layer** (`/src/domain`)
The core of the application containing business entities and rules.

- **Entities**: Core business objects with their behavior
  - `Student`, `User`, `Class`, etc.
  - Pure TypeScript classes with business logic
  - No framework dependencies

- **Ports** (Interfaces): Define contracts for external dependencies
  - `IStudentRepository`, `IUserRepository`
  - Define what operations are needed without implementation details
  - Allow dependency inversion

**Example:**
```typescript
// domain/student/entities/student.entity.ts
export class Student {
  constructor(
    public readonly id: string,
    public readonly name: string,
    // ...
  ) {}

  isActive(): boolean {
    return this.status === 'Active';
  }
}

// domain/student/ports/student.repository.interface.ts
export interface IStudentRepository {
  findAll(): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  create(student: Student): Promise<Student>;
}
```

### 2. **Application Layer** (`/src/application`)
Contains use cases (application-specific business rules).

- **Use Cases**: Orchestrate the flow of data and business logic
  - One use case per business operation
  - Depends on domain entities and port interfaces
  - Independent of external frameworks

**Example:**
```typescript
// application/student/use-cases/create-student.use-case.ts
@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository
  ) {}

  async execute(command: CreateStudentCommand): Promise<Student> {
    const student = Student.create(command);
    return await this.studentRepository.create(student);
  }
}
```

### 3. **Infrastructure/Adapters Layer**

#### **Persistence Adapters** (`/src/infrastructure/persistence`)
Implement repository ports using specific technologies.

- Concrete implementations of repository interfaces
- Handle database operations using Prisma
- Convert between domain entities and database models

**Example:**
```typescript
// infrastructure/persistence/prisma/repositories/prisma-student.repository.ts
@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Student[]> {
    const students = await this.prisma.student.findMany();
    return students.map(this.toDomain);
  }
}
```

#### **HTTP Adapters** (`/src/adapters/http`)
Handle HTTP requests and responses.

- **Controllers**: REST API endpoints
- **DTOs**: Data Transfer Objects for request/response validation
- Convert between DTOs and domain entities

**Example:**
```typescript
// adapters/http/students/students.controller.ts
@Controller('students')
export class StudentsController {
  constructor(
    private readonly createStudentUseCase: CreateStudentUseCase
  ) {}

  @Post()
  async create(@Body() dto: CreateStudentDto) {
    const student = await this.createStudentUseCase.execute(dto);
    return StudentResponseDto.fromDomain(student);
  }
}
```

### 4. **Module Layer** (`/src/modules`)
Wires everything together using NestJS dependency injection.

**Example:**
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [
    {
      provide: STUDENT_REPOSITORY,
      useClass: PrismaStudentRepository,
    },
    CreateStudentUseCase,
    GetAllStudentsUseCase,
  ],
})
export class StudentsModule {}
```

## Directory Structure

```
src/
├── domain/                       # Domain layer (entities & ports)
│   ├── student/
│   │   ├── entities/
│   │   │   └── student.entity.ts
│   │   └── ports/
│   │       └── student.repository.interface.ts
│   └── user/
│       ├── entities/
│       │   └── user.entity.ts
│       └── ports/
│           └── user.repository.interface.ts
│
├── application/                  # Use cases
│   ├── student/
│   │   └── use-cases/
│   │       ├── create-student.use-case.ts
│   │       ├── get-all-students.use-case.ts
│   │       ├── get-student-by-id.use-case.ts
│   │       ├── update-student.use-case.ts
│   │       └── delete-student.use-case.ts
│   └── auth/
│       └── use-cases/
│           ├── login.use-case.ts
│           └── register.use-case.ts
│
├── infrastructure/               # Infrastructure adapters
│   └── persistence/
│       └── prisma/
│           └── repositories/
│               ├── prisma-student.repository.ts
│               └── prisma-user.repository.ts
│
├── adapters/                     # Input adapters
│   └── http/
│       ├── students/
│       │   ├── students.controller.ts
│       │   └── dto/
│       │       ├── create-student.dto.ts
│       │       ├── update-student.dto.ts
│       │       └── student-response.dto.ts
│       └── auth/
│           ├── auth.controller.ts
│           └── dto/
│               ├── login.dto.ts
│               ├── register.dto.ts
│               ├── login-response.dto.ts
│               └── user-response.dto.ts
│
├── modules/                      # NestJS modules (DI configuration)
│   ├── students/
│   │   └── students.module.ts
│   └── auth/
│       └── auth.module.ts
│
└── common/                       # Shared utilities
    └── prisma/
        ├── prisma.module.ts
        └── prisma.service.ts
```

## Benefits of This Architecture

1. **Testability**: Easy to test business logic in isolation
   - Mock repository interfaces for testing use cases
   - Test domain entities without any infrastructure

2. **Flexibility**: Easy to swap implementations
   - Switch from Prisma to TypeORM or any other ORM
   - Change from REST to GraphQL
   - Add different persistence strategies

3. **Maintainability**: Clear separation of concerns
   - Business logic is isolated in domain and application layers
   - Infrastructure details don't leak into business logic

4. **Domain-Centric**: Business logic is the focus
   - Domain entities contain business rules
   - Use cases orchestrate business operations
   - Infrastructure is just a detail

5. **Framework Independence**: Core business logic doesn't depend on NestJS
   - Can migrate to another framework more easily
   - Business logic remains stable

## Dependency Flow

```
Controllers → Use Cases → Domain Entities
     ↓           ↓
   DTOs    Port Interfaces
                  ↑
           Repository Implementations
```

**Key Principle**: Dependencies point inward. Outer layers depend on inner layers, never the reverse.

## Adding New Features

1. **Create Domain Entity** (if needed)
   - Define in `domain/{entity}/entities/`
   
2. **Define Port Interface** (if needed)
   - Create in `domain/{entity}/ports/`

3. **Implement Use Cases**
   - Add in `application/{entity}/use-cases/`
   - Inject port interfaces

4. **Create Repository Adapter**
   - Implement in `infrastructure/persistence/prisma/repositories/`

5. **Create HTTP Adapter**
   - Add controller in `adapters/http/{entity}/`
   - Define DTOs for request/response

6. **Wire with Module**
   - Configure DI in `modules/{entity}/`

## Testing Strategy

```typescript
// Unit test - Use Case with mocked repository
describe('CreateStudentUseCase', () => {
  it('should create a student', async () => {
    const mockRepository = {
      create: jest.fn().mockResolvedValue(student)
    };
    
    const useCase = new CreateStudentUseCase(mockRepository);
    const result = await useCase.execute(command);
    
    expect(result).toBe(student);
  });
});

// Integration test - Controller with real use case
describe('StudentsController', () => {
  let controller: StudentsController;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [CreateStudentUseCase, mockRepository],
    }).compile();
    
    controller = module.get<StudentsController>(StudentsController);
  });
});
```

## References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
