import { useRef } from 'react';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { openDialogue } from '../../stores/dialogueStore';
import { DEFAULT_SETTINGS, setSettings, useSettingsStore } from '../../stores/settingsStore';
import { useModalContext } from '../modal/ModalContext';
import { resetSplashSeen } from '../../utils/splash';
import { compressImage } from '../../utils/file';
import Button from '../common/Button';
import Icon from '../common/Icon';

/** 開啟畫面停留秒數的選項（毫秒） */
const SPLASH_OPTIONS = [0, 1200, 2000, 3000, 4000, 5000];
const secText = (ms) => (ms === 0 ? '不停留（載入完就關）' : `${ms / 1000} 秒`);

/* 開啟畫面圖片：手機看直式、電腦（橫向螢幕）看橫式；內建圖片在 public/splash */
const SPLASH_IMAGES = [
  { key: 'splashMobile', label: '手機版', hint: '直式，建議 9:16', builtin: 'splash-mobile.webp' },
  { key: 'splashDesktop', label: '電腦版', hint: '橫式，建議 16:9', builtin: 'splash-desktop.webp' }
];
const SPLASH_MAX = 1680;  // 長邊最多幾 px（存成 data URL 進資料庫，不要太大）

export function openSettings() {
  modal.open({ title: '設定', content: <SettingsModal /> });
}

/** 開啟畫面圖片：預覽＋更換／還原內建 */
function SplashImagePicker({ item, value }) {
  const inputRef = useRef(null);

  async function pick(file) {
    try {
      const url = await compressImage(file, SPLASH_MAX, 0.9);
      setSettings({ [item.key]: url });
      toast(`已更換${item.label}開啟畫面，下次打開 App 時生效`);
    } catch {
      toast('圖片讀取失敗');
    }
  }

  return (
    <div className="splash-pick">
      <button type="button" className={`splash-pick__preview splash-pick__preview--${item.key}`}
        onClick={() => inputRef.current?.click()} aria-label={`更換${item.label}開啟畫面`}>
        <img src={value || `${import.meta.env.BASE_URL}splash/${item.builtin}`} alt="" draggable="false" />
        {!value && <span className="splash-pick__badge">內建</span>}
      </button>
      <div className="splash-pick__text">
        <strong>{item.label}</strong>
        <span className="small muted">{item.hint}</span>
      </div>
      <div className="splash-pick__btns">
        <Button size="sm" onClick={() => inputRef.current?.click()}><Icon bi="upload" />更換</Button>
        {value && <Button size="sm" onClick={() => { setSettings({ [item.key]: '' }); toast(`${item.label}改回內建圖片`); }}><Icon bi="arrow-counterclockwise" />內建</Button>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => { const file = e.target.files[0]; e.target.value = ''; if (file) pick(file); }} />
    </div>
  );
}

/** 開關列：label＋說明＋右側 switch */
function SwitchRow({ label, desc, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-row__text">
        <strong>{label}</strong>
        {desc && <span className="small muted">{desc}</span>}
      </div>
      <button type="button" className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
        <span className="switch__track"><span className="switch__knob" /></span>
      </button>
    </div>
  );
}

function SettingsModal() {
  const { close } = useModalContext();
  const s = useSettingsStore();
  const splashOptions = SPLASH_OPTIONS.includes(s.splashMs) ? SPLASH_OPTIONS : [...SPLASH_OPTIONS, s.splashMs].sort((a, b) => a - b);

  function reset() {
    setSettings(DEFAULT_SETTINGS);
    resetSplashSeen();
    toast('已恢復預設值');
  }

  return (
    <div className="form">
      <section className="setting-group">
        <h3 className="setting-group__title"><Icon bi="image" />開啟畫面</h3>
        <label className="field">
          <span className="field__label">停留時間</span>
          <select className="field__input" value={s.splashMs}
            onChange={(e) => { setSettings({ splashMs: Number(e.target.value) }); toast('下次打開 App 時生效'); }}>
            {splashOptions.map((ms) => <option key={ms} value={ms}>{secText(ms)}{ms === DEFAULT_SETTINGS.splashMs ? '（預設）' : ''}</option>)}
          </select>
          <span className="field__hint">從打開網頁開始算；載入比較久時會等載入完成</span>
        </label>
        <SwitchRow label="只有第一次打開時停留" desc="之後打開改回 1.2 秒；「第一次」依每台裝置、每個瀏覽器分開計算"
          checked={s.splashFirstOnly}
          onChange={(v) => { setSettings({ splashFirstOnly: v }); if (v) resetSplashSeen(); }} />
        <div className="field">
          <span className="field__label">開啟畫面圖片</span>
          <div className="splash-picks">
            {SPLASH_IMAGES.map((item) => <SplashImagePicker key={item.key} item={item} value={s[item.key]} />)}
          </div>
          <span className="field__hint">手機直拿時顯示手機版，電腦或手機橫放時顯示電腦版</span>
        </div>
      </section>

      <section className="setting-group">
        <h3 className="setting-group__title"><Icon bi="chat-quote-fill" />角色對話</h3>
        <SwitchRow label="打開 App 時自動播放" desc="關閉後仍可從頭像選單的「和角色對話」開啟"
          checked={s.dialogueAutoplay} onChange={(v) => setSettings({ dialogueAutoplay: v })} />
        <Button size="sm" onClick={() => { close(); openDialogue(); }}><Icon bi="play-fill" />現在播放一次</Button>
      </section>

      <p className="small muted" style={{ margin: 0 }}>設定會跟著帳號存到雲端，換裝置登入也會套用。</p>
      <div className="btn-row">
        <Button onClick={reset}><Icon bi="arrow-counterclockwise" />恢復預設</Button>
        <Button variant="primary" onClick={close}><Icon name="check" />完成</Button>
      </div>
    </div>
  );
}
