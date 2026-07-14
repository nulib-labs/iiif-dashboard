#!/bin/sh

set -eu

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 ELM_SOURCE UNMINIFIED_JS MINIFIED_JS" >&2
  exit 2
fi

source_file=$1
unminified_file=$2
minified_file=$3

yarn -s elm make --optimize --output="$unminified_file" "$source_file"
INITIAL_SIZE=$(wc -c < "$unminified_file")

yarn -s swc "$unminified_file" --config-file .swcrc --out-file "$minified_file"

MINIFIED_SIZE=$(wc -c < "$minified_file")
GZIPPED_SIZE=$(gzip -c "$minified_file" | wc -c)

human_size() {
  if command -v numfmt >/dev/null 2>&1; then
    numfmt --to=iec-i --suffix=B "$1"
  else
    printf "%sB" "$1"
  fi
}

INITIAL_HR=$(human_size "$INITIAL_SIZE")
MINIFIED_HR=$(human_size "$MINIFIED_SIZE")
GZIPPED_HR=$(human_size "$GZIPPED_SIZE")

printf "%-18s %10s (%7s)  %s\n" "Initial size:" "$INITIAL_SIZE bytes" "${INITIAL_HR}" "$unminified_file"
printf "%-18s %10s (%7s)  %s\n" "Minified size:" "$MINIFIED_SIZE bytes" "${MINIFIED_HR}" "$minified_file"
printf "%-18s %10s (%7s)\n" "Gzipped size:" "$GZIPPED_SIZE bytes" "${GZIPPED_HR}"
