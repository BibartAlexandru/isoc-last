CREATE TABLE notification_conf (
    user_id INT PRIMARY KEY,
    min_severity INT NOT NULL
);

CREATE TABLE bugs_to_notify (
    user_id INT NOT NULL,
    bug_id INT NOT NULL,
    PRIMARY KEY (user_id, bug_id)
);

CREATE TABLE notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bug_id INT NOT NULL,
    description VARCHAR(255) NOT NULL
);

INSERT INTO notification_conf (user_id, min_severity) VALUES
    (1, 3),
    (2, 1),
    (3, 4);
