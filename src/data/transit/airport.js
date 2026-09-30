/* 交通：機場 → 市區方案（時間為一般情況概估，不寫票價） */
export const AIRPORT_GROUPS = [
  {
    id: 'kix', station: '関西空港', title: '關西機場 KIX → 市區', cta: '從 KIX 查路線',
    options: [
      { title: '南海 Rapi:t', min: 38, dest: '到難波', desc: '住難波、心齋橋、日本橋最順。全車指定席，要加購特急券。', lines: ['NK'] },
      { title: '南海 空港急行', min: 45, dest: '到難波', desc: '同一條線，不用加價；行李多時尖峰較擠。', lines: ['NK'] },
      { title: 'JR 特急 Haruka', min: 35, dest: '到天王寺', desc: '天王寺、大阪站、新大阪都不用換車，到大阪站約 50 分。', lines: ['H'] },
      { title: 'JR 關空快速', min: 65, dest: '到大阪站', desc: '不用特急券，沿途停天王寺、新今宮、弁天町、西九条。', lines: ['R'] },
      { title: '利木津巴士', min: 60, dest: '到梅田', desc: '行李放車腹，直達梅田、難波等飯店區；塞車時會拉長。', bus: true }
    ]
  },
  {
    id: 'itm', station: '大阪空港', title: '伊丹機場 ITM → 市區', cta: '從 ITM 查路線',
    options: [
      { title: '單軌電車＋御堂筋線', min: 35, dest: '到梅田', desc: '大阪空港坐單軌到千里中央，轉紅色御堂筋線南下。', lines: ['MO', 'M'] },
      { title: '利木津巴士', min: 25, dest: '到梅田', desc: '到梅田、難波都有直達班次，最省力。', bus: true }
    ]
  }
];
