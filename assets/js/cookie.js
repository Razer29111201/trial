
export function getCookie(name) {
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
}


export function deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString(); // 864e5 = 86400000 ms = 1 ngày
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires};path=/`;
}

