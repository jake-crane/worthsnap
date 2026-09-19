CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_id)
);

-- Pre-auth data has no owner; clear it rather than guess an owner.
DELETE FROM snapshots;

ALTER TABLE snapshots
    ADD COLUMN user_id BIGINT NOT NULL REFERENCES users(id);

CREATE INDEX idx_snapshots_user_id ON snapshots(user_id);
