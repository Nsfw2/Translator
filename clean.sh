#!/bin/bash
grep '}$' log/results \
  | tac \
  | jq -r '.hash' \
  | grep -xP '[0-9a-f]{64}' \
  | awk '{if (NR > 100000 && !n[$1]) print $1; n[$1]=1}' \
  | while read -r f; do
      find cache/ -name "$f.*.json" -type f -maxdepth 1 -print0 \
        | xargs -0 -r rm --
    done
