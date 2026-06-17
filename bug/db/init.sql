CREATE TABLE bugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    feature VARCHAR(50) NOT NULL,
    submitter_id INT NOT NULL,
    assignee_id INT,
    creation_date DATETIME NOT NULL,
    estimated_fixed_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    severity INT NOT NULL DEFAULT 1,
    project_id INT NOT NULL,
    archive_reason VARCHAR(255),
    archived_date DATETIME,
    archiver_id INT
);

CREATE TABLE bug_trails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bug_id INT NOT NULL,
    creation_date DATETIME NOT NULL,
    description VARCHAR(255) NOT NULL,

    FOREIGN KEY (bug_id)
        REFERENCES bugs(id)
        ON DELETE CASCADE
);

CREATE TABLE bug_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    bug_id INT NOT NULL,
    creation_date DATETIME NOT NULL,

    FOREIGN KEY (bug_id)
        REFERENCES bugs(id)
        ON DELETE CASCADE
);

ALTER TABLE bugs
ADD INDEX idx_bugs_name (name),
ADD INDEX idx_bugs_assignee (assignee_id),
ADD INDEX idx_bugs_project (project_id),
ADD INDEX idx_bugs_status (status);

INSERT INTO bugs (id, name, feature, submitter_id, assignee_id, creation_date, estimated_fixed_date, status, severity, project_id) VALUES
    (1, 'Login returneaza 500 la parola gresita',   'auth',     1, 2, '2026-06-01 10:00:00', '2026-06-10 10:00:00', 'activ',   4, 1),
    (2, 'Token JWT expira prea repede',             'auth',     2, 1, '2026-06-02 09:00:00', '2026-06-12 09:00:00', 'rezolvat',3, 1),
    (3, 'Lista proiecte nu se incarca pe iOS',      'projects', 3, 2, '2026-06-03 14:00:00', '2026-06-15 14:00:00', 'activ',   3, 2),
    (4, 'Crash la upload imagine de profil',        'profile',  2, 3, '2026-06-05 11:00:00', '2026-06-20 11:00:00', 'activ',   5, 2),
    (5, 'Butonul de export PDF nu face nimic',      'reports',  1, NULL,'2026-06-06 16:00:00','2026-06-18 16:00:00','verificat',2, 3);

INSERT INTO bug_trails (bug_id, creation_date, description) VALUES
    (1, '2026-06-01 10:00:00', 'Bug created'),
    (2, '2026-06-02 09:00:00', 'Bug created'),
    (2, '2026-06-08 12:00:00', 'status: activ → rezolvat'),
    (3, '2026-06-03 14:00:00', 'Bug created'),
    (4, '2026-06-05 11:00:00', 'Bug created'),
    (5, '2026-06-06 16:00:00', 'Bug created'),
    (5, '2026-06-10 09:00:00', 'status: activ → verificat');

INSERT INTO bug_comments (bug_id, description, type, creation_date) VALUES
    (1, 'Am reprodus bug-ul. Se intampla doar cu caractere speciale in parola.', 'comment',    '2026-06-02 15:00:00'),
    (2, 'Am crescut durata de viata a tokenului la 24h.',                        'resolution', '2026-06-08 11:00:00'),
    (3, 'Pare a fi o problema de CORS pe Safari iOS 17.',                        'question',   '2026-06-04 10:00:00'),
    (3, 'Testez fix-ul pe device fizic.',                                        'progress',   '2026-06-07 16:00:00');
