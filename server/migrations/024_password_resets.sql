CREATE TABLE IF NOT EXISTS password_resets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT         NOT NULL,
  token        VARCHAR(64) NOT NULL UNIQUE,
  otp          CHAR(6)     NULL,
  otp_verified TINYINT(1)  NOT NULL DEFAULT 0,
  expires_at   DATETIME    NOT NULL,
  used_at      DATETIME    NULL,
  created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
