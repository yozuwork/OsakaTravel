import Fab, { addActions } from '../../components/common/Fab';
import ChecklistGroups, { addGroup } from './ChecklistGroups';
import { openVoiceBag } from './voiceTodo';

const TITLE = '管理行李清單';
const newGroup = () => addGroup('bag', TITLE);

export default function BagTab() {
  return (
    <>
      <ChecklistGroups listKey="bag" progressLabel="打包進度" unit="已打包" modalTitle={TITLE} />
      <Fab label="新增行李分類" actions={addActions({ voiceDesc: '用說的快速加入行李', textDesc: '手動新增行李分類', onText: newGroup, onVoice: () => openVoiceBag(newGroup) })} />
    </>
  );
}
