/** 標籤＋值（未填寫時顯示灰字） */
export default function KV({ k, v }) {
  return (
    <div className="kv__item">
      <span className="kv__k">{k}</span>
      <span className={'kv__v' + (v ? '' : ' is-empty')}>{v || '尚未填寫'}</span>
    </div>
  );
}
