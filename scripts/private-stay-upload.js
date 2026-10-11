
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { ref, runTransaction, get } from 'firebase/database';
import { auth, database, databasePath } from '/src/services/firebase.js';
const button = document.querySelector('#login'), status = document.querySelector('#status');
let working = false;
async function writeBooking(user) {
  if (!user || working) return;
  working = true; button.disabled = true;
  try {
    status.textContent = '確認登入權限，讀取本機訂房資料…';
    const token = await user.getIdToken();
    const response = await fetch('/__private/stay-booking', {headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
    if (!response.ok) throw new Error(response.status === 403 ? '這個帳號沒有資料存取權限。' : '無法取得本機資料，請重新登入。');
    const payload = await response.json();
    if (payload.type !== 'osaka-stay-booking' || !payload.stay?.orderNo) throw new Error('訂房檔格式不正確。');
    const booking = payload.stay;
    status.textContent = '正在寫入 Firebase…';
    const target = ref(database, `${databasePath}/stays`);
    const result = await runTransaction(target, current => {
      const stays = current || [];
      const entries = Object.entries(stays);
      const match = entries.find(([,stay]) => stay && (stay.orderNo === booking.orderNo || (stay.name === booking.name && stay.checkIn === booking.checkIn)));
      if (match) stays[match[0]] = {...match[1], ...booking};
      else if (Array.isArray(stays)) stays.push({...booking,id:crypto.randomUUID(),images:[],photo:'',platform:''});
      else stays[crypto.randomUUID()] = {...booking,id:crypto.randomUUID(),images:[],photo:'',platform:''};
      return stays;
    }, {applyLocally:false});
    if (!result.committed) throw new Error('資料庫沒有完成寫入，請重試。');
    const confirmed = Object.values((await get(target)).val() || {}).find(stay => stay.orderNo === booking.orderNo);
    if (!confirmed || Object.entries(booking).some(([key,value]) => confirmed[key] !== value)) throw new Error('寫入後讀回的資料不一致，請重試。');
    status.textContent = '已寫入 Firebase，並讀回確認成功。\n訂單與確認號碼、房型、入住時段、聯絡方式、特殊需求及付款提醒皆已更新。';
    document.querySelector('#done').hidden = false;
    button.hidden = true;
  } catch (error) {status.textContent = `尚未完成：${error.message}`;working = false;button.disabled = false;}
}
button.onclick = async () => {try {const result = await signInWithPopup(auth,new GoogleAuthProvider());await writeBooking(result.user);} catch {status.textContent='登入未完成，請重試。';}};
onAuthStateChanged(auth, user => { if (user) writeBooking(user); });

