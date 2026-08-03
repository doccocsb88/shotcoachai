#!/usr/bin/env bash
# Generates hermes.framework.dSYM for Release archives (Xcode 16+ validation).
set -eo pipefail

if [[ "${EFFECTIVE_PLATFORM_NAME:-}" == "-iphonesimulator" ]]; then
  exit 0
fi

if [[ -z "${DWARF_DSYM_FOLDER_PATH:-}" ]]; then
  exit 0
fi

HERMES_BIN="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermes.framework/hermes"
if [[ ! -f "${HERMES_BIN}" ]]; then
  HERMES_BIN="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64/hermes.framework/hermes"
fi

if [[ ! -f "${HERMES_BIN}" ]]; then
  echo "warning: Hermes binary not found, skipping dSYM generation"
  exit 0
fi

DSYM_OUTPUT="${DWARF_DSYM_FOLDER_PATH}/hermes.framework.dSYM"
mkdir -p "${DWARF_DSYM_FOLDER_PATH}"

HERMES_UUID="$(dwarfdump --uuid "${HERMES_BIN}" 2>/dev/null | awk '/UUID:/ {print $2; exit}')"

needs_regeneration=1
if [[ -d "${DSYM_OUTPUT}" && -n "${HERMES_UUID}" ]]; then
  DSYM_UUID="$(dwarfdump --uuid "${DSYM_OUTPUT}" 2>/dev/null | awk '/UUID:/ {print $2; exit}')"
  if [[ "${HERMES_UUID}" == "${DSYM_UUID}" ]]; then
    needs_regeneration=0
  fi
fi

if [[ "${needs_regeneration}" -eq 1 ]]; then
  rm -rf "${DSYM_OUTPUT}"
  dsymutil "${HERMES_BIN}" -o "${DSYM_OUTPUT}"
  echo "Generated Hermes dSYM at ${DSYM_OUTPUT}"
fi
