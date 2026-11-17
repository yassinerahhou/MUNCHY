from pathlib import Path
import re
mapping={'crispy-taco':'taco-chicken','kefta-burger':'kefta-burger','classic-smash':'classic-smash','taco-kefta':'taco-kefta','taco-mixte':'taco-mixte','pizza-poulet':'pizza-poulet','pizza-kefta':'pizza-kefta','panini-kefta':'panini-kefta','zaalouk-wrap':'zaalouk-wrap','algerian-sauce':'algerian-sauce','extra-cheddar':'extra-cheddar','harissa':'harissa','pasticcio-poulet':'pasticcio-poulet','pasticcio-mixte':'pasticcio-mixte'}
p=Path('locales/en.ts');s=p.read_text(encoding='utf-8')
for id,asset in mapping.items():
 assert Path(f'public/images/{asset}-concept.webp').exists(),asset
 s=re.sub(r"(\{ id: '"+re.escape(id)+r"'[^\n]+image: ')[^']+",r'\g<1>/images/'+asset+'-concept.webp',s)
p.write_text(s,encoding='utf-8')
p=Path('lib/content-types.ts');s=p.read_text(encoding='utf-8').replace('available: true, vegetarian:', 'photoNote: product.image.includes(\'-concept\') ? \'Generated serving concept · final presentation may vary\' : \'Illustrative menu photography · serving suggestion\', available: true, vegetarian:');p.write_text(s,encoding='utf-8')
# Fail if the seed catalogue ever reintroduces a shared item photo.
images=re.findall(r"image: '([^']+)'",s)
assert len(images)==len(set(images)), 'Duplicate product images remain'
print(f'{len(images)} products / {len(set(images))} distinct product photos')
