CREATE TABLE IF NOT EXISTS permissions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  module     VARCHAR(50) NOT NULL,
  can_view   TINYINT(1)  NOT NULL DEFAULT 0,
  can_edit   TINYINT(1)  NOT NULL DEFAULT 0,
  can_delete TINYINT(1)  NOT NULL DEFAULT 0,
  can_update TINYINT(1)  NOT NULL DEFAULT 0,
  UNIQUE KEY uq_user_module (user_id, module),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
