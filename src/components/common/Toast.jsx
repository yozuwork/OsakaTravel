import { useUiStore } from '../../stores/uiStore';

export default function Toast() {
  const { msg, show } = useUiStore((s) => s.toast);
  return <div className={'toast' + (show ? ' is-show' : '')} role="status" aria-live="polite">{msg}</div>;
}
