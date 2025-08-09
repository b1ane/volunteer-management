-- CREATE DATABASE VolunteerManagementDB;
USE volunteer_management;

DROP TABLE IF EXISTS UserProfile;
DROP TABLE IF EXISTS UserCredentials;
DROP TABLE IF EXISTS assigned_events;
DROP TABLE IF EXISTS eventdetails;
DROP TABLE IF EXISTS volunteerhistory;
DROP TABLE IF EXISTS states;

CREATE TABLE IF NOT EXISTS States (
  code CHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

INSERT INTO States (code, name) VALUES
('AL', 'Alabama'),
('AK', 'Alaska'),
('AZ', 'Arizona'),
('AR', 'Arkansas'),
('CA', 'California'),
('CO', 'Colorado'),
('CT', 'Connecticut'),
('DE', 'Delaware'),
('FL', 'Florida'),
('GA', 'Georgia'),
('HI', 'Hawaii'),
('ID', 'Idaho'),
('IL', 'Illinois'),
('IN', 'Indiana'),
('IA', 'Iowa'),
('KS', 'Kansas'),
('KY', 'Kentucky'),
('LA', 'Louisiana'),
('ME', 'Maine'),
('MD', 'Maryland'),
('MA', 'Massachusetts'),
('MI', 'Michigan'),
('MN', 'Minnesota'),
('MS', 'Mississippi'),
('MO', 'Missouri'),
('MT', 'Montana'),
('NE', 'Nebraska'),
('NV', 'Nevada'),
('NH', 'New Hampshire'),
('NJ', 'New Jersey'),
('NM', 'New Mexico'),
('NY', 'New York'),
('NC', 'North Carolina'),
('ND', 'North Dakota'),
('OH', 'Ohio'),
('OK', 'Oklahoma'),
('OR', 'Oregon'),
('PA', 'Pennsylvania'),
('RI', 'Rhode Island'),
('SC', 'South Carolina'),
('SD', 'South Dakota'),
('TN', 'Tennessee'),
('TX', 'Texas'),
('UT', 'Utah'),
('VT', 'Vermont'),
('VA', 'Virginia'),
('WA', 'Washington'),
('WV', 'West Virginia'),
('WI', 'Wisconsin'),
('WY', 'Wyoming');

CREATE TABLE IF NOT EXISTS UserCredentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  verify_token VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS UserProfile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  address1 VARCHAR(255) NOT NULL,
  address2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  zip VARCHAR(10) NOT NULL,
  skills TEXT,
  preferences TEXT,
  availability TEXT,
  user_id INT NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES UserCredentials(id)
);

-- EventDetails table
CREATE TABLE IF NOT EXISTS EventDetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(100) NOT NULL,
  required_skills VARCHAR(255),
  urgency TINYINT NOT NULL CHECK (urgency BETWEEN 1 AND 5),
  event_date DATE NOT NULL,
  stateCode CHAR(2),
  FOREIGN KEY (stateCode) REFERENCES States(code)
);

-- VolunteerHistory table
CREATE TABLE IF NOT EXISTS VolunteerHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  volunteer_id INT NOT NULL,
  event_id INT NOT NULL,
  participation_date DATE NOT NULL,
  role VARCHAR(50),
  hours DECIMAL(5,2) NOT NULL CHECK (hours >= 0),
  FOREIGN KEY (event_id) REFERENCES EventDetails(id) ON DELETE CASCADE
);

-- AssignedEvents table
CREATE TABLE IF NOT EXISTS assigned_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id BIGINT NOT NULL,
  volunteer_id BIGINT NOT NULL,
  assigned_by BIGINT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('assigned','confirmed','declined','completed','no_show') NOT NULL DEFAULT 'assigned',
  notes VARCHAR(500) NULL,
  CONSTRAINT uq_event_vol UNIQUE (event_id, volunteer_id)
);



SELECT * FROM UserCredentials;
SELECT * FROM UserProfile;
