# Canvas Apps — ALM

## Solution-Aware Development
```
1. Always create Canvas Apps INSIDE a solution
2. Use environment variables for environment-specific config
3. Use connection references (not direct connections)
4. Export/import via managed solutions for test/prod
```

## Source Control
```bash
# Unpack Canvas App for source control (YAML format)
pac canvas unpack --msapp ./CanvasApp.msapp --sources ./src/CanvasApp

# Pack back to .msapp
pac canvas pack --sources ./src/CanvasApp --msapp ./out/CanvasApp.msapp

# The unpacked YAML files can be diffed and reviewed in Git
# Modern Power Platform Git integration uses .pa.yaml files (newer format)
```

## Co-Authoring (GA — October 2024)
```
Power Apps Studio supports real-time co-authoring:
- Maximum 10 co-authors per session
- Real-time presence indicators show where others are editing
- Changes are visible to all editors in real-time
- Source code stored as .pa.yaml files in Git repositories

Limitations during co-authoring:
- Search, Save As, Undo/Redo unavailable
- Cannot rename controls or add AI Builder/geospatial controls
- App language is locked to first editor's locale
- Cannot edit .pa.yaml directly if app contains code components (PCF)
```
