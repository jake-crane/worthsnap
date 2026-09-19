-- Allow multiple snapshots per calendar day: snapshot_date becomes a
-- timestamp, and the one-per-day uniqueness constraint is dropped.
ALTER TABLE snapshots
    ALTER COLUMN snapshot_date TYPE TIMESTAMP USING snapshot_date::timestamp;

ALTER TABLE snapshots
    DROP CONSTRAINT snapshots_snapshot_date_key;
