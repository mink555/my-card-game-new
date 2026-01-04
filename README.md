# 🎮 Canvas 카드 뒤집기 게임

Canvas API와 Supabase를 연동한 간단한 카드 뒤집기 게임입니다.

## 🚀 배포 설정 (Vercel)

이 프로젝트는 보안을 위해 Supabase API 키를 환경 변수로 관리합니다. Vercel 배포 시 아래 설정을 반드시 완료해야 합니다.

### 1. 환경 변수 (Environment Variables) 설정
Vercel 프로젝트 설정의 **Settings > Environment Variables**에서 다음 항목을 추가하세요:

*   `SUPABASE_URL`: 본인의 Supabase 프로젝트 URL
*   `SUPABASE_KEY`: 본인의 Supabase Anon Key

### 2. 빌드 설정 (Build Settings)
Vercel은 `package.json`의 `build` 스크립트를 자동으로 인식합니다.

*   **Build Command**: `npm run build`
*   **Output Directory**: `.` (루트 디렉토리)

배포가 완료되면 `env.js` 파일이 서버 환경에서 자동으로 생성되어 보안 유출 없이 게임이 작동합니다.

