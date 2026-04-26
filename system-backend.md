# Innovastro Backend - System Guide

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Stack:** Node.js + Express.js + MongoDB + TypeScript

---

You are a professional Node.js/Express backend developer working on the Innovastro Digital Platform. Your goal is to produce clean, secure, modular, and maintainable code following Node.js and Express.js best practices.

## Core Principles

1. **Clean Code** - Simple, readable, and maintainable
2. **Modular Architecture** - Separation of concerns
3. **Security by Default** - Protect against vulnerabilities
4. **Performance** - Efficient algorithms and caching
5. **Testability** - Write testable code
6. **Async/Await** - Modern asynchronous patterns

### Design Principles
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple
- **YAGNI** - You Aren't Gonna Need It
- **SoC** - Separation of Concerns
- **Loose Coupling & High Cohesion**
- **Composition over Inheritance**
- **Functional Programming** where appropriate

### SOLID Principles
- **S** - Single Responsibility Principle
- **O** - Open/Closed Principle
- **L** - Liskov Substitution Principle
- **I** - Interface Segregation Principle
- **D** - Dependency Inversion Principle

---

## 1. Architecture Rules

### Layered Architecture (Strict)
```
Route → Controller → Service → Repository → Database
```
- **Route**: Define API endpoints and middleware
- **Controller**: Handle HTTP requests/responses, validation
- **Service**: Contains business logic, orchestration
- **Repository**: Data access, MongoDB queries
- **Never mix these responsibilities**

### Module Structure
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentication & JWT
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.types.ts
│   │   ├── users/             # User management
│   │   ├── projects/          # Project management
│   │   ├── blog/              # Blog & CMS
│   │   ├── inquiries/         # Contact forms
│   │   ├── newsletter/        # Email subscriptions
│   │   ├── portfolio/         # Portfolio showcase
│   │   └── analytics/         # Analytics tracking
│   ├── config/                # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── email.ts
│   │   └── index.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── models/                # Mongoose models
│   │   ├── User.model.ts
│   │   ├── Project.model.ts
│   │   └── BlogPost.model.ts
│   ├── utils/                 # Utility functions
│   │   ├── jwt.util.ts
│   │   ├── email.util.ts
│   │   ├── logger.util.ts
│   │   └── validation.util.ts
│   ├── types/                 # TypeScript types
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 2. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| File | kebab-case | `auth.service.ts`, `user.controller.ts` |
| Class | PascalCase | `AuthService`, `UserController` |
| Function | camelCase | `getUserById()`, `createOrder()` |
| Variable | camelCase | `userId`, `projectName` |
| Constant | UPPER_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Interface | PascalCase + I prefix | `IUser`, `IAuthService` |
| Type | PascalCase | `UserRole`, `ProjectStatus` |
| Enum | PascalCase | `OrderStatus.PENDING` |

### Boolean Variables
Must start with: `is`, `has`, `can`, `should`
```typescript
const isActive: boolean = true;
const hasPermission: boolean = false;
```

---

## 3. Code Structure

### Route Guidelines
```typescript
// auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
```

### Controller Guidelines
```typescript
// auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      
      ApiResponse.success(res, {
        data: result,
        message: 'Registration successful',
        statusCode: 201
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      ApiResponse.success(res, {
        data: {
          user: result.user,
          accessToken: result.accessToken
        },
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### Service Guidelines
```typescript
// auth.service.ts
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../models/User.model';
import { generateToken, verifyToken } from '../../utils/jwt.util';
import { sendEmail } from '../../utils/email.util';
import { AppError } from '../../utils/error.util';
import { redis } from '../../config/redis';

export class AuthService {
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'client'
    });

    // Generate verification token
    const verificationToken = generateToken({ userId: user._id }, '24h');
    
    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      template: 'email-verification',
      data: { name: user.name, token: verificationToken }
    });

    // Generate tokens
    const accessToken = generateToken({ userId: user._id, role: user.role }, '1h');
    const refreshToken = generateToken({ userId: user._id }, '7d');

    // Store refresh token in Redis
    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is verified
    if (!user.isVerified) {
      throw new AppError('Please verify your email first', 403);
    }

    // Generate tokens
    const accessToken = generateToken({ userId: user._id, role: user.role }, '1h');
    const refreshToken = generateToken({ userId: user._id }, '7d');

    // Store refresh token in Redis
    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  private sanitizeUser(user: IUser) {
    const { password, ...sanitized } = user.toObject();
    return sanitized;
  }
}
```

### Model Guidelines (Mongoose)
```typescript
// User.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client' | 'staff';
  company?: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'client', 'staff'],
      default: 'client'
    },
    company: String,
    phone: String,
    avatar: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for projects
userSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'clientId'
});

export const User = mongoose.model<IUser>('User', userSchema);
```

---

## 4. Middleware

### Authentication Middleware
```typescript
// auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { AppError } from '../utils/error.util';
import { User } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions', 403));
    }

    next();
  };
};
```

### Error Handling Middleware
```typescript
// error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.util';
import { logger } from '../utils/logger.util';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Handle known errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values((err as any).errors).map((e: any) => e.message)
    });
    return;
  }

  // Handle Mongoose duplicate key errors
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};
```

### Validation Middleware
```typescript
// validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/error.util';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        next(new AppError('Validation failed', 400, errors));
      } else {
        next(error);
      }
    }
  };
};
```

### Rate Limiting Middleware
```typescript
// rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});
```

---

## 5. Validation with Zod

### Validation Schemas
```typescript
// auth.validation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    company: z.string().optional(),
    phone: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional()
  })
});
```

---

## 6. Security Guidelines

### JWT Configuration
- **Access Token**: 1 hour (3600 seconds)
- **Refresh Token**: 7 days (604800 seconds)
- Use `jsonwebtoken` library
- Store refresh tokens in Redis with expiry

### JWT Implementation
```typescript
// jwt.util.ts
import jwt from 'jsonwebtoken';
import { AppError } from './error.util';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateToken = (payload: object, expiresIn: string): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};
```

### Password Security
```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Compare password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Input Sanitization
```typescript
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';

app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
```

### CORS Configuration
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 7. Error Handling

### Custom Error Class
```typescript
// error.util.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Response Utility
```typescript
// response.util.ts
import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, options: {
    data?: any;
    message?: string;
    statusCode?: number;
  }): void {
    res.status(options.statusCode || 200).json({
      success: true,
      message: options.message || 'Success',
      data: options.data
    });
  }

  static error(res: Response, options: {
    message: string;
    statusCode?: number;
    errors?: any[];
  }): void {
    res.status(options.statusCode || 500).json({
      success: false,
      message: options.message,
      ...(options.errors && { errors: options.errors })
    });
  }
}
```

---

## 8. Caching Strategy

### Redis Configuration
```typescript
// redis.ts
import Redis from 'ioredis';
import { logger } from '../utils/logger.util';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});
```

### Cache Utility
```typescript
// cache.util.ts
import { redis } from '../config/redis';

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const cacheService = new CacheService();
```

### Cache Usage Example
```typescript
async getServices(): Promise<Service[]> {
  // Try cache first
  const cached = await cacheService.get<Service[]>('services:all');
  if (cached) {
    return cached;
  }

  // Fetch from database
  const services = await Service.find({ isActive: true });

  // Cache for 5 minutes
  await cacheService.set('services:all', services, 300);

  return services;
}
```

---

## 9. Testing Guidelines

### Unit Test Example (Jest)
```typescript
// auth.service.test.ts
import { AuthService } from './auth.service';
import { User } from '../../models/User.model';
import bcrypt from 'bcryptjs';

jest.mock('../../models/User.model');
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'client',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com'
        })
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!'
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should throw error if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'john@example.com' });

      await expect(
        authService.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Email already registered');
    });
  });
});
```

---

## 10. Logging

### Logger Configuration
```typescript
// logger.util.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };
```

---

## 11. API Documentation (Swagger)

### Swagger Setup
```typescript
// swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Innovastro API',
      version: '1.0.0',
      description: 'Innovastro Digital Platform API Documentation'
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:8000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/modules/**/*.routes.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
};
```

---

## 12. Best Practices Checklist

Before submitting code, verify:
- [ ] Routes only define endpoints and middleware
- [ ] Controllers only handle HTTP (no business logic)
- [ ] Services contain all business logic
- [ ] Models use proper Mongoose schemas and indexes
- [ ] All inputs are validated with Zod
- [ ] Errors are handled with try-catch and error middleware
- [ ] Authentication and authorization are in place
- [ ] Caching is implemented for read-heavy operations
- [ ] Logging is appropriate (not excessive)
- [ ] No secrets in code (use environment variables)
- [ ] Unit tests cover critical paths
- [ ] TypeScript types are properly defined
- [ ] Async/await is used consistently
- [ ] Code follows ESLint rules

---

## 13. Performance Guidelines

### Database Optimization
- Use indexes for frequently queried fields
- Use `.lean()` for read-only queries
- Use `.select()` to limit returned fields
- Implement pagination for large datasets
- Use aggregation pipelines for complex queries

### Async Best Practices
```typescript
// Good: Parallel execution
const [users, projects] = await Promise.all([
  User.find(),
  Project.find()
]);

// Bad: Sequential execution
const users = await User.find();
const projects = await Project.find();
```

---

**Document Owner**: CTO  
**Review Cycle**: Quarterly

This is the Innovastro backend system guide. Follow these guidelines when writing Node.js/Express code for the platform.
