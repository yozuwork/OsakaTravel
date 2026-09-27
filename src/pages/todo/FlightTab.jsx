import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { openForm } from '../../components/form/openForm';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import KV from '../../components/common/KV';
import { mdw, parseDate } from '../../utils/date';
import { safeUrl } from '../../utils/helpers';

function editFlight(f) {
  openForm({
    title: `編輯${f.leg}班機`,
    fields: [
      { name: 'date', label: '日期', type: 'date', value: f.date },
      { name: 'airline', label: '航空公司', value: f.airline, placeholder: '例如：星宇航空' },
      { name: 'from', label: '出發機場代碼', value: f.from, placeholder: 'TPE' },
      { name: 'to', label: '抵達機場代碼', value: f.to, placeholder: 'KIX' },
      { name: 'fromName', label: '出發機場', value: f.fromName },
      { name: 'toName', label: '抵達機場', value: f.toName },
      { name: 'dep', label: '起飛時間', type: 'time', value: f.dep },
      { name: 'arr', label: '抵達時間', type: 'time', value: f.arr },
      { name: 'flightNo', label: '航班編號', value: f.flightNo, placeholder: '例如：BR132' },
      { name: 'pnr', label: '訂位代號', value: f.pnr },
      { name: 'seat', label: '座位', value: f.seat },
      { name: 'baggage', label: '託運行李', value: f.baggage, placeholder: '例如：23kg' },
      { name: 'ticket', label: '電子機票連結', type: 'url', value: f.ticket, placeholder: 'https://', full: true, hint: '可貼航空公司或雲端硬碟的連結' }
    ],
    onSave: (v) => {
      v.from = v.from.toUpperCase(); v.to = v.to.toUpperCase();
      updateTrip((s) => { Object.assign(s.flights.find((x) => x.id === f.id), v); });
      toast('已更新班機');
    }
  });
}

export default function FlightTab() {
  const flights = useTripStore((s) => s.flights);
  return flights.map((f) => (
    <article key={f.id} className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="row-between">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className={'tag' + (f.leg === '回程' ? ' tag--navy' : '')}>{f.leg}</span>
          {f.airline && <strong className="small">{f.airline}</strong>}
        </span>
        <strong className="small">{f.date ? parseDate(f.date).getFullYear() + '/' + mdw(f.date) : '日期未定'}</strong>
      </div>
      <div className="route">
        <div className="route__end"><span className="route__code">{f.from}</span><span className="route__name">{f.fromName}</span><span className="route__time">{f.dep || '--:--'}</span></div>
        <div className="route__mid"><Icon name="plane" /></div>
        <div className="route__end route__end--r"><span className="route__code">{f.to}</span><span className="route__name">{f.toName}</span><span className="route__time">{f.arr || '--:--'}</span></div>
      </div>
      <div className="divider" />
      <div className="kv"><KV k="航班" v={f.flightNo} /><KV k="訂位代號" v={f.pnr} /><KV k="座位" v={f.seat} /><KV k="託運行李" v={f.baggage} /></div>
      <div className="btn-row">
        {safeUrl(f.ticket)
          ? <a className="btn btn--sm" href={safeUrl(f.ticket)} target="_blank" rel="noopener"><Icon name="ticket" />電子機票</a>
          : <Button size="sm" onClick={() => editFlight(f)}><Icon name="ticket" />加機票連結</Button>}
        <Button size="sm" onClick={() => editFlight(f)}><Icon name="edit" />編輯</Button>
      </div>
    </article>
  ));
}
