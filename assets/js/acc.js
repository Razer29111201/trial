import { setCookie } from './cookie.js';

/* ---------- Tab switch ---------- */
loginTab.onclick = () => swapTab(true);
registerTab.onclick = () => swapTab(false);
function swapTab(isLogin) {
    loginTab.classList.toggle('active', isLogin);
    registerTab.classList.toggle('active', !isLogin);
    loginForm.classList.toggle('active', isLogin);
    registerForm.classList.toggle('active', !isLogin);
}
loginForm.onsubmit = registerForm.onsubmit = e => e.preventDefault();
/* ---------- SHA-256 ---------- */
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- URL Apps Script ---------- */
const BASE_URL = 'https://script.google.com/macros/s/AKfycbwcMZl3yBU0jOKJBEJJKSu9aA5jsAEe3v6I4KLbCuTTXMKD9VwHq_rXFIIpHpCdu3VP7w/exec';  // ↔ thay link của bạn

/* ---------- Tải danh sách user ---------- */
let users = [];
await fetch(BASE_URL)
    .then(r => r.json())
    .then(j => users = j);

/* ---------- Đăng nhập ---------- */
dangnhap.onclick = async () => {
    const u = input_user_dn.value.trim();
    const pHash = await sha256(input_pass_dn.value.trim());
    const found = users.find(x => x.username === u && x.password === pHash);
    if (!found) return alert('Sai tài khoản hoặc mật khẩu');
    setCookie('user', found.id);
    window.location.href = 'index.html';  // chuyển về trang chính
    alert('Đăng nhập thành công!');
};

/* ---------- Đăng ký ---------- */
dangky.onclick = async () => {
    const username = input_user_dk.value.trim();
    const email = input_mail_dk.value.trim();
    const passRaw = input_pass_dk.value.trim();

    if (!username || !email || !passRaw) return alert('Nhập đủ thông tin');
    if (users.some(u => u.username === username)) return alert('Tài khoản đã tồn tại');

    const hashedPass = await sha256(passRaw);
    const formData = new URLSearchParams({ username, email, password: hashedPass, role: '1' });

    try {
        const res = await fetch(BASE_URL, { method: 'POST', body: formData });
        const json = await res.json();
        if (json.status === 'success') {
            alert('Đăng ký thành công, hãy đăng nhập!');
            users.push({ ...json.user, password: hashedPass });   // cập nhật cache
            swapTab(true);                                        // chuyển về tab Đăng nhập
        } else {
            alert('Đăng ký thất bại: ' + json.message);
        }
    } catch (err) {
        console.error(err);
        alert('Lỗi đăng ký, thử lại');
    }
};
