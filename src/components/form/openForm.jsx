import { modal } from '../../stores/modalStore';
import FormModal from './FormModal';

/**
 * 開啟表單彈窗
 * openForm({ title, fields, onSave, onDelete?, submitText?, children? })
 */
export function openForm({ title, ...props }) {
  return modal.open({ title, content: <FormModal {...props} /> });
}
