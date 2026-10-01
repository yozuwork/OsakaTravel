import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { zhTW } from '@mui/x-date-pickers/locales';

const toDayjs = (hhmm) => (hhmm ? dayjs(`2000-01-01T${hhmm}`) : null);
const toText = (d) => (d?.isValid() ? d.format('HH:mm') : '');

const localeText = { ...zhTW.components.MuiLocalizationProvider.defaultProps.localeText, okButtonLabel: '確定', cancelButtonLabel: '取消', clearButtonLabel: '清除' };

// 外觀對齊 .field__input
const fieldSx = {
  '& .MuiPickersInputBase-root, & .MuiInputBase-root': {
    minHeight: 46, borderRadius: '10px', background: 'var(--white)', color: 'var(--navy)', fontFamily: 'var(--font)', fontSize: 16
  },
  '& .MuiPickersOutlinedInput-notchedOutline, & .MuiOutlinedInput-notchedOutline': { border: 'var(--border)' },
  '& .Mui-focused .MuiPickersOutlinedInput-notchedOutline, & .Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: 'var(--border-accent)', boxShadow: '3px 3px 0 var(--red)'
  },
  '& .MuiPickersSectionList-root, & input': { padding: '10px 12px' }
};

const dialogSx = {
  '& .MuiPaper-root': { borderRadius: '16px', border: 'var(--border)', boxShadow: '4px 4px 0 var(--red)' },
  '& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb': { backgroundColor: 'var(--red)', borderColor: 'var(--red)' },
  '& .MuiClockNumber-root.Mui-selected, & .MuiPickersToolbarButton-root .Mui-selected': { color: 'var(--white)' },
  '& .MuiTimePickerToolbar-ampmLabel.Mui-selected, & .MuiPickersToolbarText-root.Mui-selected': { color: 'var(--red)' },
  '& .MuiButton-root': { color: 'var(--red)', fontWeight: 700 }
};

/**
 * 時間選擇（MUI），值為 "HH:mm" 字串
 * - 受控：傳 value + onChange(text)
 * - 非受控（FormModal 用）：傳 defaultValue + name，值放在隱藏 input 給表單讀
 */
export default function TimeField({ id, name, value, defaultValue, onChange }) {
  const [inner, setInner] = useState(defaultValue || '');
  const text = value !== undefined ? value : inner;

  function handleChange(d) {
    const next = toText(d);
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-tw" localeText={localeText}>
      <MobileTimePicker
        value={toDayjs(text)}
        onAccept={handleChange}
        ampm
        slotProps={{
          textField: { id, fullWidth: true, sx: fieldSx, placeholder: '選擇時間' },
          dialog: { sx: dialogSx },
          actionBar: { actions: ['clear', 'cancel', 'accept'] }
        }}
      />
      {name && <input type="hidden" name={name} value={text} />}
    </LocalizationProvider>
  );
}
