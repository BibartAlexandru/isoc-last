CREATE TABLE bugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    feature VARCHAR(50) NOT NULL,
    submitter_id INT NOT NULL,
    assignee_id INT,
    creation_date DATETIME NOT NULL,
    estimated_fixed_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
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
