#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-.}"
cd "$TARGET_DIR"
for file in \
  public/cultivation_idle_content_bible_v1_config/pavilion_records.json \
  docs/Pavilion/Pavilion_of_Ten_Thousand_Records_Content_Manifest.json \
  docs/Pavilion/Pavilion_Info_Upgrade_Handoff.md \
  docs/Pavilion/Pavilion_Records_Content_Model_v1_1.md \
  src/features/pavilion/pavilionTypes.ts \
  src/features/pavilion/pavilionContentTypes.ts \
  src/features/pavilion/buildPavilionSurface.ts \
  src/features/pavilion/buildGeneratedPavilionRecords.ts \
  src/features/pavilion/pavilionPresentation.ts; do
  mkdir -p "$(dirname "$file")"
  cp "$SCRIPT_DIR/$file" "$file"
done
echo "Pavilion information upgrade copied into $TARGET_DIR"
echo "Recommended checks: npm install && npm run validate:content && npm run typecheck && npm run check:icons && npm run build"
