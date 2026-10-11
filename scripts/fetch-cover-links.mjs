import { writeFile } from 'node:fs/promises';

const files = {
  nakka: 'Nakanoshima Museum of Art Osaka.jpg',
  nmao: 'National Museum of Art Osaka in 201407.JPG',
  library: 'Facade of Osaka Prefectural Nakanoshima Library.jpg',
  hall: 'Osaka City Central Public Hall.jpg',
  books: 'Nakanoshima Children`s Book Forest.jpg',
  park: '1 Chome Nakanoshima, Kita-ku, Ōsaka-shi, Ōsaka-fu 530-0005, Japan - panoramio (1).jpg',
  sky: 'Umeda Sky Building (5225809736).jpg',
  hep: 'HEP at Night in 201408.JPG',
  usj: 'Universal Studios Japan entrance.jpg',
  peach: '2017-01-25 MM231,Airbus A320 of Peach Aviation at Kansai International Airport DSCF9155.jpg',
  shuttle: 'Nankai bus Citaro G 2019.jpg',
  rapit: 'Nankai 50000 Series at Kansai Airport Station 2018-07-27.jpg',
  airport: 'KIX Level 1 Arrival Lobby Atrium 2025.JPG'
};
const query = new URL('https://commons.wikimedia.org/w/api.php');
query.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo',
  iiprop: 'url|extmetadata', iiurlwidth: '1280', titles: Object.values(files).map((name) => 'File:' + name).join('|') });
const response = await fetch(query, { headers: { 'User-Agent': 'OsakaTravelCoverLinks/1.0 (personal itinerary)' } });
if (!response.ok) throw new Error('Commons metadata: ' + response.status);
const result = await response.json();
const pages = Object.values(result.query.pages);
const plain = (text = '') => text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
const covers = {};
for (const [key, filename] of Object.entries(files)) {
  const page = pages.find((page) => page.title === 'File:' + filename);
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error('Missing image: ' + filename);
  covers[key] = { image: info.thumburl || info.url, source: info.descriptionurl,
    author: plain(info.extmetadata.Artist?.value), license: plain(info.extmetadata.LicenseShortName?.value),
    licenseUrl: info.extmetadata.LicenseUrl?.value || '' };
}
covers.hotel = {
  image: 'https://hearton.co.jp/en/assets/images/nagahori/top_img05.jpg',
  source: 'https://hearton.co.jp/en/nagahori/',
  author: 'Hearton Hotel', license: '官方網站圖片', licenseUrl: 'https://hearton.co.jp/en/nagahori/'
};
await writeFile(new URL('../src/data/itineraryCoverLinks.json', import.meta.url), JSON.stringify(covers, null, 2) + '\n');
console.log('Saved verified Commons metadata for ' + Object.keys(covers).length + ' cover images.');
