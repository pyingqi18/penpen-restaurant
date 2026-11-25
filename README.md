# 盆盆餐厅

给爸妈玩的横屏小游戏（iPhone 网页版）。猫猫开的小餐馆：白天备菜种地，晚上开店招呼客人。

- **在线试玩**：GitHub Pages 打开 `docs/index.html`。iPhone 上用 Safari 打开 → 分享 → 「添加到主屏幕」，从桌面图标打开就是全屏。
- **构建**：`cd game && node build.js` → 生成 `game/dist/index.html`（正式版）和 `game/dist/greybox.html`（灰盒验收版）。
- **测试**：`node bot.js 3`（机器人玩 1–3 天）、`GREYBOX=five node bot.js 7`（灰盒五桌一班：盘子守恒、走不到、穿墙自检）。需要 Playwright + Chrome。
- **布局**：`tools/gen_layout.js` 生成 `game/layout.json`（桌位、站位、点按区、碰撞，全部用稳定 ID）。

## 发版规则
只有主人在对话里点「通过」的版本才推到这里；每个通过的版本打一个 tag（`v日期-编号`），`docs/` 里就是那一版。

## 说明
角色、美术都是原创。不包含任何别家游戏或动画的素材。
