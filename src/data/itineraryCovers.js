import covers from './itineraryCoverLinks.json';

const matches = [
  [/國立國際美術館|国立国際美術館|National Museum of Art/i, 'nmao'],
  [/中之島美術館|中之岛美术馆|Nakanoshima Museum of Art/i, 'nakka'],
  [/兒童書之森|こども本の森|Children.?s Book Forest/i, 'books'],
  [/中之島圖書館|中之島図書館|Nakanoshima Library/i, 'library'],
  [/中央公會堂|中央公会堂|Central Public Hall/i, 'hall'],
  [/藍天大廈|蓝天大厦|空中庭園|梅田スカイビル|Umeda Sky/i, 'sky'],
  [/HEP\s*FIVE/i, 'hep'],
  [/環球影城|ユニバーサル|Universal Studios|USJ/i, 'usj'],
  [/樂桃|Peach|MM024|MM027/i, 'peach'],
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
    const { image, ...credit } = covers[key];
    return { ...item, image, images: [image], coverCredit: { image, ...credit } };
  });
}
