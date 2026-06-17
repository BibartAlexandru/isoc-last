CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    archive_reason VARCHAR(255),
    archived_date DATETIME,
    archiver_id INT
);

CREATE TABLE project_members (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

ALTER TABLE projects
ADD INDEX idx_projects_name (name);

INSERT INTO projects (id, owner_id, name, description, status) VALUES
    (1, 1, 'Backend API',   'REST API pentru aplicatia principala',     'activ'),
    (2, 2, 'Mobile App',    'Aplicatie iOS/Android pentru clienti',     'activ'),
    (3, 1, 'Admin Panel',   'Panou de administrare intern',             'incheiat');

INSERT INTO project_members (project_id, user_id, role) VALUES
    (1, 1, 'Owner'),
    (1, 2, 'Member'),
    (1, 3, 'Member'),
    (2, 2, 'Owner'),
    (2, 3, 'Member'),
    (3, 1, 'Owner'),
    (3, 2, 'Member');
