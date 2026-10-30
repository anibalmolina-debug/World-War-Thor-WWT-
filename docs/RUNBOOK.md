# Operational Runbook: WWT

This document outlines the procedures for maintaining and operating the WWT system.

## Class-Day Checklist

Perform these steps before every active game session:

1. **Backup State**: Ensure a current snapshot of the state is saved/exported.
2. **Verify Core Version**: Check that the `coreVersion` in `/api/health` matches the expected release.
3. **Verify Session Tokens**: Confirm GM session is active and accessible.
4. **Check Lock Status**:
   - Verify `ordersLocked` is `false` if students are expected to enter orders.
   - Verify `reflectionRequired` is set according to the season rules.
5. **Clear Demo Data**: If running on a fresh instance, verify the seed was applied correctly.

## Rollback Procedure

In the event of a critical state corruption or failed update:

1. **Identify Last Known Good State**: Locate the most recent valid state snapshot/backup.
2. **Restore Store**: 
   - If using a persistent store, overwrite the current state with the backup.
   - If memory-based, restart the function with the backup seed/data.
3. **Verify Integrity**: 
   - Call `/api/health` to ensure the system is `ok`.
   - Check `/api/state` to confirm nations and units are present.
4. **Notify Users**: Inform students of the rollback and any lost progress.

## Common Troubleshooting

### "Duty officer does not recognise those papers" (401)
- Check if the session cookie has expired.
- Verify the codeword is correct (case-insensitive).

### "Staff officers dropped a tray" (500)
- Check Netlify function logs for stack traces.
- Verify environment variables (`SEED_STUDENT_CODEWORD`, etc.) are set.

### Sync Issues
- If clients are not updating, check the `/api/sync` endpoint for correct `cursor` values.
