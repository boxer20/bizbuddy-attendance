# 사내 근태관리 MVP

웹호스팅 없이 같은 공유기/LAN 안에서 실행하는 근태관리, 휴가관리 MVP입니다.

## 실행

Node.js 20 이상이 필요합니다.

```powershell
npm start
```

실행 후 브라우저에서 접속합니다.

```text
http://localhost:3000
http://서버PC_IP:3000
```

초기 관리자 계정:

```text
로그인 ID: admin
비밀번호: Admin1234!
```

첫 로그인 후 비밀번호를 바꾸는 것을 권장합니다.

## 로컬 서버 운영 방식

이 프로젝트를 실행하는 PC가 서버 역할을 합니다.

- 서버 PC가 켜져 있어야 직원들이 접속할 수 있습니다.
- 서버 PC가 절전모드에 들어가면 접속이 끊깁니다.
- 사내 공유기에서 서버 PC에 고정 IP 또는 DHCP 예약을 걸어두는 것이 좋습니다.
- Windows 방화벽에서 Node.js 또는 3000 포트를 허용해야 다른 PC에서 접속할 수 있습니다.

## 데이터 저장

현재 MVP는 별도 DB 설치 없이 아래 파일에 데이터를 저장합니다.

```text
data/db.json
```

백업은 이 파일을 주기적으로 복사하면 됩니다. 실제 운영이 길어지면 PostgreSQL로 이전하는 것을 권장합니다.

PowerShell에서 직접 내용을 확인할 때는 UTF-8로 읽어야 한글이 깨지지 않습니다.

```powershell
Get-Content data\db.json -Encoding UTF8
```

## 실행 확인

서버를 켤 때는 아래 명령을 사용합니다.

```powershell
npm start
```

서버 창에 표시되는 내부망 주소를 같은 공유기 안의 다른 PC에서 열면 됩니다.

```text
http://서버PC_IP:3000
```

처음 실행하면 `data/db.json`이 자동 생성됩니다.
