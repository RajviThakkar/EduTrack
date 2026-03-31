CREATE DATABASE IF NOT EXISTS edutrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edutrack;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'faculty', 'student', 'counsellor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL UNIQUE,
  student_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  enrollment_no VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL CHECK (semester >= 1 AND semester <= 12),
  batch VARCHAR(50) NULL,
  year VARCHAR(20) NULL,
  counsellor_name VARCHAR(120) NULL,
  email VARCHAR(150) NULL UNIQUE,
  cgpa FLOAT DEFAULT 0,
  attendance_percentage FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_students_enrollment_no ON students(enrollment_no);
CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_counsellor_name ON students(counsellor_name);

CREATE TABLE IF NOT EXISTS faculty (
  faculty_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_faculty_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_faculty_user_id ON faculty(user_id);

CREATE TABLE IF NOT EXISTS courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(150) NOT NULL UNIQUE,
  faculty_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_courses_faculty_id ON courses(faculty_id);

CREATE TABLE IF NOT EXISTS enrollment (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_enrollment_student_course UNIQUE (student_id, course_id),
  CONSTRAINT fk_enrollment_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_enrollment_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_enrollment_student_id ON enrollment(student_id);
CREATE INDEX idx_enrollment_course_id ON enrollment(course_id);

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present', 'Absent') NOT NULL,
  CONSTRAINT uq_attendance_student_course_date UNIQUE (student_id, course_id, date),
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_date ON attendance(date);

CREATE TABLE IF NOT EXISTS marks (
  marks_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  assessment_type VARCHAR(30) NOT NULL DEFAULT 'exam',
  marks FLOAT NOT NULL CHECK (marks >= 0 AND marks <= 100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_marks_student_course_type UNIQUE (student_id, course_id, assessment_type),
  CONSTRAINT fk_marks_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_marks_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_course_id ON marks(course_id);

CREATE TABLE IF NOT EXISTS grades (
  grade_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  internal_marks FLOAT DEFAULT 0,
  external_marks FLOAT DEFAULT 0,
  assignment_score FLOAT DEFAULT 0,
  total_marks FLOAT DEFAULT 0,
  grade VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_grades_student_course UNIQUE (student_id, course_id),
  CONSTRAINT fk_grades_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_grades_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_course_id ON grades(course_id);

CREATE TABLE IF NOT EXISTS risk_prediction (
  risk_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  attendance_percentage FLOAT NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
  marks FLOAT NOT NULL CHECK (marks >= 0 AND marks <= 100),
  risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_risk_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_risk_student_id ON risk_prediction(student_id);
CREATE INDEX idx_risk_level ON risk_prediction(risk_level);

INSERT INTO users (name, email, password, role) VALUES
('Dr. Ananya Sharma', 'ananya.sharma@edutrack.edu', '$2b$12$wnTkIdB5tLtqG2cWKjkaG.c9ptBCRpeVocpgrsOVZTri8N8tHunSC', 'faculty'),
('Ravi Kumar', 'ravi.kumar@edutrack.edu', '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG', 'student'),
('Neha Patel', 'neha.patel@edutrack.edu', '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG', 'student'),
('Counsellor Admin', 'counsellor@edutrack.edu', '$2b$12$RGugp8TWML8tf1viom2QyeDGNSULRJZevdl3Y.BE69KS5XzfSjQbG', 'counsellor')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO faculty (user_id, department) VALUES
(1, 'Computer Science')
ON DUPLICATE KEY UPDATE department = VALUES(department);

INSERT INTO students (user_id, student_code, name, enrollment_no, department, semester, batch, year, counsellor_name, email, cgpa, attendance_percentage) VALUES
(2, 'CS2026A001', 'Ravi Kumar', 'CS2026A001', 'Computer Science', 4, '2026', 'Second', 'Dr. Ananya Sharma', 'ravi.kumar@edutrack.edu', 8.2, 92.0),
(3, 'CS2026A002', 'Neha Patel', 'CS2026A002', 'Computer Science', 4, '2026', 'Second', 'Dr. Ananya Sharma', 'neha.patel@edutrack.edu', 6.1, 61.0)
ON DUPLICATE KEY UPDATE department = VALUES(department), semester = VALUES(semester), counsellor_name = VALUES(counsellor_name);

INSERT INTO courses (course_name, faculty_id) VALUES
('Database Management Systems', 1)
ON DUPLICATE KEY UPDATE faculty_id = VALUES(faculty_id);

INSERT INTO enrollment (student_id, course_id) VALUES
(1, 1),
(2, 1)
ON DUPLICATE KEY UPDATE course_id = VALUES(course_id);

INSERT INTO attendance (student_id, course_id, date, status) VALUES
(1, 1, '2026-03-20', 'Present'),
(2, 1, '2026-03-20', 'Absent')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO marks (student_id, course_id, assessment_type, marks) VALUES
(1, 1, 'quiz', 92.0),
(1, 1, 'exam', 82.5),
(1, 1, 'assignment', 88.0),
(1, 1, 'practical', 90.0),
(2, 1, 'quiz', 65.0),
(2, 1, 'exam', 58.0),
(2, 1, 'assignment', 72.0),
(2, 1, 'practical', 60.0)
ON DUPLICATE KEY UPDATE marks = VALUES(marks);

INSERT INTO risk_prediction (student_id, attendance_percentage, marks, risk_level) VALUES
(1, 92.0, 82.5, 'Low'),
(2, 61.0, 58.0, 'High')
ON DUPLICATE KEY UPDATE
attendance_percentage = VALUES(attendance_percentage),
marks = VALUES(marks),
risk_level = VALUES(risk_level);
