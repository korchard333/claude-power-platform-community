# Canvas Apps -- Offline Capabilities

## Enable Offline
```
1. App Settings > General > Can be used offline = On
2. LoadData() / SaveData() for local caching
3. Connection.Connected to check online status
```

## Online/Offline Detection

```powerfx
// Check connectivity status
If(Connection.Connected,
    // Online mode
    Set(varConnectionStatus, "Online"),
    // Offline mode
    Set(varConnectionStatus, "Offline")
);
```

Use `Connection.Connected` as the primary signal. Check it:
- On app start (App.OnStart or App.StartScreen)
- Before any data operation (Patch, SubmitForm, Collect from data source)
- On a timer (e.g., every 30 seconds) to detect reconnection

---

## SaveData / LoadData Patterns

### Basic Cache Pattern

```powerfx
// On app start: try online fetch, fall back to cache
If(Connection.Connected,
    // Online: fetch from Dataverse
    ClearCollect(colOrders, Filter(Orders, 'Status' = 'Status (Orders)'.Active));
    // Save to local cache for offline use
    SaveData(colOrders, "CachedOrders"),
    // Offline: load from local cache
    LoadData(colOrders, "CachedOrders", true)
);
```

### Limitations of SaveData/LoadData

| Limitation | Detail |
|---|---|
| **Size limit** | ~200MB total across all SaveData keys per app |
| **Data types** | Flat records only -- no nested tables, no images, no attachments |
| **Persistence** | Persists across app restarts but NOT across app updates or reinstalls |
| **Platform** | Works on mobile (iOS, Android) and Windows. Limited support in browser. |
| **Collections only** | SaveData/LoadData work with collections, not directly with data sources |

---

## Queuing Offline Changes

```powerfx
// Queue a change when offline
If(!Connection.Connected,
    Collect(colPendingChanges, {
        Action: "Create",
        Entity: "Order",
        Data: {Name: txtName.Text, Amount: Value(txtAmount.Text)},
        Timestamp: Now()
    });
    SaveData(colPendingChanges, "PendingChanges");
    Notify("Saved offline. Will sync when connected.", NotificationType.Information),
    // Online: direct save
    Patch(Orders, Defaults(Orders), {
        contoso_name: txtName.Text,
        contoso_amount: Value(txtAmount.Text)
    })
);
```

---

## Sync Pending Changes on Reconnection

```powerfx
// Sync when back online
If(Connection.Connected && CountRows(colPendingChanges) > 0,
    Set(varSyncCount, CountRows(colPendingChanges));
    ForAll(colPendingChanges,
        Patch(Orders, Defaults(Orders), ThisRecord.Data)
    );
    Clear(colPendingChanges);
    SaveData(colPendingChanges, "PendingChanges");
    Notify(varSyncCount & " records synced", NotificationType.Success)
);
```

### Sync Trigger Options

| Trigger | Pattern | Best For |
|---|---|---|
| App start | Check on App.OnStart | Simple apps with infrequent offline use |
| Timer | Timer with Duration=30000 (30s) | Apps that stay open during connectivity changes |
| Button | Manual "Sync Now" button | User-controlled sync when they know they're online |
| Screen navigation | OnVisible of main screen | When users move between screens frequently |

---

## Conflict Detection and Resolution

When two users edit the same record offline, conflicts occur on sync. Canvas Apps do not provide built-in conflict resolution -- you must design for it.

### Last-Write-Wins (Default Behavior)

By default, `Patch()` overwrites the server record with the offline changes. The last user to sync wins. Previous changes by other users are lost.

```powerfx
// Default: last write wins (no conflict handling)
Patch(Orders, LookUp(Orders, ID = ThisRecord.RecordId), ThisRecord.Data)
```

**When this is acceptable:** Single-user scenarios, non-critical data, or when records are "owned" by one user at a time.

### Conflict Detection with Errors()

Use `Errors()` after `Patch()` to detect server-side conflicts:

```powerfx
// Attempt the patch
Patch(Orders, LookUp(Orders, ID = varPendingRecord.RecordId), varPendingRecord.Data);

// Check for errors
If(CountRows(Errors(Orders)) > 0,
    // Conflict or error detected
    Set(varConflict, true);
    Set(varErrorMessage, First(Errors(Orders)).Message);
    // Add to conflict queue for manual resolution
    Collect(colConflicts, {
        LocalData: varPendingRecord.Data,
        ErrorMessage: varErrorMessage,
        Timestamp: varPendingRecord.Timestamp
    });
    SaveData(colConflicts, "Conflicts"),
    // Success -- remove from pending
    Remove(colPendingChanges, varPendingRecord)
);
```

### User Prompt for Manual Resolution

When a conflict is detected, show the user both versions and let them choose:

```powerfx
// On conflict resolution screen
// Show server version
Set(varServerRecord, LookUp(Orders, ID = varConflictRecord.RecordId));

// User picks: Keep Mine, Keep Server, or Merge
// Keep Mine: re-patch with force overwrite
// Keep Server: discard local changes
// Merge: show both side-by-side, user picks per field
```

### Custom Merge Logic

For critical data, implement field-level merge:

```powerfx
// Compare field by field
If(
    varLocalRecord.Name <> varServerRecord.contoso_name,
    // Name was changed locally -- keep local version
    Set(varMergedName, varLocalRecord.Name),
    // Name unchanged locally -- keep server version
    Set(varMergedName, varServerRecord.contoso_name)
);

// Apply merged record
Patch(Orders, varServerRecord, {
    contoso_name: varMergedName,
    contoso_amount: varMergedAmount
});
```

---

## Offline Data Freshness

Cached data can become stale. Design for staleness:

```powerfx
// Track when cache was last refreshed
Set(varLastCacheRefresh, Now());
SaveData([{RefreshedAt: varLastCacheRefresh}], "CacheTimestamp");

// On app start, check cache age
LoadData(colCacheInfo, "CacheTimestamp", true);
Set(varCacheAge, DateDiff(First(colCacheInfo).RefreshedAt, Now(), TimeUnit.Hours));

// Warn if cache is old
If(varCacheAge > 24 && !Connection.Connected,
    Notify("Data was last refreshed " & varCacheAge & " hours ago. Connect to refresh.",
           NotificationType.Warning)
);
```

---

## Online Mode for Dataverse (Wave 1 2026)

> **GA (Wave 1 2026):** Canvas apps can now switch between offline and online modes for Dataverse access — real-time data without waiting for sync.

| Mode | Data Access | Best For |
|---|---|---|
| **Offline** (existing default) | Local sync database; data available without network | Field workers, intermittent connectivity |
| **Online** (new) | Direct Dataverse queries; always current data | Office workers, always-connected scenarios |

**How to enable:**
1. App Settings → Online mode → ON
2. End users toggle between Offline and Online on the offline status page
3. App remembers the last selection across sessions
4. If opened in online mode with no network, user is prompted to switch to offline

**When to use online mode:** When data freshness is critical and users are always connected. Eliminates sync delays and conflict resolution complexity.

**When to keep offline mode:** Field scenarios, unreliable connectivity, regulatory requirements for local data availability.

---

## Anti-Patterns

- **No offline indicator** -- Users don't know they're working offline. Always show connection status visually.
- **Saving images/attachments with SaveData** -- Binary data hits the size limit quickly. Cache metadata only.
- **No conflict handling** -- Last-write-wins silently loses data. At minimum, detect and log conflicts.
- **Syncing all records at once** -- Large sync operations can timeout. Process pending changes one at a time with error handling per record.
- **Not persisting the pending changes queue** -- If the app crashes while offline, unsaved pending changes are lost. Always `SaveData` the queue after each addition.
- **Assuming Connection.Connected updates instantly** -- There can be a delay. Don't rely on it for real-time connectivity detection in critical operations.
