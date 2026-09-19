-- Replace the categories/items/snapshot_entries hierarchy with a single
-- line_items table: each entry is just a free-text description and a signed
-- amount (negative = liability), scoped directly to a snapshot.
DROP TABLE snapshot_entries;
DROP TABLE items;
DROP TABLE categories;

CREATE TABLE line_items (
    id BIGSERIAL PRIMARY KEY,
    snapshot_id BIGINT NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
    description VARCHAR(150) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL
);

CREATE INDEX idx_line_items_snapshot_id ON line_items(snapshot_id);
