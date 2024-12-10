const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let canAddBlock = true;

// ブロックリストと盤面上のブロック
const BlockList = [
    { id: "Lava", color: "red" },
    { id: "Water", color: "blue" },
    { id: "SodaStone", color: "lightblue" },
    { id: "Ocean", color: "blue"},
    { id: "Deerium", color: "lightgreen"},
    { id: "Saba", color: "darkblue"},
];
let blocks = [];

// レシピ: 合体の条件
const recipes = [
    { gradient1: "Lava", gradient2: "Lava", result: "Water" },
    { gradient1: "Lava", gradient2: "Water", result: "SodaStone" },
    { gradient1: "Water", gradient2: "SodaStone", result: "Ocean"},
    { gradient1: "Ocean", gradient2: "Deerium", result: "Saba"},
    { gradient1: "SodaStone", gradient2: "SodaStone", result: "Deerium"}
];

// マウス位置をトラッキング
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// ブロッククラス
class Block {
    constructor(id, x, y) {
        this.id = id;
        this.color = BlockList.find(block => block.id === id).color;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.isDragging = false;
    }

    draw() {
        // ブロック本体を描画
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 名前（ID）を描画
        ctx.fillStyle = "white"; // テキスト色

        // 自動フォントサイズ調整
        this.adjustFontSize();

        // テキストを中央揃え
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // 自動改行処理
        this.drawTextWithWrap(this.id, this.x + this.width / 2, this.y + this.height / 2, this.width - 10);
    }

    // 自動改行処理
    drawTextWithWrap(text, x, y, maxWidth) {
        const words = text.split(' '); // スペースで単語に分ける
        let line = "";
        let lineHeight = 20; // 行間

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            const testWidth = ctx.measureText(testLine).width;
            
            if (testWidth > maxWidth && i > 0) {
                // 幅を超えた場合、改行
                ctx.fillText(line, x, y);
                line = words[i] + " ";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y); // 最後の行
    }

    // 自動フォントサイズ調整
    adjustFontSize() {
        const maxFontSize = 16;
        const minFontSize = 10;
        const padding = 10;

        let fontSize = maxFontSize;
        ctx.font = `${fontSize}px Arial`;

        while (ctx.measureText(this.id).width > this.width - padding && fontSize > minFontSize) {
            fontSize--;
            ctx.font = `${fontSize}px Arial`;
        }
    }

    isPointInside(px, py) {
        return px > this.x && px < this.x + this.width &&
               py > this.y && py < this.y + this.height;
    }
}

// ドラッグ操作
let selectedBlock = null;
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let block of blocks) {
        if (block.isPointInside(mouseX, mouseY)) {
            selectedBlock = block;
            block.isDragging = true;
            break;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (selectedBlock && selectedBlock.isDragging) {
        const rect = canvas.getBoundingClientRect();
        selectedBlock.x = e.clientX - rect.left - selectedBlock.width / 2;
        selectedBlock.y = e.clientY - rect.top - selectedBlock.height / 2;
    }
});

canvas.addEventListener("mouseup", () => {
    if (selectedBlock) {
        selectedBlock.isDragging = false;
        checkCollision(selectedBlock);
        selectedBlock = null;
    }
});

// スペースキーで赤ブロックを追加
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && canAddBlock) {
        // 赤ブロックを生成
        const newBlock = new Block("Lava", mouseX - 25, mouseY - 25);
        blocks.push(newBlock);

        // 衝突チェックと即時合成
        checkCollision(newBlock);

        // クールダウンの設定
        canAddBlock = false;
        setTimeout(() => {
            canAddBlock = true;
        }, 2000); // 2秒のクールダウン
    }
});

// 衝突チェックと合体処理
function checkCollision(block) {
    for (let other of blocks) {
        if (block !== other &&
            block.x < other.x + other.width &&
            block.x + block.width > other.x &&
            block.y < other.y + other.height &&
            block.y + block.height > other.y) {

            const result = findRecipeResult(block.id, other.id);
            if (result) {
                const newX = (block.x + other.x) / 2;
                const newY = (block.y + other.y) / 2;

                // 合体したブロックを削除し、新しいブロックを追加
                blocks = blocks.filter(b => b !== block && b !== other);
                blocks.push(new Block(result, newX, newY));
                return; // 合体が発生したらループを終了
            }
        }
    }
}

// レシピの結果を見つける関数
function findRecipeResult(id1, id2) {
    for (let recipe of recipes) {
        if ((recipe.gradient1 === id1 && recipe.gradient2 === id2) ||
            (recipe.gradient1 === id2 && recipe.gradient2 === id1)) {
            return recipe.result;
        }
    }
    return null; // 合致するレシピがない場合
}

// 描画ループ
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let block of blocks) {
        block.draw();
    }
    requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();
