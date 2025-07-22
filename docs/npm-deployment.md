# SnapDocs NPM 패키지 배포 가이드

## 목차
- [개요](#개요)
- [현재 프로젝트 상태 분석](#현재-프로젝트-상태-분석)
- [배포 전 준비사항](#배포-전-준비사항)
- [npm 계정 설정](#npm-계정-설정)
- [배포 프로세스](#배포-프로세스)
- [버전 관리](#버전-관리)
- [보안 고려사항](#보안-고려사항)
- [CI/CD 자동화](#cicd-자동화)
- [배포 후 관리](#배포-후-관리)
- [문제 해결](#문제-해결)

## 개요

SnapDocs는 마크다운 파일을 아름다운 HTML 문서로 변환하는 CLI 도구입니다. 이 가이드는 npm 레지스트리를 통해 패키지를 배포하고 관리하는 방법을 상세히 안내합니다.

## 현재 프로젝트 상태 분석

### ✅ 준비 완료된 항목

1. **기본 package.json 설정**
   - `name`: snapdocs (고유 패키지명)
   - `version`: 1.0.0
   - `description`: 명확한 패키지 설명
   - `main`: dist/lib/index.js (진입점)
   - `bin`: CLI 명령어 설정 (snapdocs, mdg)

2. **빌드 및 배포 스크립트**
   - `prepare`: npm install 후 자동 빌드
   - `prepublishOnly`: 배포 전 클린 빌드
   - `prepack`: 패키징 전 빌드

3. **파일 구조**
   - `files` 필드: 배포할 파일 지정
   - TypeScript → JavaScript 컴파일 설정

4. **메타데이터**
   - Keywords: 검색 최적화
   - License: MIT
   - Repository: GitHub 링크

### ⚠️ 수정 필요 항목

1. **작성자 정보**: `"Your Name <your.email@example.com>"` → 실제 정보로 변경
2. **테스트**: 현재 테스트가 구성되지 않음
3. **README.md**: 패키지 사용법 상세 문서화

## 배포 전 준비사항

### 1. 작성자 정보 업데이트

```json
{
  "author": {
    "name": "실제 이름",
    "email": "실제이메일@example.com",
    "url": "https://github.com/사용자명"
  }
}
```

### 2. README.md 완성

README.md에 다음 내용이 포함되어야 합니다:

```markdown
# SnapDocs

## Installation
npm install -g snapdocs

## Usage
snapdocs init
snapdocs setup

## Features
- 마크다운을 HTML로 변환
- 다양한 테마 지원
- 실시간 미리보기

## License
MIT
```

### 3. 라이센스 파일 확인

LICENSE 파일이 있는지 확인하고, MIT 라이센스 전문이 포함되어 있는지 검토하세요.

### 4. 빌드 테스트

```bash
# 클린 빌드 테스트
npm run clean
npm run build

# 배포용 빌드 테스트
npm run prepublishOnly

# CLI 기능 테스트
node dist/bin/snapdocs.js --help
```

## npm 계정 설정

### 1. npm 계정 생성 및 로그인

```bash
# npm 계정 생성 (웹에서 진행)
# https://www.npmjs.com/signup

# CLI에서 로그인
npm login

# 로그인 확인
npm whoami
```

### 2. 2FA (Two-Factor Authentication) 설정

보안을 위해 2FA를 활성화하는 것을 강력히 권장합니다:

```bash
# 2FA 설정
npm profile enable-2fa auth-and-writes
```

### 3. 패키지명 가용성 확인

```bash
# 패키지명 사용 가능 여부 확인
npm view snapdocs

# 404 에러가 나오면 사용 가능
# 패키지가 존재하면 다른 이름 선택 필요
```

## 배포 프로세스

### 1. 최종 점검 체크리스트

- [ ] package.json의 모든 필드 확인
- [ ] 작성자 정보 실제 정보로 변경
- [ ] README.md 완성
- [ ] 빌드 성공 확인
- [ ] CLI 기능 정상 동작 확인
- [ ] Git 저장소 최신 상태 유지

### 2. 드라이런 (Dry Run)

실제 배포 전에 시뮬레이션을 실행:

```bash
# 배포 시뮬레이션 (실제 배포되지 않음)
npm publish --dry-run

# 생성될 패키지 내용 확인
npm pack
tar -tzf snapdocs-1.0.0.tgz
```

### 3. 첫 배포

```bash
# 첫 번째 배포
npm publish

# 성공 메시지 확인:
# + snapdocs@1.0.0
```

### 4. 배포 확인

```bash
# npm 레지스트리에서 패키지 확인
npm view snapdocs

# 다른 환경에서 설치 테스트
npm install -g snapdocs
snapdocs --version
```

## 버전 관리

### Semantic Versioning (SemVer)

SnapDocs는 의미있는 버전 관리를 따릅니다:

- **Major (1.0.0)**: 호환성을 깨는 변경
- **Minor (1.1.0)**: 새로운 기능 추가 (호환성 유지)
- **Patch (1.0.1)**: 버그 수정

### 버전 업데이트 및 배포

```bash
# 패치 버전 업데이트 (1.0.0 → 1.0.1)
npm version patch

# 마이너 버전 업데이트 (1.0.0 → 1.1.0)
npm version minor

# 메이저 버전 업데이트 (1.0.0 → 2.0.0)
npm version major

# 버전 태그와 함께 Git에 커밋
git push --follow-tags

# 새 버전 배포
npm publish
```

### Pre-release 버전

개발 중인 기능을 테스트하기 위한 베타/알파 버전:

```bash
# 베타 버전 (1.1.0-beta.0)
npm version prerelease --preid=beta

# 베타 태그로 배포 (기본 latest 태그 사용 안함)
npm publish --tag beta

# 베타 버전 설치
npm install -g snapdocs@beta
```

## 보안 고려사항

### 1. npm 토큰 관리

```bash
# 토큰 생성 (CI/CD용)
npm token create --read-only
npm token create --cidr=0.0.0.0/0

# 토큰 목록 확인
npm token list

# 토큰 폐기
npm token revoke <token-id>
```

### 2. 패키지 무결성 검증

```bash
# 패키지 무결성 확인
npm audit

# 취약점 자동 수정
npm audit fix

# 상세 보안 보고서
npm audit --audit-level high
```

### 3. 의존성 보안 관리

정기적으로 의존성을 업데이트하고 보안 취약점을 확인:

```bash
# 의존성 업데이트 확인
npm outdated

# 안전한 업데이트
npm update

# 주요 버전 업그레이드 (신중히)
npm install dependency@latest
```

## CI/CD 자동화

### GitHub Actions 설정

`.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        registry-url: 'https://registry.npmjs.org'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Publish to NPM
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 환경별 배포 전략

```bash
# 개발 버전 (dev 태그)
npm publish --tag dev

# 스테이징 버전 (next 태그)  
npm publish --tag next

# 프로덕션 버전 (latest 태그)
npm publish
```

## 배포 후 관리

### 1. 사용량 모니터링

```bash
# 다운로드 통계
npm view snapdocs

# 주간 다운로드 수
npm view snapdocs --json | jq '.downloads'
```

### 2. 사용자 피드백 관리

- GitHub Issues 모니터링
- npm 패키지 평가 및 리뷰 확인
- 커뮤니티 질문 응답

### 3. 문서 유지보수

- README.md 최신 상태 유지
- 변경사항 CHANGELOG.md에 기록
- API 문서 업데이트

## 문제 해결

### 패키지명 충돌

```bash
# 다른 패키지명으로 변경
npm view @사용자명/snapdocs  # 스코프 패키지
npm view snapdocs-cli        # 변형된 이름
```

### 배포 실패

```bash
# 권한 문제
npm owner add 사용자명 snapdocs

# 네트워크 문제  
npm publish --registry https://registry.npmjs.org

# 2FA 문제
npm publish --otp=123456
```

### 잘못된 배포 수정

```bash
# 패키지 제거 (72시간 이내, 다운로드 < 1000)
npm unpublish snapdocs@1.0.0

# 사용 중단 표시
npm deprecate snapdocs@1.0.0 "보안 취약점으로 인해 사용 중단"

# 새 버전으로 수정
npm version patch
npm publish
```

### 권한 및 소유권 관리

```bash
# 소유자 목록 확인
npm owner list snapdocs

# 소유자 추가
npm owner add 사용자명 snapdocs

# 소유자 제거
npm owner remove 사용자명 snapdocs
```

## 고급 배포 전략

### 1. Canary 배포

위험을 최소화하는 점진적 배포:

```bash
# Canary 버전 배포
npm version prerelease --preid=canary
npm publish --tag canary

# 사용자 피드백 확인 후 프로덕션 승격
npm dist-tag add snapdocs@1.0.1-canary.0 latest
```

### 2. 다중 환경 지원

```bash
# 환경별 빌드 설정
NODE_ENV=production npm run build
npm publish --tag stable

NODE_ENV=development npm run build  
npm publish --tag development
```

### 3. 패키지 번들링 최적화

```javascript
// package.json - 불필요한 파일 제외
{
  "files": [
    "dist/",
    "templates/",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "registry": "https://registry.npmjs.org"
  }
}
```

## 성능 최적화

### 패키지 크기 최적화

```bash
# 패키지 크기 분석
npm pack --dry-run
bundlephobia snapdocs

# 불필요한 파일 제외
echo "*.map" >> .npmignore
echo "src/" >> .npmignore
echo "tests/" >> .npmignore
```

### 의존성 최적화

```bash
# 런타임에만 필요한 의존성 분리
npm install --save-prod 패키지명
npm install --save-dev 개발패키지명

# Peer Dependencies 활용
npm install --save-peer 공통패키지명
```

## 마케팅 및 사용자 확보

### 1. npm 검색 최적화

package.json의 keywords를 전략적으로 설정:

```json
{
  "keywords": [
    "markdown", "documentation", "generator", 
    "cli", "html", "themes", "docs",
    "static-site", "converter", "developer-tools"
  ]
}
```

### 2. 커뮤니티 참여

- Dev.to, Medium 블로그 포스팅
- 오픈소스 프로젝트 기여
- Stack Overflow 질답 참여
- Reddit 개발자 커뮤니티 참여

## 규정 준수 및 라이센싱

### 오픈소스 라이센스 관리

```bash
# 의존성 라이센스 확인
npm install license-checker
npx license-checker

# 라이센스 호환성 검증
npx license-compatibility-checker
```

### GDPR 및 개인정보 보호

사용자 데이터 수집 시:
- 명확한 개인정보 처리방침
- 데이터 최소 수집 원칙
- 사용자 동의 메커니즘

---

## 요약

SnapDocs의 npm 배포를 성공적으로 완료하려면:

1. **준비**: package.json 완성, 문서화, 테스트
2. **배포**: npm 계정 설정, 드라이런, 실제 배포
3. **관리**: 버전 관리, 보안 유지, 사용자 지원
4. **최적화**: 성능 개선, 마케팅, 커뮤니티 참여

지속적인 개선과 사용자 커뮤니티와의 소통이 성공적인 오픈소스 프로젝트의 핵심입니다.