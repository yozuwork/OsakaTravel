import { useId, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { useModalContext } from '../modal/ModalContext';
import Button from '../common/Button';
import Icon from '../common/Icon';
import TimeField from '../common/TimeField';
import { cx } from '../../utils/helpers';

/**
 * 依欄位設定產生的表單（放在彈出視窗內）
 * fields: [{ name, label, type, value, options, placeholder, required, full, hint, min, max }]
 * onSave(values)：可回傳 Promise；回傳 false 代表不關閉視窗
 * onDelete()：有給才顯示刪除鈕（會先跳確認）
 */
export default function FormModal({ fields, onSave, onDelete, submitText = '儲存', deleteText = '刪除', deleteConfirm, children }) {
  const { close } = useModalContext();
  const [submitting, setSubmitting] = useState(false);
  const prefix = useId();

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const values = {};
    for (const f of fields) {
      const el = form.elements[f.name];
      if (!el) continue;
      values[f.name] = f.type === 'file' ? el.files[0] || null : el.value.trim();
    }
    const missing = fields.find((f) => f.required && !values[f.name]);
    if (missing) { toast(`請填寫「${missing.label}」`); form.elements[missing.name].focus(); return; }

    setSubmitting(true);
    try {
      const result = await onSave(values);
      if (result !== false) close();
    } catch (err) {
      console.error(err);
      toast(err?.message || '儲存失敗');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!(await modal.confirm({ message: deleteConfirm || '確定要刪除嗎？' }))) return;
    await onDelete();
    close();
  }

  return (
    <>
      <form className="form" noValidate onSubmit={handleSubmit}>
        <div className="form__grid">
          {fields.map((f) => <Field key={f.name} id={`${prefix}${f.name}`} {...f} />)}
        </div>
        <div className="form__actions">
          <Button type="submit" variant="primary" block loading={submitting} loadingText="儲存中…">{submitText}</Button>
          {onDelete && <Button variant="danger" block disabled={submitting} onClick={() => { handleDelete(); }}><Icon name="trash" />{deleteText}</Button>}
        </div>
      </form>
      {children}
    </>
  );
}

function Field({ id, name, label, type, value, options, placeholder, required, full, hint, min, max }) {
  let control;
  if (type === 'select') {
    control = (
      <select className="field__input" id={id} name={name} defaultValue={value}>
        {options.map((o) => {
          const val = typeof o === 'object' ? o.value : o;
          const text = typeof o === 'object' ? o.label : o;
          return <option key={val} value={val}>{text}</option>;
        })}
      </select>
    );
  } else if (type === 'textarea') {
    control = <textarea className="field__input" id={id} name={name} placeholder={placeholder} defaultValue={value || ''} />;
  } else if (type === 'time') {
    control = <TimeField id={id} name={name} defaultValue={value} />;
  } else if (type === 'file') {
    control = <input className="field__input" id={id} name={name} type="file" accept="image/*" />;
  } else {
    control = (
      <input className="field__input" id={id} name={name} type={type || 'text'} defaultValue={value ?? ''}
        placeholder={placeholder} required={required} min={min} max={max} />
    );
  }
  return (
    <div className={cx('field', full && 'field--full')}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {control}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}
