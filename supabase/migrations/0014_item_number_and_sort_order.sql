-- Add item_number (sequential per workspace) and sort_order for manual reordering.

ALTER TABLE items ADD COLUMN IF NOT EXISTS item_number integer;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill existing items: assign numbers in creation order per workspace.
WITH numbered AS (
  SELECT id, workspace_id,
         ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at ASC) AS rn
  FROM items
)
UPDATE items SET item_number = numbered.rn
FROM numbered WHERE items.id = numbered.id AND items.item_number IS NULL;

-- Also backfill sort_order so existing items start with a sensible order (newest on top).
WITH ordered AS (
  SELECT id, workspace_id,
         ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at DESC) AS rn
  FROM items
)
UPDATE items SET sort_order = ordered.rn
FROM ordered WHERE items.id = ordered.id;

-- Make item_number NOT NULL now that all rows are filled.
ALTER TABLE items ALTER COLUMN item_number SET NOT NULL;

-- Auto-assign item_number on insert via a trigger.
CREATE OR REPLACE FUNCTION assign_item_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_number IS NULL OR NEW.item_number = 0 THEN
    SELECT COALESCE(MAX(item_number), 0) + 1
    INTO NEW.item_number
    FROM items
    WHERE workspace_id = NEW.workspace_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_item_number ON items;
CREATE TRIGGER trg_assign_item_number
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION assign_item_number();
