# GINKYO · 파칭코 시뮬레이터

[브라우저에서 플레이](https://ginkyo-pachinko-hall-k7.rlawotns1597.chatgpt.site)

가상 지폐를 넣고 기계 오른쪽 아래 손잡이를 돌리면 구슬이 발사됩니다. 손잡이를 고정한 뒤에도 세기를 바꿀 수 있습니다. 액정 아래 헤소에 구슬이 들어가면 추첨이 시작됩니다. 당첨 후에는 기체의 우타 안내에 따라 손잡이를 끝까지 돌리세요.

**로컬 실행** — 저장소 루트에서 아래 명령을 실행한 뒤 [localhost:8000](http://localhost:8000)을 엽니다. 별도 빌드나 패키지 설치는 필요하지 않습니다.

```sh
python -m http.server 8000 --directory dist
```

**물리 검증** — Node.js로 `node tests/stage.cjs`, `node tests/pin-contact.cjs`를 실행할 수 있습니다. 여러 발사 세기에서 실제 게임의 구슬 경로를 집계하려면 `node tests/shot-trace.cjs --shots=250`을 사용하세요.

[판면과 못 배치](docs/판면-못-배치.md) · [워프와 스테이지](docs/워프와-스테이지.md)
