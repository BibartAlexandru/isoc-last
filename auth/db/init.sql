CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL
);

ALTER TABLE users
ADD CONSTRAINT uq_users_email UNIQUE (email);

INSERT IGNORE INTO users (id, name, email) VALUES
    (1, 'Eduard Ohriniuc',  'eduard@example.com'),
    (2, 'Alexandra Bibarts', 'alex@example.com'),
    (3, 'Mihai Popescu',    'mihai@example.com');
