CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    branch_id INT
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'manager', 'user', 'guest'))
);

INSERT INTO users (name, email, password, role) VALUES
('Администратор', 'admin@example.com', 'admin', 'admin'),
('Менеджер', 'manager@example.com', 'manager', 'manager'),
('Пользователь', 'user@example.com', 'user', 'user'),
('Гость', 'guest@example.com', '', 'guest');

INSERT INTO branches (name, address) VALUES
('Head Office', '123 Main St, Cityville'),
('Branch East', '456 East Rd, Eastville'),
('Branch West', '789 West Ave, Westville');

INSERT INTO employees (name, position, branch_id) VALUES
('Alice Smith', 'Manager', 1),
('Bob Jones', 'Sales Associate', 2),
('Charlie Kim', 'Support', 1),
('Donna Patel', 'Accountant', 3),
('Evan Lin', 'Manager', 2),
('Fay Wong', 'Intern', 1);
