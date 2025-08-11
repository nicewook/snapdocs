# SnapDocs

📚 모든 프로그래밍 언어 프로젝트에 문서화 시스템을 설치하는 범용 CLI 도구입니다. 테마를 지원하는 마크다운 파일로부터 아름다운 HTML 문서를 생성합니다.

## ✨ 주요 기능

- 🌍 **범용 언어 지원**: Go, Java, Python, Node.js 등 모든 프로젝트에서 동작
- 🎨 **다양한 테마**: 기본, 다크, 깃허브 테마 제공
- 📱 **반응형 디자인**: 모바일 친화적인 문서 포털
- 🔍 **자동 탐지**: 마크다운 파일을 자동으로 찾고 분류
- 🎯 **Front Matter 지원**: 제목과 카테고리를 위한 YAML 메타데이터
- 👀 **실시간 감시**: 파일 변경 시 실시간 재생성
- 📂 **스마트 통합**: 기존 프로젝트를 손상시키지 않고 적응
- 🚀 **단일 명령 설치**: 어디서나 작동하는 하나의 명령
- 🔧 **설정 가능**: config.json을 통한 사용자 정의
- 📦 **npm 워크플로**: 모든 언어에서 일관된 `npm run docs`

## 🚀 설치

```bash
# npx로 직접 사용 (권장)
npx snapdocs setup

# 또는 전역 설치
npm install -g snapdocs
```

## ⚡ 빠른 시작

### 모든 프로젝트에 설치

```bash
# 모든 프로그래밍 언어 프로젝트에서 작동
cd your-project          # Go, Java, Python, Node.js 등
npx snapdocs setup      # 범용 설치
npm run docs            # 문서 생성
npm run docs:watch      # 실시간 감시 시작
```

### 언어별 예제

```bash
# Go 프로젝트
cd my-go-microservice/
npx snapdocs setup
npm run docs

# Java Spring Boot 프로젝트
cd my-spring-app/
npx snapdocs setup
npm run docs

# Python Django 프로젝트
cd my-django-api/
npx snapdocs setup
npm run docs

# Node.js 프로젝트
cd my-node-app/
npx snapdocs setup
npm run docs
```

## 🎯 작동 원리

SnapDocs는 프로젝트에 지능적으로 적응합니다:

### Node.js 프로젝트에서
- ✅ 기존 `package.json` 활용
- ✅ 문서화 스크립트 추가
- ✅ 필요한 의존성 설치

### 비-Node.js 프로젝트에서
- ✅ 문서 전용 최소 `package.json` 생성
- ✅ `npm run docs` 워크플로 활성화
- ✅ 메인 프로젝트와의 간섭 없음

### 스마트 기능
- 🧠 기존 문서화 시스템 자동 감지
- 🔄 사용자 정의 설정을 보존하며 구성 업데이트
- 💾 변경 전 선택적 백업 생성
- 🎨 테마 선택 및 전환

## 📋 명령어 참조

### 단일 범용 명령

| 명령어 | 설명 |
|---------|-------------|
| `setup` | 모든 프로젝트에 문서화 시스템 설치 |
| `help` | 도움말 정보 표시 |

### 옵션

| 옵션 | 설명 |
|--------|-------------|
| `-t, --theme <theme>` | 테마 선택: default, dark, github |
| `-f, --force` | 기존 파일 덮어쓰기 |
| `--no-install` | npm install 건너뛰기 |
| `--backup` | 기존 파일 백업 생성 |

### 예제

```bash
# 기본 설치
npx snapdocs setup

# 다크 테마로 설치
npx snapdocs setup --theme dark

# 백업과 함께 기존 시스템 업데이트
npx snapdocs setup --backup

# 강제 재설치
npx snapdocs setup --force
```

## 📦 생성되는 스크립트

설치 후 **모든** 프로젝트 언어에서 작동하는 스크립트들:

```json
{
  "scripts": {
    "docs": "node docs/generator/docs-generator.js",
    "docs:watch": "node docs/generator/docs-generator.js --watch",
    "docs:dark": "node docs/generator/docs-generator.js --theme dark",
    "docs:github": "node docs/generator/docs-generator.js --theme github"
  }
}
```

## 🏗️ 프로젝트 구조

설치 후 모든 프로젝트는 다음과 같은 구조를 가집니다:

```
your-project/                    # Go, Java, Python, Node.js 등
├── docs/
│   ├── generator/
│   │   ├── docs-generator.js    # 문서 생성기
│   │   ├── config.json          # 설정 파일
│   │   └── styles/
│   │       ├── default.css      # 기본 테마
│   │       ├── dark.css         # 다크 테마
│   │       └── github.css       # 깃허브 테마
│   ├── CLAUDE.md                # 문서화 가이드라인
│   └── *.md                     # 사용자 문서 파일들
├── package.json                 # 생성되거나 향상됨
├── index.html                   # 생성된 문서
└── [프로젝트 파일들]              # 그대로 유지
```

## 📝 문서 형식

더 나은 구성을 위해 front matter를 포함한 마크다운 파일을 작성하세요:

```markdown
---
title: API 참조
category: technical
created: 2024-01-01T00:00:00Z
---

# API 참조

여기에 문서 내용을 작성하세요...
```

### Front Matter 필드

| 필드 | 설명 | 예제 |
|-------|-------------|---------|
| `title` | 문서 제목 | `"API 참조"` |
| `category` | 그룹화를 위한 카테고리 | `"technical"` |
| `created` | 생성 날짜 | `"2024-01-01T00:00:00Z"` |

### 사용 가능한 카테고리

- `overview` - 프로젝트 개요 및 소개
- `technical` - 기술 사양 및 API 문서
- `analysis` - 연구 및 분석 문서
- `planning` - 프로젝트 계획 및 로드맵
- `misc` - 기타 문서

## 🎨 테마

### 기본 테마
밝은 색상과 뛰어난 가독성을 제공하는 깔끔하고 현대적인 디자인입니다.

### 다크 테마
다크 인터페이스를 선호하는 개발자를 위한 깃허브에서 영감을 받은 다크 테마입니다.

### 깃허브 테마
친숙한 문서 경험을 위해 깃허브의 공식 스타일링과 일치합니다.

## ⚙️ 설정

`docs/generator/config.json` 파일이 생성기 동작을 제어합니다:

```json
{
  "theme": "default",
  "title": "프로젝트 문서",
  "subtitle": "프로젝트 문서",
  "outputFile": "index.html",
  "docsDir": "docs",
  "excludeFiles": ["temp.md", "draft.md", "*temp*", "*draft*", "*.bak"],
  "categoryOrder": ["overview", "technical", "analysis", "planning", "misc"],
  "defaultCategory": "문서"
}
```

## 🌏 다국어 지원

### 한글 폰트 최적화

최적화된 한글 타이포그래피를 포함합니다:

```css
font-family: -apple-system, BlinkMacSystemFont, 
    "Apple SD Gothic Neo", "Pretendard Variable", 
    Pretendard, "Noto Sans KR", "Malgun Gothic", 
    "Apple Color Emoji", "Segoe UI", Roboto, sans-serif;
```

## 🔧 개발 워크플로

### VS Code Live Server 통합

실시간 개발을 위한 완벽한 통합:

1. [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 설치
2. `npm run docs:watch` 실행하여 파일 감시 시작
3. `index.html`을 우클릭하고 "Open with Live Server" 선택
4. 마크다운 파일을 편집하고 실시간으로 변경사항 확인

### 커스텀 테마

CSS 파일을 추가하여 커스텀 테마를 생성하세요:

```bash
# 커스텀 테마 생성
echo "/* 커스텀 테마 */" > docs/generator/styles/custom.css

# 커스텀 테마 사용
npm run docs -- --theme custom
```

### 파일 제외

glob 패턴을 사용하여 파일을 제외하세요:

```json
{
  "excludeFiles": [
    "temp.md",
    "draft.md", 
    "*temp*",
    "*draft*",
    "*.bak"
  ]
}
```

## 🔄 프로그래밍 방식 사용

```javascript
const { setup } = require('snapdocs');

await setup({
  theme: 'dark',
  force: true,
  backup: true
});
```

## 🛠️ 문제 해결

### 일반적인 문제

1. **"Cannot find module" 오류**: 프로젝트에서 `npm install` 실행
2. **Permission denied**: `chmod +x docs/generator/docs-generator.js` 실행
3. **파일이 감지되지 않음**: config.json의 `excludeFiles` 확인
4. **스타일이 로드되지 않음**: `docs/generator/styles/`에 테마 파일이 존재하는지 확인

### 디버그 모드

상세한 로깅 활성화:

```bash
DEBUG=snapdocs npm run docs
```

## 📋 요구사항

- **Node.js** 14.0.0 이상 (문서 생성용)
- **npm** 6.0.0 이상
- **모든 프로그래밍 언어 프로젝트** (Go, Java, Python, Node.js 등)

## 📦 의존성

**런타임 의존성:**
- `commander` - CLI 프레임워크
- `inquirer` - 대화형 프롬프트
- `fs-extra` - 향상된 파일 시스템 작업
- `handlebars` - 템플릿 엔진
- `chalk` - 터미널 스타일링

**문서 의존성 (자동 설치):**
- `chokidar` - 파일 감시
- `gray-matter` - Front matter 파싱
- `marked` - 마크다운 파싱

## 🤝 기여하기

1. 리포지토리를 포크하세요
2. 기능 브랜치를 생성하세요
3. 변경사항을 적용하세요
4. 테스트를 추가하세요
5. 풀 리퀘스트를 제출하세요

## 📄 라이센스

MIT 라이센스 - 자세한 내용은 LICENSE 파일을 참조하세요.

## 📈 변경로그

### v0.1.0
- 범용 언어 지원 (Go, Java, Python, Node.js 등)
- 모든 시나리오를 위한 단일 `setup` 명령
- 스마트 package.json 처리 (최소 생성 또는 기존 향상)
- 자동 문서화 시스템 감지 및 업데이트
- 다양한 테마 (기본, 다크, 깃허브)
- 파일 감시 및 실시간 재생성
- 한글 폰트 최적화
- 반응형 디자인
- Front matter 지원

## 💬 지원

- 🐛 [버그 리포트](https://github.com/nicewook/snapdocs/issues)
- 💡 [기능 요청](https://github.com/nicewook/snapdocs/issues)
- 📖 [문서](https://github.com/nicewook/snapdocs)
- 💬 [토론](https://github.com/nicewook/snapdocs/discussions)

---

프로그래밍 언어에 관계없이 아름다운 문서를 사랑하는 개발자들을 위해 ❤️로 만들었습니다.