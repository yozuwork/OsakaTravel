import { openVoice } from '../../components/voice/VoiceInput';
import VoiceTripConfirm from './VoiceTripConfirm';
import { openItemForm } from './itemEditor';

/** 語音新增行程（手機版 + 按鈕 →「語音新增」） */
export function openVoiceTrip() {
  openVoice({
    title: '語音新增行程',
    placeholder: '例如：「明天下午三點去梅田，待兩個小時」',
    onText: () => openItemForm(null),
    render: (transcript, { retry, close }) => <VoiceTripConfirm transcript={transcript} onRetry={retry} onDone={close} />
  });
}
