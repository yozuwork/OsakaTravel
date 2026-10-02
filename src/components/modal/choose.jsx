import { modal } from '../../stores/modalStore';
import { useModalContext } from './ModalContext';
import Button from '../common/Button';
import Icon from '../common/Icon';

/**
 * 多選一的詢問視窗（modal.confirm 只有兩個按鈕時用這個）
 * const v = await choose({ title, message, options: [{ value: 'cover', label: '覆蓋封面', icon, variant: 'primary' }, …] })
 * 關閉視窗或按「取消」回傳 null
 */
export function choose({ title = '請選擇', message, detail, options }) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (v) => { if (!settled) { settled = true; resolve(v); } };
    modal.open({
      title,
      content: <ChooseBody message={message} detail={detail} options={options} onPick={settle} />,
      onClose: () => settle(null)
    });
  });
}

function ChooseBody({ message, detail, options, onPick }) {
  const { close } = useModalContext();
  const pick = (v) => { onPick(v); close(); };
  return (
    <>
      {message && <p className="confirm__msg" style={{ margin: 0 }}>{message}</p>}
      {detail && <p className="choose__detail">{detail}</p>}
      <div className="menu-list">
        {options.map((o) => (
          <Button key={o.value} variant={o.variant} block onClick={() => pick(o.value)}>
            {o.icon && <Icon bi={o.icon} />}{o.label}
          </Button>
        ))}
        <Button block onClick={() => pick(null)}>取消</Button>
      </div>
    </>
  );
}
