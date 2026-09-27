import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast, loading } from '../../stores/uiStore';
import { modal } from '../../stores/modalStore';
import ProgressCard from '../../components/common/ProgressCard';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { ENTRY_STEPS } from '../../data/constants';
import { compressImage } from '../../utils/file';
import { cx } from '../../utils/helpers';

export default function EntryTab() {
  const entry = useTripStore((s) => s.entry);

  const toggleStep = (i) => updateTrip((s) => { s.entry.steps[i] = !s.entry.steps[i]; });

  async function uploadQr(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const qr = await loading.run(compressImage(file, 900, 0.85), '圖片處理中…');
      updateTrip((s) => { s.entry.qr = qr; });
      toast('已儲存 QR Code');
    } catch {
      toast('圖片讀取失敗');
    }
  }

  async function clearQr() {
    if (await modal.confirm({ message: '移除 QR Code 截圖？', confirmText: '移除' })) {
      updateTrip((s) => { s.entry.qr = ''; });
    }
  }

  return (
    <>
      <article className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="globe" /><h2 className="section-title" style={{ fontSize: 20 }}>Visit Japan Web</h2></div>
        <p className="small muted" style={{ margin: 0, lineHeight: 1.6 }}>日本入境審查與海關申報的線上登錄，出發前填好，抵達時出示 QR Code。</p>
        <a className="btn btn--primary btn--block" href="https://www.vjw.digital.go.jp/" target="_blank" rel="noopener">開啟 Visit Japan Web <Icon name="external" /></a>
      </article>
      <ProgressCard label="登錄步驟" done={entry.steps.filter(Boolean).length} total={ENTRY_STEPS.length} unit="已完成" />
      <ol className="steps">
        {ENTRY_STEPS.map((step, i) => (
          <li key={i}>
            <div className={cx('check-row', entry.steps[i] && 'is-done')}>
              <button className="step-num" role="checkbox" aria-checked={!!entry.steps[i]} aria-label={`步驟 ${i + 1}：${step}`} onClick={() => toggleStep(i)}>
                {entry.steps[i] ? <Icon name="check" /> : i + 1}
              </button>
              <span className="check-row__text" onClick={() => toggleStep(i)}>{step}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="qr-wrap">
        <div className="qr-box">{entry.qr ? <img src={entry.qr} alt="入境 QR Code 截圖" /> : <Icon name="qr" />}</div>
        <strong>入境 QR Code</strong>
        <div className="btn-row" style={{ width: '100%' }}>
          <label className="btn btn--sm" htmlFor="qrFile"><Icon name="upload" />{entry.qr ? '更換截圖' : '上傳截圖'}</label>
          {entry.qr ? <Button size="sm" variant="danger" onClick={() => { clearQr(); }}><Icon name="trash" />移除</Button> : <span />}
        </div>
        <input type="file" id="qrFile" accept="image/*" className="sr-only" onChange={uploadQr} />
      </div>
    </>
  );
}
