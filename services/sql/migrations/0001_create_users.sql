
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    roles TEXT[] NOT NULL DEFAULT 'default' CHECK (role IN ('default', 'privilaged', 'manager', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
)