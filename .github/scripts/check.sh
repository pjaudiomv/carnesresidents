#!/bin/bash
TARGET_STRING="3IgzWwO0nVVg"
FOUND=$(git diff --cached --name-only | xargs grep -l "$TARGET_STRING")

if [[ ! -z "$FOUND" ]]; then
  echo "Error: Found target string in:"
  echo "$FOUND"
  exit 1
fi

exit 0
