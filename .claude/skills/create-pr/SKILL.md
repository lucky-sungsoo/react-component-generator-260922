---
name: create-pr
description: |
  현재 브랜치의 변경사항으로 GitHub PR을 생성한다. 커밋 로그와 diff를 분석해 제목과 본문을 작성하고,
  프로젝트 언어 관습(기존 PR, README, 오픈소스 신호)에 따라 한국어/영어 템플릿을 자동 선택해 채운다.
  "PR 만들어줘", "PR 생성해줘", "풀리퀘스트 올려줘", "create a PR", "open a pull request" 같은 요청에 활성화한다.
argument-hint: "[base 브랜치] [--en|--ko]"
context: fork
---

# create-pr: GitHub PR 생성

현재 브랜치의 커밋을 분석해 PR 제목·본문을 스스로 작성하고 `gh pr create`로 바로 생성한다. 어떤 템플릿 언어를 쓸지, 본문에 무엇을 채울지는 사용자가 아니라 이 스킬이 근거를 갖고 판단한다.

## Step 0: 사전 점검

- `git status`로 커밋되지 않은 변경사항이 있는지 확인한다. 있으면 사용자에게 알리고, 먼저 커밋(`commit` 스킬 또는 직접 커밋)할지 확인한 뒤 진행한다. 커밋되지 않은 변경사항을 PR에 억지로 포함시키지 않는다.
- `gh auth status`로 GitHub 인증을 확인한다. 인증이 안 되어 있으면 사용자에게 알리고 중단한다.
- 현재 브랜치가 base 브랜치(기본값: 저장소의 default branch, `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`)와 같으면 PR을 만들 수 없다. 사용자에게 알리고, 새 브랜치를 만들지 확인한다.

## Step 1: 원격 반영 확인

- 현재 브랜치가 원격 브랜치를 추적하는지, 로컬이 원격보다 앞서 있는지 확인한다(`git status -sb` 또는 `git rev-list --count @{u}..HEAD`).
- 추적 브랜치가 없거나 로컬 커밋이 더 앞서 있으면 `git push -u origin <branch>`가 필요하다는 것을 사용자에게 알리고 진행한다. push는 원격에 반영되는 작업이므로, 사용자가 이미 이 세션에서 push를 명시적으로 승인한 맥락이 아니라면 먼저 알리고 진행한다.

## Step 2: 변경 내용 분석

- `git log <base>..HEAD --oneline`으로 이 PR에 포함될 전체 커밋을 확인한다. 최신 커밋 하나만 보지 않는다.
- `git diff <base>...HEAD`로 실제 변경 내용을 확인한다.
- 여러 커밋의 의도를 종합해 PR 전체가 "왜" 필요한지 파악한다.

## Step 3: 템플릿 언어 결정

기본값은 **한국어 템플릿**(`references/template-ko.md`)이다. 다음 순서로 확인해 **영어 템플릿**(`references/template-en.md`)으로 바꿀지 판단한다:

1. **기존 PR 관습이 최우선이다.** `gh pr list --state all --limit 5 --json title,body`로 최근 PR을 확인한다. 제목·본문이 영어 위주면 영어 템플릿, 한국어 위주면 한국어 템플릿을 쓴다. 기존 PR이 있으면 이 신호만으로 결정하고 아래 단계는 건너뛴다.
2. 기존 PR이 없으면 저장소가 **오픈소스 영어 기반 프로젝트**인지 본다: 저장소가 public이고(`gh repo view --json isPrivate`), `README.md`/`CONTRIBUTING.md` 등 대표 문서가 영어로 작성되어 있으면 영어 템플릿을 쓴다.
3. 그 외 모든 경우(신호가 없거나 애매함, README가 한국어, private 저장소)는 **기본값인 한국어 템플릿**을 쓴다.
4. 사용자가 `--en`/`--ko`를 인자로 명시했으면 위 판단을 무시하고 그것을 따른다.

## Step 4: 템플릿 채우기

선택한 템플릿 파일(`references/template-ko.md` 또는 `references/template-en.md`)을 읽고, Step 2에서 분석한 내용으로 각 섹션을 채운다. 템플릿의 섹션 구조와 주석은 그대로 유지하고, 내용이 없는 선택적 섹션은 템플릿 안내대로 삭제한다.

제목은 커밋 메시지 컨벤션(있다면 `type: 요약` 형식)을 따르고, 70자 이내로 간결하게 쓴다.

## Step 5: PR 생성

- 본문은 개행이 포함되므로 heredoc으로 전달한다.
- `gh pr create --base <base> --title "<제목>" --body "$(cat <<'EOF' ... EOF)"`
- 생성된 PR URL을 사용자에게 보여준다.

## 하지 않는 것

- 사용자가 명시적으로 요청하지 않으면 `--draft`가 아닌 이상 리뷰어 지정, 라벨 추가 등 부가 작업을 하지 않는다.
- 커밋되지 않은 변경사항을 임의로 커밋해서 PR에 포함시키지 않는다.
- 템플릿의 섹션 구조를 임의로 바꾸지 않는다(언어만 선택할 뿐, 구조는 references 파일을 그대로 따른다).
