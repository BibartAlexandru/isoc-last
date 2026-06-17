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
