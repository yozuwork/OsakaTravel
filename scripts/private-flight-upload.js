import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { ref, runTransaction, get } from 'firebase/database';
import { auth, database, databasePath } from '/src/services/firebase.js';
import { applyFlightImport } from '/src/utils/flightImport.js';
const button = document.querySelector('#login'), status = document.querySelector('#status');
let working = false;
async function writeFlights(user) {
  if (!user || working) return;
  working = true; button.disabled = true;
  try {
    status.textContent = '驗證登入權限，讀取本機機票資料…';
    const response = await fetch('/__private/flight-booking', { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: 'no-store' });
    if (!response.ok) throw Error('無法讀取本機機票資料，請確認帳號已獲授權。');
    const payload = await response.json();
    const target = ref(database, databasePath);
    const before = (await get(target)).val();
    if (!before?.trip) throw Error('資料庫中沒有目前旅程，請先完成雲端行程同步。');
    status.textContent = '正在寫入 Firebase，更新班機與對應行程…';
    const ids = Array.from({ length: 4 }, () => crypto.randomUUID());
    const result = await runTransaction(target, current => { if (!current) return current; let index = 0; return applyFlightImport(current, payload, () => ids[index++]); }, { applyLocally: false });
    if (!result.committed) throw Error('資料庫未完成寫入。');
    const confirmed = (await get(target)).val();
    if (confirmed?.flightImportId !== payload.importId || payload.flights.some(flight => !Object.values(confirmed.flights || {}).some(saved => ['leg', 'date', 'airline', 'flightNo', 'from', 'to', 'dep', 'arr'].every(key => saved[key] === flight[key])))) throw Error('寫入後讀回資料不一致。');
    status.textContent = '已寫入 Firebase，並讀回確認成功。班機與行程已更新，其他訂位資料保留。';
    document.querySelector('#done').hidden = false; button.hidden = true;
  } catch (error) { status.textContent = `尚未完成：${error.message}`; working = false; button.disabled = false; }
}
button.onclick = async () => { try { const result = await signInWithPopup(auth, new GoogleAuthProvider()); await writeFlights(result.user); } catch { status.textContent = '登入未完成，請重試。'; } };
onAuthStateChanged(auth, user => { if (user) writeFlights(user); });
