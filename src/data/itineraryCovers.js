import baseCovers from './itineraryCoverLinks.json';
import day1Covers from './day1CoverLinks.json';
const covers = { ...baseCovers, ...day1Covers };

const matches = [
  [/Animate|アニメイト/i, 'animate'],
  [/Mandarake|Grand Chaos|まんだらけ|グランドカオス/i, 'mandarake'],
  [/難波.*晚餐|なんば.*夕食|Namba.*Dinner/i, 'nambaDinner'],
  [/道頓堀|Dotonbori/i, 'dotonbori'],
  [/日本橋動漫|動漫街|大阪日本橋|でんでんタウン|Nipponbashi/i, 'nipponbashi'],
  [/國立國際美術館|国立国際美術館|National Museum of Art/i, 'nmao'],
  [/中之島美術館|中之岛美术馆|Nakanoshima Museum of Art/i, 'nakka'],
  [/兒童書之森|こども本の森|Children.?s Book Forest/i, 'books'],
  [/中之島圖書館|中之島図書館|Nakanoshima Library/i, 'library'],
  [/中央公會堂|中央公会堂|Central Public Hall/i, 'hall'],
  [/藍天大廈|蓝天大厦|空中庭園|梅田スカイビル|Umeda Sky/i, 'sky'],
  [/HEP\s*FIVE/i, 'hep'],
  [/環球影城|ユニバーサル|Universal Studios|USJ/i, 'usj'],
  [/樂桃|Peach/i, 'peach'],
  [/長堀通哈頓|ハートンホテル心斎橋長堀通|Hearton.*Nagahori/i, 'hotel'],
  [/接駁巴士.*關西|接駁巴士.*空港|關西.*接駁巴士/i, 'shuttle'],
  [/rapi:?t|南海/i, 'rapit'],
  [/關西.*機場|関西.*空港|Kansai.*Airport/i, 'airport'],
  [/中之島|中之岛|Nakanoshima/i, 'park']
];

/** 只補空白封面；保留所有已有圖片與行程內容。 */
export function withOnlineCovers(items) {
  return items.map((item) => {
    if (item.image || item.images?.some(Boolean)) return item;
    const text = `${item.title || ''} ${item.place || ''}`;
    const match = matches.find(([pattern]) => pattern.test(text));
    const key = match?.[1] || (item.day === 3 && /預留緩衝時間/.test(item.title || '') ? 'park' : null);
    if (!key) return item;
    const { image: _originalImage, ...credit } = covers[key];
    const image = `covers/stable/${key}.webp`;
    return { ...item, image, images: [image], coverCredit: { image, ...credit } };
  });
}

/** Replace only known automatic covers. Uploaded/custom photos and additional images stay intact. */
export function withStableCovers(items) {
  const normalize = value => typeof value === 'string' ? value.split('?')[0].replace('https://www.hearton.co.jp/', 'https://hearton.co.jp/') : value;
  const replacements = new Map(Object.entries(covers).map(([key, cover]) => [normalize(cover.image), `covers/stable/${key}.webp`]));
  const replace = value => {
    const known = replacements.get(normalize(value));
    if (known) return known;
    // Local covers saved from localhost or another deployment must not retain its root/subpath.
    if (typeof value === 'string' && /^\/(?:[^/?#]+\/)*covers\/(?:d1-[a-z0-9-]+\.jpg|stable\/[a-zA-Z0-9]+\.webp)$/.test(value)) return value.slice(value.lastIndexOf('/covers/') + 1);
    return value;
  };
  return items.map(item => {
    const image = replace(item.image);
    const images = item.images?.map(replace);
    const creditImage = replace(item.coverCredit?.image);
    if (image === item.image && (!images || images.every((value, index) => value === item.images[index])) && creditImage === item.coverCredit?.image) return item;
    return { ...item, ...(image !== undefined ? { image } : {}), ...(images ? { images } : {}), ...(item.coverCredit ? { coverCredit: { ...item.coverCredit, image: creditImage } } : {}) };
  });
}
