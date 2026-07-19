# VowelPilot — 元音航行

IPA 元音図をマップに、舌の位置と唇の形で音の宇宙を探索する発音訓練ゲーム。

**[PLAY NOW](https://jingsun-tr.github.io/vowel-pilot/)**

## How to Play

| キー | 操作 |
|------|------|
| ← → | 舌を前後させる |
| ↑ ↓ | 舌の高さを変える（口の開き具合） |
| Shift | 円唇 ↔ 展唇 を切り替え |

ターゲットの IPA 元音に近づいて、キャプチャゾーンに入れましょう。

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion
- Single-file HTML build (zero dependencies at runtime)

## Development

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # dist/index.html (single-file, ~300KB)
```

## Deploy

```bash
./deploy.sh  # builds and pushes to gh-pages branch
```
