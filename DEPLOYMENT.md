# 배포 가이드 (Deployment Guide)

이 문서는 `snapdocs` 패키지를 npm에 배포하는 과정을 설명합니다.

## 사전 준비

### 1. GitHub 저장소 생성 및 연결

```bash
# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/nicewook/snapdocs.git

# package.json, README.md, bin 파일의 URL 업데이트
# "nicewook"을 실제 GitHub 사용자명으로 변경
```

### 2. npm 계정 준비

```bash
# npm 계정 생성 (https://www.npmjs.com/signup)
npm login

# 현재 로그인된 사용자 확인
npm whoami
```

### 3. 패키지 정보 업데이트

`package.json`에서 다음 필드들을 업데이트:

```json
{
  "name": "snapdocs",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/nicewook/snapdocs.git"
  },
  "bugs": {
    "url": "https://github.com/nicewook/snapdocs/issues"
  },
  "homepage": "https://github.com/nicewook/snapdocs#readme"
}
```

## 배포 프로세스

### 1. 최종 테스트

```bash
# 의존성 설치 확인
npm install

# 패키지 빌드 테스트
npm run build

# CLI 명령어 테스트
npm run dev --help

# 패키지 유효성 검증
npm pack --dry-run
```

### 2. 버전 관리

```bash
# 첫 번째 릴리스 (1.0.0)
npm version 1.0.0

# 또는 semantic versioning 사용
npm version patch  # 1.0.1
npm version minor  # 1.1.0
npm version major  # 2.0.0
```

### 3. GitHub에 푸시

```bash
# 모든 변경사항 커밋
git add .
git commit -m "Release v1.0.0"

# 태그와 함께 푸시
git push origin main --tags
```

### 4. npm 배포

```bash
# 패키지 배포
npm publish

# 성공 메시지 확인:
# + snapdocs@1.0.0
```

## 배포 후 확인

### 1. 패키지 설치 테스트

```bash
# 전역 설치 테스트
npm install -g snapdocs

# 버전 확인
snapdocs --version

# 기능 테스트
mkdir test-project
cd test-project
snapdocs setup
```

### 2. npx 사용 테스트

```bash
# npx로 직접 사용 테스트
npx snapdocs --help
npx snapdocs setup --theme dark
```

## 업데이트 배포

### 1. 변경사항 개발 및 테스트

```bash
# 개발 변경사항 적용
# ...

# 테스트 실행
npm test  # 테스트 스크립트가 있는 경우
npm run build
```

### 2. 버전 업데이트

```bash
# 적절한 버전 업데이트
npm version patch  # 버그 수정
npm version minor  # 새 기능 추가
npm version major  # 호환성 파괴 변경
```

### 3. 배포

```bash
# GitHub 푸시
git push origin main --tags

# npm 배포
npm publish
```

## 배포 체크리스트

- [ ] package.json 정보 업데이트 완료
- [ ] README.md 문서 최신화
- [ ] 모든 CLI 명령어 테스트 통과
- [ ] npm pack --dry-run 성공
- [ ] npm login 상태 확인
- [ ] Git 저장소 연결 및 푸시 완료
- [ ] 버전 태그 생성
- [ ] npm publish 실행
- [ ] 설치 테스트 완료

## 문제 해결

### 패키지명 충돌

```bash
# 패키지명이 이미 존재하는 경우
npm search snapdocs

# 다른 이름으로 변경
# package.json의 "name" 필드 수정
```

### 권한 오류

```bash
# npm 로그인 다시 시도
npm logout
npm login

# 2FA 설정 확인
npm profile get
```

### 버전 충돌

```bash
# 현재 npm 버전 확인
npm view snapdocs versions --json

# 적절한 버전으로 업데이트
npm version <new-version>
```

## 자동화 (선택사항)

### GitHub Actions CI/CD

`.github/workflows/publish.yml` 파일을 생성하여 자동 배포 설정:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 보안 고려사항

1. **민감 정보 제외**: `.gitignore`에 로그, 설정 파일 등 추가
2. **의존성 보안**: `npm audit` 정기 실행
3. **권한 관리**: npm 계정 2FA 활성화
4. **코드 검토**: 배포 전 코드 리뷰 실시

## 다음 단계

배포 완료 후:

1. GitHub README 업데이트
2. npm 페이지에서 정보 확인
3. 사용자 피드백 수집
4. 버그 리포트 대응 체계 구축
5. 정기 업데이트 계획 수립

---

**참고 링크:**
- [npm 배포 가이드](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Packages](https://docs.github.com/en/packages)