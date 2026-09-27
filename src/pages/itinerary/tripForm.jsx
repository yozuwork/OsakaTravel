import { useId } from 'react';
import { useTripStore, updateTrip, replaceTrip, resetTrip } from '../../stores/tripStore';
import { toast, loading } from '../../stores/uiStore';
import { modal } from '../../stores/modalStore';
import { openForm } from '../../components/form/openForm';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { toISO } from '../../utils/date';
import { downloadJSON, readText } from '../../utils/file';

export function openTripForm() {
  const t = useTripStore.getState().trip;
  openForm({
    title: '旅程資訊',
    fields: [
      { name: 'name', label: '旅程名稱', value: t.name, required: true, full: true },
      { name: 'en', label: '英文名稱', value: t.en },
      { name: 'days', label: '天數', type: 'number', value: t.days, min: 1, max: 30 },
      { name: 'from', label: '出發地', value: t.from },
      { name: 'to', label: '目的地', value: t.to },
      { name: 'startDate', label: '出發日期', type: 'date', value: t.startDate, required: true, full: true }
    ],
    onSave: (v) => {
      const days = Math.max(1, Math.min(30, parseInt(v.days, 10) || 1));
      updateTrip((s) => {
        Object.assign(s.trip, { ...v, days });
        s.ui.day = Math.min(s.ui.day, days - 1);
      });
      toast('已更新旅程資訊');
    },
    children: <DataManagement />
  });
}

function DataManagement() {
  const fileId = useId();

  function exportData() {
    downloadJSON(useTripStore.getState(), `travel-backup_${toISO(new Date())}.json`);
    toast('已匯出備份');
  }

  async function importData(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!(await modal.confirm({ message: '匯入會覆蓋目前所有資料，確定嗎？', confirmText: '匯入' }))) return;
    try {
      const text = await loading.run(readText(file), '匯入中…');
      replaceTrip(JSON.parse(text));
      modal.closeAll();
      toast('已匯入備份');
    } catch {
      toast('匯入失敗：檔案格式不正確');
    }
  }

  async function reset() {
    if (!(await modal.confirm({ message: '確定要清除所有資料？這個動作無法復原。', confirmText: '清除' }))) return;
    resetTrip();
    modal.closeAll();
    toast('已恢復範例資料');
  }

  return (
    <>
      <div className="divider" />
      <h3 className="section-title">資料管理</h3>
      <p className="small muted" style={{ margin: 0 }}>資料只存在這台裝置的瀏覽器。換手機或清除瀏覽資料前，記得先匯出備份。</p>
      <div className="menu-list">
        <Button block onClick={exportData}><Icon name="download" />匯出備份（JSON）</Button>
        <label className="btn btn--block" htmlFor={fileId}><Icon name="upload" />匯入備份</label>
        <input type="file" id={fileId} accept="application/json,.json" className="sr-only" onChange={importData} />
        <Button variant="danger" block onClick={() => { reset(); }}><Icon name="trash" />清除所有資料，恢復範例</Button>
      </div>
    </>
  );
}
