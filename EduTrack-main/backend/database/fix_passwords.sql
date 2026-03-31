-- Fix user passwords with correct bcrypt hashes
USE edutrack;

UPDATE users SET password = '$2b$12$wnTkIdB5tLtqG2cWKjkaG.c9ptBCRpeVocpgrsOVZTri8N8tHunSC' WHERE email = 'ananya.sharma@edutrack.edu';

UPDATE users SET password = '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG' WHERE email = 'ravi.kumar@edutrack.edu';

UPDATE users SET password = '$2b$12$MFNSWBETnDhq7QOmpx.iwe9/2CGooFjMEYb6ws7CmV4jnPuDet0lG' WHERE email = 'neha.patel@edutrack.edu';

UPDATE users SET password = '$2b$12$RGugp8TWML8tf1viom2QyeDGNSULRJZevdl3Y.BE69KS5XzfSjQbG' WHERE email = 'counsellor@edutrack.edu';

SELECT email, role, password FROM users;
