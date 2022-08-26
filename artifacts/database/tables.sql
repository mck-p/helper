/**
  Copy/pasted from SQL history. Need to go through
  and ensure that it works as intended
*/
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users(
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS groups(
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE user_groups(
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE TYPE TypeOfHelp as ENUM ('financial', 'time', 'general');

CREATE TABLE help_items(                                        
  id UUID NOT NULL DEAFULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  help_type TypeOfHelp NOT NULL DEFAULT 'general',
  meta JSONB NOT NULL DEFAULT '{}',
  group_id UUID NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE)
);

CREATE TABLE helpers(                                  
  user_id UUID NOT NULL,
  help_item_id UUID NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (help_item_id) REFERENCES help_items(id) ON DELETE CASCADE,
  UNIQUE(user_id, help_item_id)
);

ALTER TABLE help_items                                 
ALTER COLUMN created_at SET DEFAULT NOW();

CREATE TABLE group_join_requests(                      
  user_id UUID NOT NULL,
  group_id UUID NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

ALERT TABLE group_join_requests ADD COLUMN sponsor UUID NOT NULL;

CREATE TABLE new_group_requests(
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,                      
  PRIMARY KEY (id)
);

ALTER TABLE new_group_requests ADD COLUMN fulfilled BOOLEAN NOT NULL DEFAULT '0';
ALTER TABLE users ADD COLUMN referral_email TEXT;
ALTER TABLE users ADD COLUMN meta JSONB NOT NULL DEFAULT '{}';
ALTER TABLE users ADD UNIQUE(email);
 ALTER TABLE help_items ADD COLUMN creator_id UUID NOT NULL;

 ALTER TABLE help_items CONSTRAINT fk_creator_id
   FOREIGN KEY(creator_id) 
      REFERENCES users(id);

ALTER TABLE help_items ADD COLUMN image TEXT;