# EduTrack - Complete Technology Stack & Learning Guide

## Project Overview
**EduTrack** is a comprehensive **Educational Management System** designed to track student performance, attendance, grades, and predict academic risk using machine learning. It's a full-stack application with multiple backends, frontend interfaces, and ML services.

---

## 📊 FRONTEND TECHNOLOGIES

### Core Framework
- **React 19.2.4** - Modern JavaScript UI library for building component-based interfaces
- **React Router DOM 7.13.1** - Client-side routing for multi-page navigation
- **React DOM 19.2.4** - React rendering library for the browser

### Build & Development Tools
- **Vite 8.0.0** - Lightning-fast frontend build tool (alternative to Webpack)
  - Instant server startup
  - Hot Module Replacement (HMR)
  - Optimized production builds
- **@vitejs/plugin-react 6.0.0** - React plugin for Vite with Fast Refresh

### Styling & Theming
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
  - Rapid UI prototyping
  - Responsive design system
  - Pre-built component utilities
- **PostCSS 8.5.8** - CSS transformation tool
- **Autoprefixer 10.4.27** - Automatically adds vendor prefixes for cross-browser support

### HTTP & Data
- **Axios 1.14.0** - Promise-based HTTP client for API requests
  - Cleaner than fetch API
  - Request/response interceptors
  - Built-in error handling

### Data Processing
- **XLSX 0.18.5** - Excel file reading/writing
  - Import student data from CSV/Excel
  - Export reports to Excel format

### Code Quality
- **ESLint 9.39.4** - JavaScript linter for code quality
  - Catches bugs early
  - Enforces coding standards
- **eslint-plugin-react-hooks 7.0.1** - React hooks best practices
- **eslint-plugin-react-refresh 0.5.2** - React Fast Refresh enforcement
- **@types/react & @types/react-dom** - TypeScript types for React

---

## 🔙 BACKEND TECHNOLOGIES

### Web Framework
- **Flask 3.1.0** - Lightweight Python web framework
  - Micro-framework approach
  - Easy to extend
  - Perfect for REST APIs
  - Modular blueprint system for organizing routes

### CORS & APIs
- **Flask-Cors 5.0.0** - Handle Cross-Origin Resource Sharing
  - Allow frontend to communicate with backend
  - Configure allowed origins
  - Enable credentials support

### Database Connectors
- **PyMongo 4.10.1** - MongoDB driver for Python
  - Document-oriented database
  - Flexible schema
  - Used for development/testing
- **MySQL Connector Python 9.2.0** - MySQL/MariaDB driver
  - Traditional relational database
  - Can run both MongoDB and MySQL simultaneously
  - Schema-based structure with foreign keys

### Security & Authentication
- **bcrypt 4.2.0** - Password hashing library
  - One-way password encryption
  - Salt rounds for security
  - Industry standard
- **PyJWT 2.10.1** - JSON Web Token (JWT) implementation
  - Token-based authentication
  - Stateless session management
  - Used for user login/authorization

### Environment Configuration
- **python-dotenv 1.0.1** - Load environment variables from .env files
  - Secure sensitive data
  - Configuration management
  - No hardcoded credentials

### Backend API Structure
The backend implements a **layered architecture**:

```
backend/
├── app.py                 # Flask application setup & blueprints
├── config.py             # Configuration from environment
├── models/               # Database models & operations
│   ├── user_model.py           # User authentication & roles
│   ├── student_model.py        # Student records
│   ├── attendance_model.py     # Attendance tracking
│   ├── grade_model.py          # Grade management
│   ├── marks_model.py          # Individual marks
│   ├── event_model.py          # Academic events
│   ├── resource_model.py       # Learning resources
│   └── risk_model.py           # Risk calculations
├── routes/               # API endpoints
│   ├── auth_routes.py          # Login, registration
│   ├── student_routes.py       # CRUD operations
│   ├── attendance_routes.py    # Attendance management
│   ├── grade_routes.py         # Grade operations
│   ├── marks_routes.py         # Marks management
│   ├── analytics_routes.py     # Analytics & reporting
│   ├── risk_routes.py          # Risk assessment
│   ├── prediction_routes.py    # CGPA prediction
│   ├── event_routes.py         # Event management
│   ├── resource_routes.py      # Resource sharing
│   ├── system_routes.py        # System utilities
│   └── external_ml_routes.py   # ML service integration
└── database/
    ├── db.py                   # MongoDB connection
    └── mysql_db.py            # MySQL connection
```

### Key API Endpoints
- `/api/auth` - Authentication (login, register, logout)
- `/api/students` - Student CRUD operations
- `/api/attendance` - Attendance tracking
- `/api/marks` - Marks management
- `/api/grades` - Grade operations
- `/api/analytics` - Analytics & reports
- `/api/risk` - Risk assessment
- `/api/predict-cgpa` - CGPA prediction
- `/api/events` - Event management
- `/api/resources` - Resource sharing
- `/api/system` - System operations

---

## 🤖 MACHINE LEARNING SERVICES

### Core ML Libraries
- **scikit-learn** - Machine learning library
  - Random Forest classifier for risk prediction
  - Model training & evaluation
  - Cross-validation
  - Feature scaling
- **NumPy** - Numerical computing library
  - Arrays and matrix operations
  - Mathematical computations
- **Pandas** - Data manipulation library
  - DataFrames for structured data
  - Data cleaning & preprocessing
  - Data aggregation
- **joblib** - Model serialization
  - Save/load trained models
  - Persist ML models to disk

### ML Models Implemented
1. **Risk Prediction Model**
   - Predicts student risk level (Low/Medium/High)
   - Features: quiz avg, assignment avg, exam avg, practical avg, attendance %
   - Algorithm: Random Forest Classifier
   - Uses scoring system for risk calculation

2. **GPA Forecasting Model**
   - Predicts future CGPA based on historical data
   - Time series analysis
   - Student performance forecasting

### ML Service Stack
- **Flask** - Same as backend for serving ML models
- **Flask-Cors** - Enable cross-origin requests for ML endpoints
- **Notebooks (Jupyter)** - RiskPrediction_updated.ipynb, GPAforecasting.ipynb
  - Model development & experimentation
  - Data analysis

### ML API Endpoints
- `/health` - Health check
- `/predict` - Risk prediction endpoint
  - Accepts raw scores or pre-computed averages
  - Returns risk level + suggestions

---

## 💾 DATABASE TECHNOLOGIES

### MongoDB (NoSQL)
- **Document-based storage**
- Collections for: users, students, attendance, grades, marks
- Flexible schema
- Indexes for performance optimization
- Used for development flexibility

### MySQL (Relational)
- **Schema-based structure**
- Tables: users, students, faculty, courses, enrollment, attendance, marks, grades, risk_prediction
- Foreign key relationships
- ENUM types for status fields
- UNIQUE constraints for data integrity
- Dual-database support for flexibility and migration

### Database Abstraction
- Both MongoDB and MySQL can run simultaneously
- Configuration in `config.py`: `DB_BACKEND` can be "mongo", "mysql", or "both"
- Models handle differences transparently

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### JWT (JSON Web Tokens)
- Stateless authentication
- Token issued on login
- Validated on protected routes
- Roles: admin, faculty, student, counsellor

### Password Security
- bcrypt hashing with salt rounds
- Never store plain passwords
- Migration scripts to hash existing passwords

### User Roles & Permissions
1. **Admin** - Full system access
2. **Faculty** - Marks entry, attendance tracking
3. **Student** - View own records, analytics
4. **Counsellor** - Monitor assigned students

---

## 📦 PROJECT STRUCTURE OVERVIEW

### Multiple Environments
The project has parallel implementations:

1. **Main Backend** (`/backend`) - Production version
2. **EduTrack Folder** (`/EduTrack`) - Backup/alternative version
3. **Admin Dashboard** (`/admin_new`) - Admin-specific interface
4. **ML Service** (`/ml-service`) - Separate ML microservice

### Data Files
- `addstudent.csv` - Student bulk import data
- `attendance.csv` - Attendance records
- `students.csv` - Student dataset for ML
- `students_forecasting.csv` - GPA forecasting dataset

---

## 🛠️ DEVELOPMENT WORKFLOW

### Frontend Development
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start dev server (Vite)
npm run build           # Production build
npm run lint            # Run ESLint
npm run preview         # Preview production build
```

### Backend Development
```bash
cd backend
python -m venv .venv   # Create virtual environment
source .venv/bin/activate  # Activate (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
python app.py          # Run Flask server
```

### ML Service
```bash
cd ml-service/ml-service
pip install -r requirements.txt
python api.py          # Start ML service
```

### Database Tools
- `import_students_from_csv.py` - Bulk import students
- `seed_users.py` - Create demo users
- `sync_student_login_accounts.py` - Sync student accounts
- `sync_student_profiles.py` - Sync student profiles
- Migration scripts for fixing data issues

---

## 🎯 KEY FEATURES & THEIR TECHNOLOGIES

### 1. Student Management
- **Tech**: React forms + Flask REST API + MySQL/MongoDB
- CRUD operations for student records
- Bulk import from CSV/Excel

### 2. Attendance Tracking
- **Tech**: React UI + Flask routes + Database models
- Date-based attendance recording
- Attendance percentage calculation
- Impact on risk assessment

### 3. Marks & Grades
- **Tech**: Excel import (XLSX) + Flask routes
- Multiple assessment types: quiz, assignment, exam, practical
- Automatic grade calculation
- CGPA computation

### 4. Risk Prediction
- **Tech**: Random Forest ML model + Flask API + Frontend integration
- Real-time risk assessment
- Personalized suggestions
- Risk level: Low/Medium/High

### 5. Analytics & Reporting
- **Tech**: Aggregation queries + Chart visualization
- Class-level analytics
- Individual student reports
- Performance trends

### 6. Authentication & Authorization
- **Tech**: JWT tokens + bcrypt + Flask session management
- Role-based access control
- Secure password storage
- Token validation middleware

### 7. CGPA Prediction
- **Tech**: Time series ML model + Historical data
- Forecast future academic performance
- Trend analysis

---

## 🔄 API Communication Flow

```
React Frontend (Axios HTTP)
          ↓
Flask REST API Backend
          ↓
MongoDB/MySQL Database
          ↓
ML Service (Risk/GPA Prediction)
```

---

## 📚 LEARNING PATH FOR THIS PROJECT

### Phase 1: Frontend (Beginner → Intermediate)
1. **React Fundamentals**
   - Components, Props, State, Hooks
   - React Router for navigation
   
2. **Styling**
   - Tailwind CSS utilities
   - Responsive design with Vite

3. **API Integration**
   - Axios for HTTP requests
   - Error handling
   - Data transformation

### Phase 2: Backend (Intermediate)
1. **Flask Basics**
   - Application factory pattern
   - Blueprints for modular routes
   - Request/response handling

2. **Database**
   - Choose: MongoDB or MySQL
   - Schema/Model design
   - Indexing & optimization

3. **Authentication**
   - JWT implementation
   - bcrypt password hashing
   - Role-based access

4. **REST API Design**
   - RESTful endpoints
   - HTTP status codes
   - Error handling

### Phase 3: ML Integration (Intermediate → Advanced)
1. **Machine Learning**
   - scikit-learn Random Forest
   - Feature engineering
   - Model training & evaluation

2. **Data Processing**
   - Pandas DataFrames
   - Data cleaning
   - Feature scaling

3. **Model Deployment**
   - Serving ML models via Flask
   - API documentation
   - Version control for models

### Phase 4: DevOps & Deployment (Advanced)
1. **Environment Management**
   - Virtual environments
   - Dependency management
   - Configuration management (.env)

2. **Database Administration**
   - Connection pooling
   - Query optimization
   - Backup & recovery

3. **Multi-Database Strategy**
   - Supporting multiple backends
   - Data migration
   - Consistency management

---

## 🎓 INDUSTRY BEST PRACTICES DEMONSTRATED

✅ **Separation of Concerns** - Modular code organization
✅ **Layered Architecture** - Models, Routes, Database abstraction
✅ **Environment Configuration** - Sensitive data protection
✅ **Authentication & Authorization** - Security-first design
✅ **Error Handling** - Try-catch, try-except patterns
✅ **Database Abstraction** - Support for multiple database backends
✅ **Code Reusability** - Shared utilities and models
✅ **API Documentation** - Clear endpoint structure
✅ **Data Validation** - Input validation on backend
✅ **ML Integration** - Real-world ML model deployment

---

## 🚀 DEPLOYMENT CONSIDERATIONS

- **Containerization**: Ready for Docker
- **Multi-environment**: Dev, staging, production configs
- **Scalability**: Microservice architecture (ML service separate)
- **Database**: Can switch between MongoDB and MySQL
- **CORS Configuration**: Flexible origin handling
- **Error Logging**: Comprehensive error handling

---

## 📊 DATA MODELS

### User
- id, name, email, password (hashed), role

### Student
- id, student_id, name, enrollment_id, batch, branch, year, semester
- email, cgpa, attendance_percentage, counsellor_name

### Attendance
- id, student_id, course_id, date, status (Present/Absent)

### Marks
- id, student_id, course_id, assessment_type (quiz/assignment/exam/practical), marks

### Grade
- id, student_id, course_id, internal_marks, external_marks, assignment_score, grade

### Risk Prediction
- id, student_id, attendance_percentage, marks, risk_level, predicted_at

---

## 🔧 CONFIGURATION & ENVIRONMENT

Key environment variables (in .env file):
```
FLASK_ENV=development
MONGO_URL=mongodb://localhost:27017/edutrack
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=edutrack
DB_BACKEND=mongo  # or mysql or both
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

This comprehensive tech stack showcases a modern, scalable educational platform combining web development, database design, machine learning integration, and full-stack engineering practices.
