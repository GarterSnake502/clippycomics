i=0
for f in *.jpg; do
  mv -- "$f" "$i.jpg"
  i=$((i+1))
done
