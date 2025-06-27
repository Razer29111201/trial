import { getCookie } from './cookie.js';

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 * @returns {boolean} true nếu có session_id, ngược lại false
 */
export function checkLogin() {
    const sid = getCookie('user');
    return !!sid; // true nếu có giá trị, false nếu null/undefined
}
