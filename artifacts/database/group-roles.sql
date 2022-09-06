ALTER TABLE user_roles ADD COLUMN group_id UUID;
ALTER TABLE user_roles ADD CONSTRAINT fk_role_group_id FOREIGN KEY (group_id) REFERENCES groups (id);