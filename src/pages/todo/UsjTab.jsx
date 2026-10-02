import { useCallback, useRef, useState } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { modal } from '../../stores/modalStore';
import { useModalContext } from '../../components/modal/ModalContext';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import KV from '../../components/common/KV';
import Fab, { addActions } from '../../components/common/Fab';
import ImageGallery from '../../components/common/ImageGallery';
import LinkList, { cleanLinks, normalizeUrl } from '../../components/common/LinkList';
import { readClipboard, toLinks, useClipboardLink } from '../../components/common/useClipboardLink';
import { diffDays, mdw } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import ChecklistGroups, { openAddItemsForm } from './ChecklistGroups';
import { openVoiceBag } from './voiceTodo';

const USJ_SITE = 'https://www.usj.co.jp/web/zh/tw';
const USJ_PLACE = 'ユニバーサル・スタジオ・ジャパン';
const LIST_KEY = 'usjList';
const MODAL_TITLE = '管理環球影城清單';

const addItems = () => openAddItemsForm(LIST_KEY, { title: '新增環球影城項目', placeholder: '例如：小小兵瘋狂乘車遊, 吃小小兵造型餐' });
const usjActions = addActions({
  voiceDesc: '用說的快速加入想玩的設施', textDesc: '手動新增項目',
  onText: addItems,
  onVoice: () => openVoiceBag(addItems, {
    listKey: LIST_KEY, noun: '項目', title: '語音加入環球影城清單', placeholder: '例如：「想玩瑪利歐賽車、小小兵還有大白鯊」'
  })
});

export default function UsjTab() {
  const usj = useTripStore((s) => s.usj);
  const trip = useTripStore((s) => s.trip);
  const dayIndex = usj.date ? diffDays(trip.startDate, usj.date) : -1;
  const dayLabel = dayIndex >= 0 && dayIndex < trip.days ? `D${dayIndex + 1} · ` : '';
  const links = cleanLinks(usj.links);

  return (
    <>
      <article className="card card--pad usj-hero">
        <div>
          <span className="usj-hero__en">UNIVERSAL STUDIOS JAPAN</span>
          <h2 className="section-title" style={{ fontSize: 20 }}>日本環球影城</h2>
          <p className="small muted" style={{ margin: '6px 0 0', lineHeight: 1.6 }}>開園時間、設施與季節活動以官網公告為準；入園後用官方 App 確認等候時間與任天堂世界入場方式。</p>
        </div>
        <div className="btn-row">
          <a className="btn btn--primary btn--sm" href={USJ_SITE} target="_blank" rel="noopener noreferrer"><Icon name="external" />官方網站</a>
          <a className="btn btn--sm" href={mapsUrl(USJ_PLACE)} target="_blank" rel="noopener noreferrer"><Icon name="nav" />導航</a>
        </div>
      </article>

      <article className="card card--pad usj-ticket">
        <div className="row-between">
          <h2 className="section-title" style={{ fontSize: 16 }}><Icon name="ticket" /> 票券資訊</h2>
          <Button size="sm" onClick={openUsjTicket}><Icon name="edit" />編輯</Button>
        </div>
        {usj.images?.length > 0 && (
          <button type="button" className="usj-ticket__shots" onClick={openUsjTicket} aria-label={`查看票券截圖（${usj.images.length} 張）`}>
            {usj.images.slice(0, 4).map((src, i) => <img key={i} src={src} alt="" referrerPolicy="no-referrer" />)}
            {usj.images.length > 4 && <span className="usj-ticket__more">+{usj.images.length - 4}</span>}
          </button>
        )}
        <div className="kv">
          <KV k="入園日" v={usj.date ? `${dayLabel}${mdw(usj.date)}` : ''} />
          <KV k="門票" v={usj.ticketType} />
          <KV k="快速通關" v={usj.express} />
          <KV k="任天堂世界" v={usj.nintendo} />
          <KV k="訂單編號" v={usj.orderNo} />
        </div>
        {usj.note && <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>{usj.note}</p>}
        {links.length > 0 && (
          <div className="usj-ticket__links">
            {links.map((u, i) => {
              const href = normalizeUrl(u);
              return href
                ? <a key={i} className="chip-link" href={href} target="_blank" rel="noopener noreferrer"><Icon name="link" /><span>{u.replace(/^https?:\/\//, '')}</span></a>
                : <span key={i} className="chip-link"><Icon name="link" /><span>{u}</span></span>;
            })}
          </div>
        )}
      </article>

      <ChecklistGroups listKey={LIST_KEY} progressLabel="環球影城進度" unit="已完成" modalTitle={MODAL_TITLE} />
      <Fab label="新增環球影城項目" actions={usjActions} />
    </>
  );
}

/* ---------- 票券資訊編輯（圖片、超連結和其他編輯畫面共用同一套元件） ---------- */
function openUsjTicket() {
  modal.open({ title: '環球影城票券', content: <UsjTicketEditor clipboard={readClipboard()} /> });
}

const TEXT_FIELDS = [
  { name: 'ticketType', label: '門票種類', placeholder: '例如：1 日券', list: ['1 日券', '1.5 日券', '2 日券', '年票'] },
  { name: 'express', label: '快速通關', placeholder: '例如：快速通關 4' },
  { name: 'nintendo', label: '任天堂世界入場', placeholder: '例如：快速通關保證、當天整理券', list: ['快速通關保證', '當天整理券', '抽選券', '尚未確認'] },
  { name: 'orderNo', label: '訂單編號' }
];

function UsjTicketEditor({ clipboard }) {
  const { close } = useModalContext();
  const usj = useTripStore((s) => s.usj);
  const [draft, setDraft] = useState(() => ({ ...usj, images: usj.images || [], links: toLinks(usj.links) }));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const setImages = useCallback((update) => setDraft((d) => ({ ...d, images: update(d.images) })), []);
  const setLinks = useCallback((update) => setDraft((d) => ({ ...d, links: update(d.links) })), []);
  useClipboardLink({ clipboard, draftRef, setLinks, setImages });

  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  function save(e) {
    e.preventDefault();
    const data = {
      ...draft,
      ...Object.fromEntries(TEXT_FIELDS.map((f) => [f.name, (draft[f.name] || '').trim()])),
      note: (draft.note || '').trim(),
      links: cleanLinks(draft.links).map((u) => normalizeUrl(u) || u)
    };
    updateTrip((s) => { s.usj = data; });
    toast('已更新票券資訊');
    close();
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="form__grid">
        <div className="field field--full">
          <span className="field__label">票券截圖</span>
          <ImageGallery value={draft.images} onChange={setImages} max={1200} quality={0.85}
            placeholder={<span className="tl-thumb--icon gallery__placeholder"><Icon name="ticket" /><span className="tl-thumb__label">票券</span></span>} />
        </div>
        <label className="field field--full">
          <span className="field__label">入園日期</span>
          <input className="field__input" type="date" name="date" value={draft.date || ''} onChange={change} />
        </label>
        {TEXT_FIELDS.map((f) => (
          <label className="field" key={f.name}>
            <span className="field__label">{f.label}</span>
            <input className="field__input" name={f.name} value={draft[f.name] || ''} onChange={change} placeholder={f.placeholder}
              list={f.list ? `usj_${f.name}_list` : undefined} />
            {f.list && <datalist id={`usj_${f.name}_list`}>{f.list.map((o) => <option key={o} value={o} />)}</datalist>}
          </label>
        ))}
        <div className="field field--full">
          <span className="field__label">超連結</span>
          <LinkList value={draft.links} onChange={(links) => setDraft((d) => ({ ...d, links }))} idPrefix="usj_link" />
        </div>
        <label className="field field--full">
          <span className="field__label">備註</span>
          <textarea className="field__input" name="note" value={draft.note || ''} onChange={change} placeholder="例如：快速通關時段、集合地點" />
        </label>
      </div>
      <Button type="submit" variant="primary" block><Icon name="check" />儲存</Button>
    </form>
  );
}
