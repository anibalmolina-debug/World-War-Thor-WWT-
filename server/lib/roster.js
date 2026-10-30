// @ts-check
/**
 * @typedef {Object} RosterRow
 * @property {string} type - 'nation' | 'unit' | 'colony' | 'passcode'
 * @property {string} [key]
 * @property {string} [name]
 * @property {string} [value]
 * @property {string} [extra]
 */

/**
 * Minimal CSV parser.
 * ponytail: no external lib, CSVs are simple comma-separated strings for this use case.
 * @param {string} csv
 * @returns {RosterRow[]}
 */
export function parseRosterCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];

  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    // Fallback if headers are missing/different
    if (!row.type) {
      row.type = values[0];
      row.key = values[1];
      row.name = values[2];
      row.value = values[3];
      row.extra = values[4];
    }
    return row;
  });
}

/**
 * Dry-run validation of roster data.
 * @param {RosterRow[]} rows
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRoster(rows) {
  const errors = [];
  const keys = new Set();

  rows.forEach((row, i) => {
    const line = i + 2;
    if (!row.type) {
      errors.push(`Line ${line}: Missing type`);
      return;
    }
    if (!row.key) {
      errors.push(`Line ${line}: Missing key for ${row.type}`);
    } else {
      if (keys.has(row.key)) {
        errors.push(`Line ${line}: Duplicate key ${row.key}`);
      }
      keys.add(row.key);
    }

    if (row.type === 'nation' && !row.name) {
      errors.push(`Line ${line}: Nation missing name`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}
