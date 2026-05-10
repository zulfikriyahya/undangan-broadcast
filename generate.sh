#!/bin/bash

OUTPUT="draft.md"
> "$OUTPUT"

echo "# BLUEPRINT" >> "$OUTPUT"

# Folder yang dikecualikan
EXCLUDE_DIRS=(
  "node_modules"
  ".git"
  ".vscode"
  ".astro"
  "dist"
  ".cache"
  "public/uploads"
)

# File spesifik yang dikecualikan
EXCLUDE_FILES=(
  "generate.sh"
  "draft.md"
  ".gitignore"
  ".gitattributes"
  ".npmrc"
  ".nvmrc"
  ".prettierignore"
  ".eslintignore"
  "pnpm-lock.yaml"
  ".editorconfig"
  "README.md"
  "CHANGELOG.md"
  "LICENSE"
  "konsep.md"
)

# Ekstensi biner yang dikecualikan
BINARY_EXTS=(
  jpg jpeg png gif webp svg ico bmp tiff
  mp3 mp4 wav ogg webm
  pdf zip tar gz rar 7z
  woff woff2 ttf eot otf
  xlsx xls doc docx ppt pptx
  exe bin so dll dylib
  db sqlite sqlite3
  lock
)

# Ekstensi teks yang dikenali beserta nama lang-nya untuk code fence
declare -A LANG_MAP=(
  [ts]="ts"       [tsx]="tsx"
  [js]="js"       [jsx]="jsx"
  [mjs]="js"      [cjs]="js"
  [astro]="astro"
  [json]="json"
  [yaml]="yaml"   [yml]="yaml"
  [toml]="toml"
  [md]="md"
  [html]="html"
  [css]="css"     [scss]="scss"  [sass]="sass"
  [sh]="bash"     [bash]="bash"
  [env]="bash"
  [sql]="sql"
  [py]="python"
  [txt]="text"
  [xml]="xml"
  [prisma]="prisma"
)

# Build argumen -prune untuk find
PRUNE_ARGS=()
for d in "${EXCLUDE_DIRS[@]}"; do
  PRUNE_ARGS+=(-path "./$d" -prune -o)
done

# Build daftar ekstensi biner untuk pengecekan
is_binary_ext() {
  local ext="${1,,}"
  for bext in "${BINARY_EXTS[@]}"; do
    [[ "$ext" == "$bext" ]] && return 0
  done
  return 1
}

# Tulis satu file ke draft.md
write_section() {
  local filepath="$1"
  local ext="${filepath##*.}"
  local lang="${LANG_MAP[$ext]:-text}"

  echo "" >> "$OUTPUT"
  echo "## $filepath" >> "$OUTPUT"
  echo '```'"$lang" >> "$OUTPUT"
  cat "$filepath" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo '```' >> "$OUTPUT"
  echo "---" >> "$OUTPUT"
}

COUNT=0

# Telusuri semua file, urutkan path-nya
while IFS= read -r -d '' file; do
  # Buang prefix "./"
  rel="${file#./}"

  # Lewati file yang dikecualikan secara eksplisit
  basename_rel=$(basename "$rel")
  skip=0
  for excl in "${EXCLUDE_FILES[@]}"; do
    [[ "$basename_rel" == "$excl" ]] && skip=1 && break
  done
  [[ $skip -eq 1 ]] && continue

  # Dapatkan ekstensi (lowercase)
  ext="${rel##*.}"
  ext_lower="${ext,,}"

  # Lewati file biner berdasarkan ekstensi
  is_binary_ext "$ext_lower" && continue

  # Lewati file tanpa ekstensi yang kemungkinan biner (opsional, cek MIME)
  if ! file --mime-type "$file" 2>/dev/null | grep -qE "text/|application/json|application/javascript|application/xml|inode/x-empty"; then
    continue
  fi

  write_section "$rel"
  (( COUNT++ ))

done < <(find . "${PRUNE_ARGS[@]}" -type f -print0 | sort -z)

echo ""
echo "✅ draft.md selesai dibuat — $COUNT file tercatat."
