const access = 'https://www.hearton.co.jp/access/nagahori';
const restaurant = 'https://www.hearton.co.jp/restaurant/yotsuba';

export const isNagahoriHotel = (stay) => /長堀|nagahori/i.test(stay.name || '') || /新町\s*1[-－]5[-－]11/.test(stay.address || '');
export const HOTEL_PHOTO = 'https://www.hearton.co.jp/en/assets/images/nagahori/top_img05.jpg';
export const HOTEL_SOURCE = 'https://www.hearton.co.jp/en/nagahori/';

export const STAY_STREETS = [
  { title: '四ツ橋站 2 號出口', description: '出站後往右走，飯店約步行 1 分鐘。', query: '四ツ橋駅 2番出口', image: 'https://www.hearton.co.jp/assets/images/main/access/nag_route01_img03.jpg', source: access, credit: 'Hearton Hotel' },
  { title: '飯店旁的街道', description: '沿著出口旁的街道直走，右手邊就是飯店。', query: 'ハートンホテル心斎橋長堀通', image: 'https://www.hearton.co.jp/assets/images/main/access/nag_route01_img04.jpg', source: access, credit: 'Hearton Hotel' },
  { title: '長堀通・飯店門前', description: '先認一下飯店附近街景，晚上回來更好找。', query: '大阪市西区新町1-5-11', image: 'https://www.hearton.co.jp/assets/images/main/access/nag_route01_img05.jpg', source: access, credit: 'Hearton Hotel' }
];

export const STAY_FOOD = [
  { title: 'Yo Tsu Ba 早餐', description: '飯店 1 樓的自助早餐；是否含早餐請依你們的訂房方案確認。', query: 'Yo Tsu Ba 大阪市西区新町1-5-11', image: 'https://www.hearton.co.jp/assets/images/restaurant/yotsuba_pickup.jpg', source: restaurant, credit: 'Hearton Hotel' },
  { title: '四ツ橋咖啡・漢堡排', description: '新町 1-9-17，位於同一街區的洋食店，招牌是漢堡排。', query: '四ツ橋カフェ 大阪市西区新町1-9-17', image: 'https://cdn.goope.jp/73777/220906130620ychy_l.jpg', source: 'https://yotsubashicafe.com/', credit: '四ツ橋カフェ' },
  { title: '四ツ橋咖啡・餐點相簿', description: '看看店家提供的餐點照片，挑一餐在住宿附近吃。', query: '四ツ橋カフェ 大阪市西区新町1-9-17', image: 'https://cdn.goope.jp/73777/220906130234tmsg_l.jpg', source: 'https://yotsubashicafe.com/', credit: '四ツ橋カフェ' }
];
