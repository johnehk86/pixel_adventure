/**
 * SpriteRenderer - Procedural pixel-art rendering system for Mario game.
 * All sprites are drawn using Canvas 2D API calls and pre-rendered
 * to offscreen canvases for performance.
 * This file must be loaded FIRST before all other JS files.
 */
const SpriteRenderer = {
    sprites: {},
    initialized: false,

    // ─── Color Palette ───
    colors: {
        sky:           '#6B8CFF',
        marioRed:      '#E52521',
        marioBrown:    '#6B1400',
        marioBlue:     '#1560BD',
        marioSkin:     '#FBD000',
        marioSkinDark: '#E8A200',
        marioShoe:     '#6B1400',
        brick:         '#C84C0C',
        brickDark:     '#8B3000',
        brickMortar:   '#D89868',
        questionBlock: '#FAA005',
        questionDark:  '#C87400',
        questionLight: '#FCD880',
        ground:        '#C84C0C',
        groundDark:    '#8B3000',
        pipeGreen:     '#00A800',
        pipeGreenDark: '#006800',
        pipeGreenLight:'#54D854',
        goombaBrown:   '#A0522D',
        goombaDark:    '#6B3410',
        koopaGreen:    '#00A800',
        koopaGreenDk:  '#006800',
        koopaYellow:   '#FBD000',
        mushroomRed:   '#E52521',
        mushroomWhite: '#FFFFFF',
        mushroomTan:   '#F0D0A0',
        coinGold:      '#FAA005',
        coinLight:     '#FCD880',
        white:         '#FFFFFF',
        black:         '#000000',
        gray:          '#888888',
        grayLight:     '#BBBBBB',
        grayDark:      '#555555',
        hillGreen:     '#00A800',
        hillGreenDk:   '#006800',
        bushGreen:     '#00A800',
        bushGreenLt:   '#54D854',
        cloudWhite:    '#FFFFFF',
        cloudGray:     '#DDDDEE',
        flagGreen:     '#00A800',
        emptyBlock:    '#886644',
        emptyBlockDk:  '#664422',
        hardBlock:     '#AAAAAA',
        hardBlockDk:   '#777777',
        hardBlockLt:   '#CCCCCC',
        fireOrange:    '#FF8800',
        fireYellow:    '#FFDD00',
        fireRed:       '#E52521',
        // Ninja Turtle colors
        ninjaGreen:    '#2E8B2E',
        ninjaDkGreen:  '#1A5C1A',
        ninjaMask:     '#E85820',
        ninjaBelly:    '#D2B870',
        ninjaBellyDk:  '#B89850',
        ninjaBrown:    '#6B4226',
        ninjaShell:    '#3B6B3B',
        ninjaShellDk:  '#264D26',
        // Princess colors
        princessPink:  '#F090C0',
        princessPinkDk:'#D06898',
        princessPinkLt:'#FFBBDD',
        princessHair:  '#FFD740',
        princessHairDk:'#D4A820',
        princessSkin:  '#FFE0C0',
        princessSkinDk:'#F0C8A0',
        princessCrown: '#FFD700',
        princessCrownDk:'#DAA520',
        princessWhite: '#FFFFFF',
        princessEye:   '#4488CC',
        // Attack colors
        magicPink:     '#FF66CC',
        magicPurple:   '#AA44FF',
        magicLight:    '#FFAAEE',
        shurikenGray:  '#AAAAAA',
        shurikenDark:  '#666666',
        shurikenLight: '#DDDDDD',
    },

    // ─── Helper Methods ───

    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },

    drawPixel(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
    },

    drawPixels(ctx, pixels, size) {
        for (const [x, y, color] of pixels) {
            ctx.fillStyle = color;
            ctx.fillRect(x * size, y * size, size, size);
        }
    },

    mirrorSprite(sourceCanvas) {
        const canvas = this.createCanvas(sourceCanvas.width, sourceCanvas.height);
        const ctx = canvas.getContext('2d');
        ctx.translate(sourceCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sourceCanvas, 0, 0);
        return canvas;
    },

    // ─── Initialization ───

    init() {
        if (this.initialized) return;

        this.sprites.marioSmall = {};
        this.sprites.marioBig = {};
        this.sprites.ninjaSmall = {};
        this.sprites.ninjaBig = {};
        this.sprites.princessSmall = {};
        this.sprites.princessBig = {};
        this.sprites.attacks = {};
        this.sprites.tiles = {};
        this.sprites.enemies = {};
        this.sprites.items = {};
        this.sprites.flag = {};
        this.sprites.background = {};

        this._createMarioSmallSprites();
        this._createMarioBigSprites();
        this._createNinjaTurtle();
        this._createPrincess();
        this._createAttacks();
        this._createTileSprites();
        this._createEnemySprites();
        this._createItemSprites();
        this._createFlagSprites();
        this._createBackgroundSprites();

        this.initialized = true;
    },

    // ═══════════════════════════════════════════════════════
    // MARIO SMALL SPRITES (24x32)
    // ═══════════════════════════════════════════════════════

    _createMarioSmallSprites() {
        const W = 24, H = 32;
        const P = 2; // pixel size

        // Standing
        const standing = this._drawMarioSmallStanding(W, H, P);
        this.sprites.marioSmall.standRight = standing;
        this.sprites.marioSmall.standLeft = this.mirrorSprite(standing);

        // Walk frames
        for (let i = 0; i < 3; i++) {
            const walk = this._drawMarioSmallWalk(W, H, P, i);
            this.sprites.marioSmall['walkRight' + i] = walk;
            this.sprites.marioSmall['walkLeft' + i] = this.mirrorSprite(walk);
        }

        // Jump
        const jump = this._drawMarioSmallJump(W, H, P);
        this.sprites.marioSmall.jumpRight = jump;
        this.sprites.marioSmall.jumpLeft = this.mirrorSprite(jump);
    },

    _drawMarioSmallStanding(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Each "pixel" is PxP. Grid is 12x16 logical pixels.
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Hat (red)
        row([4,5,6,7,8], 0, c.marioRed);
        row([3,4,5,6,7,8,9,10], 1, c.marioRed);

        // Hair / face line
        row([3,4,5], 2, c.marioBrown);
        row([6,7], 2, c.marioSkin);
        row([8], 2, c.marioSkin);
        px(9, 2, c.marioSkin);

        // Face
        row([2,3], 3, c.marioBrown);
        px(4, 3, c.marioSkin);
        px(5, 3, c.marioBrown);
        row([6,7], 3, c.marioSkin);
        px(8, 3, c.marioBrown);
        row([9,10], 3, c.marioSkin);

        // Face row 2
        row([2,3], 4, c.marioBrown);
        px(4, 4, c.marioSkin);
        px(5, 4, c.marioBrown);
        px(6, 4, c.marioSkin);
        row([7,8,9], 4, c.marioSkin);
        px(10, 4, c.marioSkin);

        // Face bottom
        row([4,5,6,7,8,9], 5, c.marioSkin);

        // Shirt + overalls top
        row([3,4,5], 6, c.marioRed);
        row([6,7], 6, c.marioBlue);
        row([8,9], 6, c.marioRed);

        row([2,3,4,5], 7, c.marioRed);
        row([6,7], 7, c.marioBlue);
        row([8,9,10], 7, c.marioRed);

        // Overalls body
        row([3,4], 8, c.marioBlue);
        row([5,6], 8, c.marioRed);
        row([7,8], 8, c.marioBlue);
        px(9, 8, c.marioBlue);

        row([3,4,5,6,7,8,9], 9, c.marioBlue);

        // Overalls lower
        row([3,4,5,6,7,8,9], 10, c.marioBlue);

        // Legs
        row([3,4,5], 11, c.marioBlue);
        row([7,8,9], 11, c.marioBlue);

        // Shoes
        row([2,3,4,5], 12, c.marioBrown);
        row([7,8,9,10], 12, c.marioBrown);

        row([2,3,4,5], 13, c.marioBrown);
        row([7,8,9,10], 13, c.marioBrown);

        return canvas;
    },

    _drawMarioSmallWalk(W, H, P, frame) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Hat (same for all frames)
        row([4,5,6,7,8], 0, c.marioRed);
        row([3,4,5,6,7,8,9,10], 1, c.marioRed);

        // Face (same for all frames)
        row([3,4,5], 2, c.marioBrown);
        row([6,7,8,9], 2, c.marioSkin);

        row([2,3], 3, c.marioBrown);
        px(4, 3, c.marioSkin);
        px(5, 3, c.marioBrown);
        row([6,7], 3, c.marioSkin);
        px(8, 3, c.marioBrown);
        row([9,10], 3, c.marioSkin);

        row([2,3], 4, c.marioBrown);
        px(4, 4, c.marioSkin);
        px(5, 4, c.marioBrown);
        row([6,7,8,9,10], 4, c.marioSkin);

        row([4,5,6,7,8,9], 5, c.marioSkin);

        // Body (same for all frames)
        row([3,4,5], 6, c.marioRed);
        row([6,7], 6, c.marioBlue);
        row([8,9], 6, c.marioRed);
        row([2,3,4,5], 7, c.marioRed);
        row([6,7], 7, c.marioBlue);
        row([8,9,10], 7, c.marioRed);

        row([3,4], 8, c.marioBlue);
        row([5,6], 8, c.marioRed);
        row([7,8,9], 8, c.marioBlue);

        row([3,4,5,6,7,8,9], 9, c.marioBlue);

        // Legs and feet vary by frame
        if (frame === 0) {
            // Stride forward
            row([4,5,6,7,8,9], 10, c.marioBlue);
            row([3,4,5], 11, c.marioBlue);
            row([8,9], 11, c.marioBlue);
            row([2,3,4], 12, c.marioBrown);
            row([8,9,10], 12, c.marioBrown);
            row([1,2,3], 13, c.marioBrown);
            row([9,10,11], 13, c.marioBrown);
        } else if (frame === 1) {
            // Mid-step
            row([4,5,6,7,8], 10, c.marioBlue);
            row([4,5], 11, c.marioBlue);
            row([7,8], 11, c.marioBlue);
            row([3,4,5], 12, c.marioBrown);
            row([7,8,9], 12, c.marioBrown);
            row([3,4,5], 13, c.marioBrown);
            row([7,8,9], 13, c.marioBrown);
        } else {
            // Other stride
            row([4,5,6,7,8,9], 10, c.marioBlue);
            row([5,6], 11, c.marioBlue);
            row([8,9], 11, c.marioBlue);
            row([5,6,7], 12, c.marioBrown);
            row([9,10], 12, c.marioBrown);
            row([5,6,7], 13, c.marioBrown);
            row([10,11], 13, c.marioBrown);
        }

        return canvas;
    },

    _drawMarioSmallJump(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Hat
        row([4,5,6,7,8], 0, c.marioRed);
        row([3,4,5,6,7,8,9,10], 1, c.marioRed);

        // Face
        row([3,4,5], 2, c.marioBrown);
        row([6,7,8,9], 2, c.marioSkin);

        row([2,3], 3, c.marioBrown);
        px(4, 3, c.marioSkin);
        px(5, 3, c.marioBrown);
        row([6,7], 3, c.marioSkin);
        px(8, 3, c.marioBrown);
        row([9,10], 3, c.marioSkin);

        row([2,3], 4, c.marioBrown);
        px(4, 4, c.marioSkin);
        px(5, 4, c.marioBrown);
        row([6,7,8,9,10], 4, c.marioSkin);

        row([4,5,6,7,8,9], 5, c.marioSkin);

        // Arm up + body
        px(2, 5, c.marioRed);
        px(10, 5, c.marioSkin); // hand up

        row([3,4,5], 6, c.marioRed);
        row([6,7], 6, c.marioBlue);
        row([8,9,10], 6, c.marioRed);

        row([3,4,5], 7, c.marioRed);
        row([6,7], 7, c.marioBlue);
        row([8,9], 7, c.marioRed);

        row([3,4], 8, c.marioBlue);
        row([5,6], 8, c.marioRed);
        row([7,8,9], 8, c.marioBlue);

        row([3,4,5,6,7,8,9], 9, c.marioBlue);

        // Legs together / up
        row([4,5,6], 10, c.marioBlue);
        row([7,8], 10, c.marioBlue);

        row([3,4,5], 11, c.marioBlue);
        row([9,10], 11, c.marioBrown);

        row([2,3,4], 12, c.marioBrown);
        row([9,10], 12, c.marioBrown);

        row([2,3], 13, c.marioBrown);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // MARIO BIG SPRITES (24x56)
    // ═══════════════════════════════════════════════════════

    _createMarioBigSprites() {
        const W = 24, H = 56;
        const P = 2;

        const standing = this._drawMarioBigStanding(W, H, P);
        this.sprites.marioBig.standRight = standing;
        this.sprites.marioBig.standLeft = this.mirrorSprite(standing);

        for (let i = 0; i < 3; i++) {
            const walk = this._drawMarioBigWalk(W, H, P, i);
            this.sprites.marioBig['walkRight' + i] = walk;
            this.sprites.marioBig['walkLeft' + i] = this.mirrorSprite(walk);
        }

        const jump = this._drawMarioBigJump(W, H, P);
        this.sprites.marioBig.jumpRight = jump;
        this.sprites.marioBig.jumpLeft = this.mirrorSprite(jump);
    },

    _drawMarioBigStanding(W, H, P) {
        // 12x28 logical grid * 2px = 24x56
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Hat
        row([4,5,6,7,8], 0, c.marioRed);
        row([3,4,5,6,7,8,9,10], 1, c.marioRed);
        row([3,4,5,6,7,8,9,10], 2, c.marioRed);

        // Hair + forehead
        row([3,4,5], 3, c.marioBrown);
        row([6,7,8,9], 3, c.marioSkin);

        // Face
        row([2,3], 4, c.marioBrown);
        px(4, 4, c.marioSkin);
        px(5, 4, c.marioBrown);
        row([6,7,8], 4, c.marioSkin);
        px(9, 4, c.marioBrown);
        px(10, 4, c.marioSkin);

        row([2,3], 5, c.marioBrown);
        px(4, 5, c.marioSkin);
        px(5, 5, c.marioBrown);
        row([6,7,8,9,10], 5, c.marioSkin);

        row([4,5,6,7,8,9], 6, c.marioSkin);
        row([4,5,6,7,8,9], 7, c.marioSkin);

        // Neck
        row([5,6,7], 8, c.marioSkin);

        // Shirt upper
        row([3,4,5,6,7,8,9], 9, c.marioRed);
        row([2,3,4,5,6,7,8,9,10], 10, c.marioRed);
        // Arms and shirt
        px(2, 11, c.marioSkin);
        row([3,4,5], 11, c.marioRed);
        row([6,7], 11, c.marioBlue);
        row([8,9], 11, c.marioRed);
        px(10, 11, c.marioSkin);

        px(1, 12, c.marioSkin);
        row([2,3,4,5], 12, c.marioRed);
        row([6,7], 12, c.marioBlue);
        row([8,9,10], 12, c.marioRed);
        px(11, 12, c.marioSkin);

        px(1, 13, c.marioSkin);
        row([2,3], 13, c.marioSkin);
        row([4,5], 13, c.marioBlue);
        row([6,7], 13, c.marioRed);
        row([8,9], 13, c.marioBlue);
        row([10,11], 13, c.marioSkin);

        // Overalls body
        row([3,4,5,6,7,8,9], 14, c.marioBlue);
        row([3,4,5,6,7,8,9], 15, c.marioBlue);
        row([3,4,5,6,7,8,9], 16, c.marioBlue);
        row([3,4,5,6,7,8,9], 17, c.marioBlue);
        row([3,4,5,6,7,8,9], 18, c.marioBlue);

        // Buttons on overalls
        px(4, 15, c.marioSkin);
        px(8, 15, c.marioSkin);

        // Legs separation
        row([3,4,5], 19, c.marioBlue);
        row([7,8,9], 19, c.marioBlue);

        row([3,4,5], 20, c.marioBlue);
        row([7,8,9], 20, c.marioBlue);

        row([3,4,5], 21, c.marioBlue);
        row([7,8,9], 21, c.marioBlue);

        // Shoes
        row([2,3,4,5], 22, c.marioBrown);
        row([7,8,9,10], 22, c.marioBrown);

        row([1,2,3,4,5], 23, c.marioBrown);
        row([7,8,9,10,11], 23, c.marioBrown);

        row([1,2,3,4,5], 24, c.marioBrown);
        row([7,8,9,10,11], 24, c.marioBrown);

        return canvas;
    },

    _drawMarioBigWalk(W, H, P, frame) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head - same as standing
        row([4,5,6,7,8], 0, c.marioRed);
        row([3,4,5,6,7,8,9,10], 1, c.marioRed);
        row([3,4,5,6,7,8,9,10], 2, c.marioRed);

        row([3,4,5], 3, c.marioBrown);
        row([6,7,8,9], 3, c.marioSkin);

        row([2,3], 4, c.marioBrown);
        px(4, 4, c.marioSkin);
        px(5, 4, c.marioBrown);
        row([6,7,8], 4, c.marioSkin);
        px(9, 4, c.marioBrown);
        px(10, 4, c.marioSkin);

        row([2,3], 5, c.marioBrown);
        px(4, 5, c.marioSkin);
        px(5, 5, c.marioBrown);
        row([6,7,8,9,10], 5, c.marioSkin);

        row([4,5,6,7,8,9], 6, c.marioSkin);
        row([4,5,6,7,8,9], 7, c.marioSkin);
        row([5,6,7], 8, c.marioSkin);

        // Body
        row([3,4,5,6,7,8,9], 9, c.marioRed);
        row([2,3,4,5,6,7,8,9,10], 10, c.marioRed);

        // Arms swing per frame
        if (frame === 0) {
            px(2, 11, c.marioSkin);
            row([3,4,5], 11, c.marioRed);
            row([6,7], 11, c.marioBlue);
            row([8,9,10], 11, c.marioRed);
            row([2,3,4,5], 12, c.marioRed);
            row([6,7], 12, c.marioBlue);
            row([8,9,10], 12, c.marioRed);
            px(11, 12, c.marioSkin);
        } else if (frame === 1) {
            row([3,4,5], 11, c.marioRed);
            row([6,7], 11, c.marioBlue);
            row([8,9], 11, c.marioRed);
            row([3,4,5], 12, c.marioRed);
            row([6,7], 12, c.marioBlue);
            row([8,9], 12, c.marioRed);
        } else {
            row([3,4,5], 11, c.marioRed);
            row([6,7], 11, c.marioBlue);
            row([8,9,10], 11, c.marioRed);
            px(11, 11, c.marioSkin);
            px(1, 12, c.marioSkin);
            row([2,3,4,5], 12, c.marioRed);
            row([6,7], 12, c.marioBlue);
            row([8,9,10], 12, c.marioRed);
        }

        // Belt region
        row([3,4], 13, c.marioBlue);
        row([5,6], 13, c.marioRed);
        row([7,8,9], 13, c.marioBlue);

        // Overalls
        row([3,4,5,6,7,8,9], 14, c.marioBlue);
        row([3,4,5,6,7,8,9], 15, c.marioBlue);
        px(4, 15, c.marioSkin);
        px(8, 15, c.marioSkin);
        row([3,4,5,6,7,8,9], 16, c.marioBlue);
        row([3,4,5,6,7,8,9], 17, c.marioBlue);
        row([3,4,5,6,7,8,9], 18, c.marioBlue);

        // Legs vary by frame
        if (frame === 0) {
            row([3,4,5,6,7,8,9], 19, c.marioBlue);
            row([2,3,4,5], 20, c.marioBlue);
            row([8,9], 20, c.marioBlue);
            row([1,2,3,4], 21, c.marioBlue);
            row([8,9,10], 21, c.marioBlue);
            row([1,2,3], 22, c.marioBrown);
            row([9,10,11], 22, c.marioBrown);
            row([0,1,2], 23, c.marioBrown);
            row([10,11], 23, c.marioBrown);
            row([0,1,2], 24, c.marioBrown);
        } else if (frame === 1) {
            row([4,5,6,7,8], 19, c.marioBlue);
            row([4,5], 20, c.marioBlue);
            row([7,8], 20, c.marioBlue);
            row([3,4,5], 21, c.marioBlue);
            row([7,8,9], 21, c.marioBlue);
            row([2,3,4,5], 22, c.marioBrown);
            row([7,8,9,10], 22, c.marioBrown);
            row([2,3,4,5], 23, c.marioBrown);
            row([7,8,9,10], 23, c.marioBrown);
            row([2,3,4,5], 24, c.marioBrown);
            row([7,8,9,10], 24, c.marioBrown);
        } else {
            row([3,4,5,6,7,8,9], 19, c.marioBlue);
            row([5,6], 20, c.marioBlue);
            row([8,9,10], 20, c.marioBlue);
            row([5,6,7], 21, c.marioBlue);
            row([9,10,11], 21, c.marioBlue);
            row([5,6,7], 22, c.marioBrown);
            row([10,11], 22, c.marioBrown);
            row([6,7,8], 23, c.marioBrown);
            row([10,11], 23, c.marioBrown);
            row([7,8,9], 24, c.marioBrown);
        }

        return canvas;
    },

    _drawMarioBigJump(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head
        row([4,5,6,7,8], 0, c.marioRed);
        row([3,4,5,6,7,8,9,10], 1, c.marioRed);
        row([3,4,5,6,7,8,9,10], 2, c.marioRed);
        row([3,4,5], 3, c.marioBrown);
        row([6,7,8,9], 3, c.marioSkin);
        row([2,3], 4, c.marioBrown);
        px(4, 4, c.marioSkin); px(5, 4, c.marioBrown);
        row([6,7,8], 4, c.marioSkin);
        px(9, 4, c.marioBrown); px(10, 4, c.marioSkin);
        row([2,3], 5, c.marioBrown);
        px(4, 5, c.marioSkin); px(5, 5, c.marioBrown);
        row([6,7,8,9,10], 5, c.marioSkin);
        row([4,5,6,7,8,9], 6, c.marioSkin);
        row([4,5,6,7,8,9], 7, c.marioSkin);
        row([5,6,7], 8, c.marioSkin);

        // Arm up on right
        px(10, 7, c.marioRed);
        px(11, 6, c.marioSkin);
        px(11, 7, c.marioRed);

        // Body
        row([3,4,5,6,7,8,9], 9, c.marioRed);
        row([2,3,4,5,6,7,8,9,10], 10, c.marioRed);

        // Left arm forward
        px(1, 10, c.marioSkin);
        px(1, 11, c.marioSkin);

        row([2,3,4,5], 11, c.marioRed);
        row([6,7], 11, c.marioBlue);
        row([8,9,10], 11, c.marioRed);
        row([2,3,4,5], 12, c.marioRed);
        row([6,7], 12, c.marioBlue);
        row([8,9], 12, c.marioRed);

        row([3,4], 13, c.marioBlue);
        row([5,6], 13, c.marioRed);
        row([7,8,9], 13, c.marioBlue);

        row([3,4,5,6,7,8,9], 14, c.marioBlue);
        row([3,4,5,6,7,8,9], 15, c.marioBlue);
        px(4, 15, c.marioSkin); px(8, 15, c.marioSkin);
        row([3,4,5,6,7,8,9], 16, c.marioBlue);
        row([3,4,5,6,7,8,9], 17, c.marioBlue);
        row([3,4,5,6,7,8,9], 18, c.marioBlue);

        // Legs: one forward, one back
        row([3,4,5], 19, c.marioBlue);
        row([8,9,10], 19, c.marioBlue);

        row([2,3,4], 20, c.marioBlue);
        row([9,10], 20, c.marioBlue);

        row([1,2,3], 21, c.marioBrown);
        row([9,10,11], 21, c.marioBrown);

        row([0,1,2], 22, c.marioBrown);
        row([10,11], 22, c.marioBrown);

        row([0,1], 23, c.marioBrown);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // NINJA TURTLE SPRITES
    // ═══════════════════════════════════════════════════════

    _createNinjaTurtle() {
        // ── Small (24x32) ──
        const SW = 24, SH = 32, P = 2;

        const sStand = this._drawNinjaSmallStanding(SW, SH, P);
        this.sprites.ninjaSmall.standRight = sStand;
        this.sprites.ninjaSmall.standLeft = this.mirrorSprite(sStand);

        for (let i = 0; i < 3; i++) {
            const walk = this._drawNinjaSmallWalk(SW, SH, P, i);
            this.sprites.ninjaSmall['walkRight' + i] = walk;
            this.sprites.ninjaSmall['walkLeft' + i] = this.mirrorSprite(walk);
        }

        const sJump = this._drawNinjaSmallJump(SW, SH, P);
        this.sprites.ninjaSmall.jumpRight = sJump;
        this.sprites.ninjaSmall.jumpLeft = this.mirrorSprite(sJump);

        // ── Big (24x56) ──
        const BW = 24, BH = 56;

        const bStand = this._drawNinjaBigStanding(BW, BH, P);
        this.sprites.ninjaBig.standRight = bStand;
        this.sprites.ninjaBig.standLeft = this.mirrorSprite(bStand);

        for (let i = 0; i < 3; i++) {
            const walk = this._drawNinjaBigWalk(BW, BH, P, i);
            this.sprites.ninjaBig['walkRight' + i] = walk;
            this.sprites.ninjaBig['walkLeft' + i] = this.mirrorSprite(walk);
        }

        const bJump = this._drawNinjaBigJump(BW, BH, P);
        this.sprites.ninjaBig.jumpRight = bJump;
        this.sprites.ninjaBig.jumpLeft = this.mirrorSprite(bJump);
    },

    _drawNinjaSmallStanding(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head top (green)
        row([4,5,6,7,8], 0, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 1, c.ninjaGreen);

        // Mask band (orange across eyes)
        row([3,4,5], 2, c.ninjaGreen);
        row([6,7,8,9], 2, c.ninjaMask);

        // Face with mask and eyes
        row([2,3], 3, c.ninjaMask);
        px(4, 3, c.white); px(5, 3, c.black);
        row([6,7], 3, c.ninjaMask);
        px(8, 3, c.white); px(9, 3, c.black);
        px(10, 3, c.ninjaMask);

        // Lower face (green)
        row([3,4,5,6,7,8,9], 4, c.ninjaGreen);
        row([4,5,6,7,8], 5, c.ninjaGreen);

        // Shell on back + belly
        row([3,4,5], 6, c.ninjaShell);
        row([6,7], 6, c.ninjaBelly);
        row([8,9], 6, c.ninjaShell);

        row([2,3,4], 7, c.ninjaShellDk);
        row([5,6,7], 7, c.ninjaBelly);
        row([8,9,10], 7, c.ninjaShell);

        // Belt
        row([3,4,5,6,7,8,9], 8, c.ninjaBrown);

        // Belly / shell body
        row([3,4], 9, c.ninjaShell);
        row([5,6,7], 9, c.ninjaBelly);
        row([8,9], 9, c.ninjaShell);

        row([3,4], 10, c.ninjaShell);
        row([5,6,7], 10, c.ninjaBelly);
        row([8,9], 10, c.ninjaShell);

        // Legs (green)
        row([3,4,5], 11, c.ninjaGreen);
        row([7,8,9], 11, c.ninjaGreen);

        // Feet (darker green)
        row([2,3,4,5], 12, c.ninjaDkGreen);
        row([7,8,9,10], 12, c.ninjaDkGreen);

        row([2,3,4,5], 13, c.ninjaDkGreen);
        row([7,8,9,10], 13, c.ninjaDkGreen);

        return canvas;
    },

    _drawNinjaSmallWalk(W, H, P, frame) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head (same for all frames)
        row([4,5,6,7,8], 0, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 1, c.ninjaGreen);
        row([3,4,5], 2, c.ninjaGreen);
        row([6,7,8,9], 2, c.ninjaMask);
        row([2,3], 3, c.ninjaMask);
        px(4, 3, c.white); px(5, 3, c.black);
        row([6,7], 3, c.ninjaMask);
        px(8, 3, c.white); px(9, 3, c.black);
        px(10, 3, c.ninjaMask);
        row([3,4,5,6,7,8,9], 4, c.ninjaGreen);
        row([4,5,6,7,8], 5, c.ninjaGreen);

        // Body (same for all frames)
        row([3,4,5], 6, c.ninjaShell);
        row([6,7], 6, c.ninjaBelly);
        row([8,9], 6, c.ninjaShell);
        row([2,3,4], 7, c.ninjaShellDk);
        row([5,6,7], 7, c.ninjaBelly);
        row([8,9,10], 7, c.ninjaShell);
        row([3,4,5,6,7,8,9], 8, c.ninjaBrown);
        row([3,4], 9, c.ninjaShell);
        row([5,6,7], 9, c.ninjaBelly);
        row([8,9], 9, c.ninjaShell);

        // Legs vary by frame
        if (frame === 0) {
            row([4,5,6,7,8,9], 10, c.ninjaGreen);
            row([3,4,5], 11, c.ninjaGreen);
            row([8,9], 11, c.ninjaGreen);
            row([2,3,4], 12, c.ninjaDkGreen);
            row([8,9,10], 12, c.ninjaDkGreen);
            row([1,2,3], 13, c.ninjaDkGreen);
            row([9,10,11], 13, c.ninjaDkGreen);
        } else if (frame === 1) {
            row([4,5,6,7,8], 10, c.ninjaGreen);
            row([4,5], 11, c.ninjaGreen);
            row([7,8], 11, c.ninjaGreen);
            row([3,4,5], 12, c.ninjaDkGreen);
            row([7,8,9], 12, c.ninjaDkGreen);
            row([3,4,5], 13, c.ninjaDkGreen);
            row([7,8,9], 13, c.ninjaDkGreen);
        } else {
            row([4,5,6,7,8,9], 10, c.ninjaGreen);
            row([5,6], 11, c.ninjaGreen);
            row([8,9], 11, c.ninjaGreen);
            row([5,6,7], 12, c.ninjaDkGreen);
            row([9,10], 12, c.ninjaDkGreen);
            row([5,6,7], 13, c.ninjaDkGreen);
            row([10,11], 13, c.ninjaDkGreen);
        }

        return canvas;
    },

    _drawNinjaSmallJump(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head
        row([4,5,6,7,8], 0, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 1, c.ninjaGreen);
        row([3,4,5], 2, c.ninjaGreen);
        row([6,7,8,9], 2, c.ninjaMask);
        row([2,3], 3, c.ninjaMask);
        px(4, 3, c.white); px(5, 3, c.black);
        row([6,7], 3, c.ninjaMask);
        px(8, 3, c.white); px(9, 3, c.black);
        px(10, 3, c.ninjaMask);
        row([3,4,5,6,7,8,9], 4, c.ninjaGreen);
        row([4,5,6,7,8], 5, c.ninjaGreen);

        // Arm up + body
        px(2, 5, c.ninjaGreen);
        px(10, 5, c.ninjaGreen);

        row([3,4,5], 6, c.ninjaShell);
        row([6,7], 6, c.ninjaBelly);
        row([8,9,10], 6, c.ninjaShell);

        row([3,4,5], 7, c.ninjaShellDk);
        row([6,7], 7, c.ninjaBelly);
        row([8,9], 7, c.ninjaShell);

        row([3,4,5,6,7,8,9], 8, c.ninjaBrown);
        row([3,4], 9, c.ninjaShell);
        row([5,6,7], 9, c.ninjaBelly);
        row([8,9], 9, c.ninjaShell);

        // Legs together / up
        row([4,5,6], 10, c.ninjaGreen);
        row([7,8], 10, c.ninjaGreen);

        row([3,4,5], 11, c.ninjaGreen);
        row([9,10], 11, c.ninjaDkGreen);

        row([2,3,4], 12, c.ninjaDkGreen);
        row([9,10], 12, c.ninjaDkGreen);

        row([2,3], 13, c.ninjaDkGreen);

        return canvas;
    },

    _drawNinjaBigStanding(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head top
        row([4,5,6,7,8], 0, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 1, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 2, c.ninjaGreen);

        // Forehead + mask top
        row([3,4,5], 3, c.ninjaGreen);
        row([6,7,8,9], 3, c.ninjaMask);

        // Eyes with mask
        row([2,3], 4, c.ninjaMask);
        px(4, 4, c.white); px(5, 4, c.black);
        row([6,7], 4, c.ninjaMask);
        px(8, 4, c.white); px(9, 4, c.black);
        px(10, 4, c.ninjaMask);

        // Lower face
        row([3,4,5,6,7,8,9], 5, c.ninjaGreen);
        row([4,5,6,7,8,9], 6, c.ninjaGreen);
        row([4,5,6,7,8,9], 7, c.ninjaGreen);

        // Neck
        row([5,6,7], 8, c.ninjaGreen);

        // Shell + belly upper
        row([3,4,5,6,7,8,9], 9, c.ninjaShell);
        row([2,3,4,5,6,7,8,9,10], 10, c.ninjaShell);
        row([5,6,7], 10, c.ninjaBelly);

        // Arms and body
        px(2, 11, c.ninjaGreen);
        row([3,4,5], 11, c.ninjaShell);
        row([6,7], 11, c.ninjaBelly);
        row([8,9], 11, c.ninjaShell);
        px(10, 11, c.ninjaGreen);

        px(1, 12, c.ninjaGreen);
        row([2,3,4], 12, c.ninjaShellDk);
        row([5,6,7], 12, c.ninjaBelly);
        row([8,9,10], 12, c.ninjaShell);
        px(11, 12, c.ninjaGreen);

        // Belt
        px(1, 13, c.ninjaGreen);
        row([2,3,4,5,6,7,8,9,10], 13, c.ninjaBrown);
        px(11, 13, c.ninjaGreen);

        // Shell / belly lower
        row([3,4], 14, c.ninjaShell);
        row([5,6,7], 14, c.ninjaBelly);
        row([8,9], 14, c.ninjaShell);
        row([3,4], 15, c.ninjaShell);
        row([5,6,7], 15, c.ninjaBelly);
        row([8,9], 15, c.ninjaShell);
        // Shell cross pattern
        px(4, 15, c.ninjaShellDk);
        px(8, 15, c.ninjaShellDk);
        row([3,4,5,6,7,8,9], 16, c.ninjaShell);
        row([5,6,7], 16, c.ninjaBelly);
        row([3,4,5,6,7,8,9], 17, c.ninjaShell);
        row([5,6,7], 17, c.ninjaBelly);
        row([3,4,5,6,7,8,9], 18, c.ninjaShell);
        row([5,6,7], 18, c.ninjaBellyDk);

        // Legs
        row([3,4,5], 19, c.ninjaGreen);
        row([7,8,9], 19, c.ninjaGreen);
        row([3,4,5], 20, c.ninjaGreen);
        row([7,8,9], 20, c.ninjaGreen);
        row([3,4,5], 21, c.ninjaGreen);
        row([7,8,9], 21, c.ninjaGreen);

        // Feet
        row([2,3,4,5], 22, c.ninjaDkGreen);
        row([7,8,9,10], 22, c.ninjaDkGreen);
        row([1,2,3,4,5], 23, c.ninjaDkGreen);
        row([7,8,9,10,11], 23, c.ninjaDkGreen);
        row([1,2,3,4,5], 24, c.ninjaDkGreen);
        row([7,8,9,10,11], 24, c.ninjaDkGreen);

        return canvas;
    },

    _drawNinjaBigWalk(W, H, P, frame) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head (same as standing)
        row([4,5,6,7,8], 0, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 1, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 2, c.ninjaGreen);
        row([3,4,5], 3, c.ninjaGreen);
        row([6,7,8,9], 3, c.ninjaMask);
        row([2,3], 4, c.ninjaMask);
        px(4, 4, c.white); px(5, 4, c.black);
        row([6,7], 4, c.ninjaMask);
        px(8, 4, c.white); px(9, 4, c.black);
        px(10, 4, c.ninjaMask);
        row([3,4,5,6,7,8,9], 5, c.ninjaGreen);
        row([4,5,6,7,8,9], 6, c.ninjaGreen);
        row([4,5,6,7,8,9], 7, c.ninjaGreen);
        row([5,6,7], 8, c.ninjaGreen);

        // Body
        row([3,4,5,6,7,8,9], 9, c.ninjaShell);
        row([2,3,4,5,6,7,8,9,10], 10, c.ninjaShell);
        row([5,6,7], 10, c.ninjaBelly);

        // Arms swing per frame
        if (frame === 0) {
            px(2, 11, c.ninjaGreen);
            row([3,4,5], 11, c.ninjaShell);
            row([6,7], 11, c.ninjaBelly);
            row([8,9,10], 11, c.ninjaShell);
            row([2,3,4], 12, c.ninjaShellDk);
            row([5,6,7], 12, c.ninjaBelly);
            row([8,9,10], 12, c.ninjaShell);
            px(11, 12, c.ninjaGreen);
        } else if (frame === 1) {
            row([3,4,5], 11, c.ninjaShell);
            row([6,7], 11, c.ninjaBelly);
            row([8,9], 11, c.ninjaShell);
            row([3,4,5], 12, c.ninjaShellDk);
            row([6,7], 12, c.ninjaBelly);
            row([8,9], 12, c.ninjaShell);
        } else {
            row([3,4,5], 11, c.ninjaShell);
            row([6,7], 11, c.ninjaBelly);
            row([8,9,10], 11, c.ninjaShell);
            px(11, 11, c.ninjaGreen);
            px(1, 12, c.ninjaGreen);
            row([2,3,4], 12, c.ninjaShellDk);
            row([5,6,7], 12, c.ninjaBelly);
            row([8,9,10], 12, c.ninjaShell);
        }

        // Belt
        row([3,4,5,6,7,8,9], 13, c.ninjaBrown);

        // Shell / belly
        row([3,4], 14, c.ninjaShell);
        row([5,6,7], 14, c.ninjaBelly);
        row([8,9], 14, c.ninjaShell);
        row([3,4], 15, c.ninjaShell);
        row([5,6,7], 15, c.ninjaBelly);
        row([8,9], 15, c.ninjaShell);
        px(4, 15, c.ninjaShellDk); px(8, 15, c.ninjaShellDk);
        row([3,4,5,6,7,8,9], 16, c.ninjaShell);
        row([5,6,7], 16, c.ninjaBelly);
        row([3,4,5,6,7,8,9], 17, c.ninjaShell);
        row([5,6,7], 17, c.ninjaBelly);
        row([3,4,5,6,7,8,9], 18, c.ninjaShell);
        row([5,6,7], 18, c.ninjaBellyDk);

        // Legs vary by frame
        if (frame === 0) {
            row([3,4,5,6,7,8,9], 19, c.ninjaGreen);
            row([2,3,4,5], 20, c.ninjaGreen);
            row([8,9], 20, c.ninjaGreen);
            row([1,2,3,4], 21, c.ninjaGreen);
            row([8,9,10], 21, c.ninjaGreen);
            row([1,2,3], 22, c.ninjaDkGreen);
            row([9,10,11], 22, c.ninjaDkGreen);
            row([0,1,2], 23, c.ninjaDkGreen);
            row([10,11], 23, c.ninjaDkGreen);
            row([0,1,2], 24, c.ninjaDkGreen);
        } else if (frame === 1) {
            row([4,5,6,7,8], 19, c.ninjaGreen);
            row([4,5], 20, c.ninjaGreen);
            row([7,8], 20, c.ninjaGreen);
            row([3,4,5], 21, c.ninjaGreen);
            row([7,8,9], 21, c.ninjaGreen);
            row([2,3,4,5], 22, c.ninjaDkGreen);
            row([7,8,9,10], 22, c.ninjaDkGreen);
            row([2,3,4,5], 23, c.ninjaDkGreen);
            row([7,8,9,10], 23, c.ninjaDkGreen);
            row([2,3,4,5], 24, c.ninjaDkGreen);
            row([7,8,9,10], 24, c.ninjaDkGreen);
        } else {
            row([3,4,5,6,7,8,9], 19, c.ninjaGreen);
            row([5,6], 20, c.ninjaGreen);
            row([8,9,10], 20, c.ninjaGreen);
            row([5,6,7], 21, c.ninjaGreen);
            row([9,10,11], 21, c.ninjaGreen);
            row([5,6,7], 22, c.ninjaDkGreen);
            row([10,11], 22, c.ninjaDkGreen);
            row([6,7,8], 23, c.ninjaDkGreen);
            row([10,11], 23, c.ninjaDkGreen);
            row([7,8,9], 24, c.ninjaDkGreen);
        }

        return canvas;
    },

    _drawNinjaBigJump(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head
        row([4,5,6,7,8], 0, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 1, c.ninjaGreen);
        row([3,4,5,6,7,8,9,10], 2, c.ninjaGreen);
        row([3,4,5], 3, c.ninjaGreen);
        row([6,7,8,9], 3, c.ninjaMask);
        row([2,3], 4, c.ninjaMask);
        px(4, 4, c.white); px(5, 4, c.black);
        row([6,7], 4, c.ninjaMask);
        px(8, 4, c.white); px(9, 4, c.black);
        px(10, 4, c.ninjaMask);
        row([3,4,5,6,7,8,9], 5, c.ninjaGreen);
        row([4,5,6,7,8,9], 6, c.ninjaGreen);
        row([4,5,6,7,8,9], 7, c.ninjaGreen);
        row([5,6,7], 8, c.ninjaGreen);

        // Arm up on right
        px(10, 7, c.ninjaGreen);
        px(11, 6, c.ninjaGreen);
        px(11, 7, c.ninjaGreen);

        // Body
        row([3,4,5,6,7,8,9], 9, c.ninjaShell);
        row([2,3,4,5,6,7,8,9,10], 10, c.ninjaShell);
        row([5,6,7], 10, c.ninjaBelly);

        // Left arm forward
        px(1, 10, c.ninjaGreen);
        px(1, 11, c.ninjaGreen);

        row([2,3,4,5], 11, c.ninjaShell);
        row([6,7], 11, c.ninjaBelly);
        row([8,9,10], 11, c.ninjaShell);
        row([2,3,4], 12, c.ninjaShellDk);
        row([5,6,7], 12, c.ninjaBelly);
        row([8,9], 12, c.ninjaShell);

        // Belt
        row([3,4,5,6,7,8,9], 13, c.ninjaBrown);

        // Shell / belly
        row([3,4], 14, c.ninjaShell);
        row([5,6,7], 14, c.ninjaBelly);
        row([8,9], 14, c.ninjaShell);
        row([3,4], 15, c.ninjaShell);
        row([5,6,7], 15, c.ninjaBelly);
        row([8,9], 15, c.ninjaShell);
        px(4, 15, c.ninjaShellDk); px(8, 15, c.ninjaShellDk);
        row([3,4,5,6,7,8,9], 16, c.ninjaShell);
        row([5,6,7], 16, c.ninjaBelly);
        row([3,4,5,6,7,8,9], 17, c.ninjaShell);
        row([5,6,7], 17, c.ninjaBelly);
        row([3,4,5,6,7,8,9], 18, c.ninjaShell);
        row([5,6,7], 18, c.ninjaBellyDk);

        // Legs: one forward, one back
        row([3,4,5], 19, c.ninjaGreen);
        row([8,9,10], 19, c.ninjaGreen);
        row([2,3,4], 20, c.ninjaGreen);
        row([9,10], 20, c.ninjaGreen);
        row([1,2,3], 21, c.ninjaDkGreen);
        row([9,10,11], 21, c.ninjaDkGreen);
        row([0,1,2], 22, c.ninjaDkGreen);
        row([10,11], 22, c.ninjaDkGreen);
        row([0,1], 23, c.ninjaDkGreen);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // PRINCESS SPRITES
    // ═══════════════════════════════════════════════════════

    _createPrincess() {
        // ── Small (24x32) ──
        const SW = 24, SH = 32, P = 2;

        const sStand = this._drawPrincessSmallStanding(SW, SH, P);
        this.sprites.princessSmall.standRight = sStand;
        this.sprites.princessSmall.standLeft = this.mirrorSprite(sStand);

        for (let i = 0; i < 3; i++) {
            const walk = this._drawPrincessSmallWalk(SW, SH, P, i);
            this.sprites.princessSmall['walkRight' + i] = walk;
            this.sprites.princessSmall['walkLeft' + i] = this.mirrorSprite(walk);
        }

        const sJump = this._drawPrincessSmallJump(SW, SH, P);
        this.sprites.princessSmall.jumpRight = sJump;
        this.sprites.princessSmall.jumpLeft = this.mirrorSprite(sJump);

        // ── Big (24x56) ──
        const BW = 24, BH = 56;

        const bStand = this._drawPrincessBigStanding(BW, BH, P);
        this.sprites.princessBig.standRight = bStand;
        this.sprites.princessBig.standLeft = this.mirrorSprite(bStand);

        for (let i = 0; i < 3; i++) {
            const walk = this._drawPrincessBigWalk(BW, BH, P, i);
            this.sprites.princessBig['walkRight' + i] = walk;
            this.sprites.princessBig['walkLeft' + i] = this.mirrorSprite(walk);
        }

        const bJump = this._drawPrincessBigJump(BW, BH, P);
        this.sprites.princessBig.jumpRight = bJump;
        this.sprites.princessBig.jumpLeft = this.mirrorSprite(bJump);
    },

    _drawPrincessSmallStanding(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Crown
        px(5, 0, c.princessCrown); px(7, 0, c.princessCrown); px(9, 0, c.princessCrown);
        row([5,6,7,8,9], 1, c.princessCrownDk);

        // Hair top
        row([4,5,6,7,8,9,10], 2, c.princessHair);

        // Face with hair sides
        px(3, 3, c.princessHair);
        row([4,5], 3, c.princessSkin);
        px(6, 3, c.princessEye);
        px(7, 3, c.princessSkin);
        px(8, 3, c.princessEye);
        row([9,10], 3, c.princessSkin);
        px(11, 3, c.princessHair);

        // Face lower
        px(3, 4, c.princessHair);
        row([4,5,6], 4, c.princessSkin);
        row([7,8], 4, c.princessPink); // rosy cheeks / mouth
        row([9,10], 4, c.princessSkin);
        px(11, 4, c.princessHair);

        // Chin + hair
        px(3, 5, c.princessHairDk);
        row([4,5,6,7,8,9], 5, c.princessSkin);
        px(10, 5, c.princessHairDk);

        // Dress top (pink)
        row([3,4,5,6,7,8,9,10], 6, c.princessPink);
        row([3,4,5,6,7,8,9,10], 7, c.princessPink);
        // Gem on chest
        px(6, 7, c.princessCrown);
        px(7, 7, c.princessCrown);

        // Dress mid
        row([3,4,5,6,7,8,9,10], 8, c.princessPink);
        row([2,3,4,5,6,7,8,9,10,11], 9, c.princessPinkDk);

        // Dress skirt (flared)
        row([2,3,4,5,6,7,8,9,10,11], 10, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 11, c.princessPink);
        // Hem highlight
        row([2,3,4,5,6,7,8,9,10,11], 12, c.princessPinkLt);

        // Shoes
        row([3,4,5], 13, c.princessPinkDk);
        row([8,9,10], 13, c.princessPinkDk);

        return canvas;
    },

    _drawPrincessSmallWalk(W, H, P, frame) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Crown
        px(5, 0, c.princessCrown); px(7, 0, c.princessCrown); px(9, 0, c.princessCrown);
        row([5,6,7,8,9], 1, c.princessCrownDk);

        // Hair
        row([4,5,6,7,8,9,10], 2, c.princessHair);

        // Face
        px(3, 3, c.princessHair);
        row([4,5], 3, c.princessSkin);
        px(6, 3, c.princessEye);
        px(7, 3, c.princessSkin);
        px(8, 3, c.princessEye);
        row([9,10], 3, c.princessSkin);
        px(11, 3, c.princessHair);

        px(3, 4, c.princessHair);
        row([4,5,6], 4, c.princessSkin);
        row([7,8], 4, c.princessPink);
        row([9,10], 4, c.princessSkin);
        px(11, 4, c.princessHair);

        px(3, 5, c.princessHairDk);
        row([4,5,6,7,8,9], 5, c.princessSkin);
        px(10, 5, c.princessHairDk);

        // Dress body (same for all frames)
        row([3,4,5,6,7,8,9,10], 6, c.princessPink);
        row([3,4,5,6,7,8,9,10], 7, c.princessPink);
        px(6, 7, c.princessCrown); px(7, 7, c.princessCrown);
        row([3,4,5,6,7,8,9,10], 8, c.princessPink);
        row([2,3,4,5,6,7,8,9,10,11], 9, c.princessPinkDk);

        // Skirt and feet vary by frame
        if (frame === 0) {
            row([2,3,4,5,6,7,8,9,10,11], 10, c.princessPink);
            row([1,2,3,4,5,6,7,8,9,10], 11, c.princessPink);
            row([1,2,3,4,5,6,7,8,9,10], 12, c.princessPinkLt);
            row([2,3,4], 13, c.princessPinkDk);
            row([9,10,11], 13, c.princessPinkDk);
        } else if (frame === 1) {
            row([2,3,4,5,6,7,8,9,10,11], 10, c.princessPink);
            row([2,3,4,5,6,7,8,9,10,11], 11, c.princessPink);
            row([2,3,4,5,6,7,8,9,10,11], 12, c.princessPinkLt);
            row([3,4,5], 13, c.princessPinkDk);
            row([8,9,10], 13, c.princessPinkDk);
        } else {
            row([3,4,5,6,7,8,9,10,11], 10, c.princessPink);
            row([3,4,5,6,7,8,9,10,11], 11, c.princessPink);
            row([3,4,5,6,7,8,9,10,11], 12, c.princessPinkLt);
            row([4,5,6], 13, c.princessPinkDk);
            row([8,9,10], 13, c.princessPinkDk);
        }

        return canvas;
    },

    _drawPrincessSmallJump(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Crown
        px(5, 0, c.princessCrown); px(7, 0, c.princessCrown); px(9, 0, c.princessCrown);
        row([5,6,7,8,9], 1, c.princessCrownDk);

        // Hair
        row([4,5,6,7,8,9,10], 2, c.princessHair);

        // Face
        px(3, 3, c.princessHair);
        row([4,5], 3, c.princessSkin);
        px(6, 3, c.princessEye);
        px(7, 3, c.princessSkin);
        px(8, 3, c.princessEye);
        row([9,10], 3, c.princessSkin);
        px(11, 3, c.princessHair);

        px(3, 4, c.princessHair);
        row([4,5,6], 4, c.princessSkin);
        row([7,8], 4, c.princessPink);
        row([9,10], 4, c.princessSkin);
        px(11, 4, c.princessHair);

        // Arms up
        px(2, 5, c.princessSkin);
        row([3,4,5,6,7,8,9], 5, c.princessSkin);
        px(10, 5, c.princessSkin);

        // Dress body
        row([3,4,5,6,7,8,9,10], 6, c.princessPink);
        row([3,4,5,6,7,8,9,10], 7, c.princessPink);
        px(6, 7, c.princessCrown); px(7, 7, c.princessCrown);
        row([3,4,5,6,7,8,9,10], 8, c.princessPink);
        row([2,3,4,5,6,7,8,9,10,11], 9, c.princessPinkDk);

        // Skirt (tucked up slightly)
        row([3,4,5,6,7,8,9,10], 10, c.princessPink);
        row([4,5,6,7,8,9], 11, c.princessPink);
        row([4,5,6,7,8,9], 12, c.princessPinkLt);

        // Feet together
        row([4,5], 13, c.princessPinkDk);
        row([8,9], 13, c.princessPinkDk);

        return canvas;
    },

    _drawPrincessBigStanding(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Crown
        px(5, 0, c.princessCrown); px(7, 0, c.princessCrown); px(9, 0, c.princessCrown);
        row([4,5,6,7,8,9,10], 1, c.princessCrownDk);
        row([4,5,6,7,8,9,10], 2, c.princessCrown);

        // Hair
        row([3,4,5,6,7,8,9,10], 3, c.princessHair);
        row([3,4,5,6,7,8,9,10,11], 4, c.princessHair);

        // Face
        px(2, 5, c.princessHair);
        row([3,4], 5, c.princessSkin);
        px(5, 5, c.princessEye);
        row([6,7], 5, c.princessSkin);
        px(8, 5, c.princessEye);
        row([9,10], 5, c.princessSkin);
        px(11, 5, c.princessHair);

        px(2, 6, c.princessHair);
        row([3,4,5], 6, c.princessSkin);
        row([6,7], 6, c.princessPink); // cheeks
        row([8,9,10], 6, c.princessSkin);
        px(11, 6, c.princessHair);

        // Chin + hair
        px(2, 7, c.princessHairDk);
        row([3,4,5,6,7,8,9,10], 7, c.princessSkin);
        px(11, 7, c.princessHairDk);

        // Neck
        row([5,6,7], 8, c.princessSkin);
        // Hair draping
        px(2, 8, c.princessHairDk);
        px(11, 8, c.princessHairDk);

        // Dress bodice
        row([3,4,5,6,7,8,9], 9, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 10, c.princessPink);

        // Arms + bodice
        px(1, 11, c.princessSkin);
        row([2,3,4,5,6,7,8,9,10], 11, c.princessPink);
        px(11, 11, c.princessSkin);

        px(1, 12, c.princessSkin);
        row([2,3,4,5,6,7,8,9,10], 12, c.princessPink);
        px(11, 12, c.princessSkin);

        // Gem on chest
        px(6, 11, c.princessCrown); px(7, 11, c.princessCrown);

        // Waist sash
        row([3,4,5,6,7,8,9], 13, c.princessPinkDk);

        // Dress body
        row([2,3,4,5,6,7,8,9,10], 14, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 15, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 16, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 17, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 18, c.princessPinkDk);

        // Dress flare
        row([0,1,2,3,4,5,6,7,8,9,10,11], 19, c.princessPink);
        row([0,1,2,3,4,5,6,7,8,9,10,11], 20, c.princessPink);
        row([0,1,2,3,4,5,6,7,8,9,10,11], 21, c.princessPink);

        // Hem
        row([0,1,2,3,4,5,6,7,8,9,10,11], 22, c.princessPinkLt);
        row([0,1,2,3,4,5,6,7,8,9,10,11], 23, c.princessPinkLt);

        // Shoes
        row([2,3,4,5], 24, c.princessPinkDk);
        row([7,8,9,10], 24, c.princessPinkDk);

        return canvas;
    },

    _drawPrincessBigWalk(W, H, P, frame) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head (same as standing big)
        px(5, 0, c.princessCrown); px(7, 0, c.princessCrown); px(9, 0, c.princessCrown);
        row([4,5,6,7,8,9,10], 1, c.princessCrownDk);
        row([4,5,6,7,8,9,10], 2, c.princessCrown);
        row([3,4,5,6,7,8,9,10], 3, c.princessHair);
        row([3,4,5,6,7,8,9,10,11], 4, c.princessHair);
        px(2, 5, c.princessHair);
        row([3,4], 5, c.princessSkin);
        px(5, 5, c.princessEye);
        row([6,7], 5, c.princessSkin);
        px(8, 5, c.princessEye);
        row([9,10], 5, c.princessSkin);
        px(11, 5, c.princessHair);
        px(2, 6, c.princessHair);
        row([3,4,5], 6, c.princessSkin);
        row([6,7], 6, c.princessPink);
        row([8,9,10], 6, c.princessSkin);
        px(11, 6, c.princessHair);
        px(2, 7, c.princessHairDk);
        row([3,4,5,6,7,8,9,10], 7, c.princessSkin);
        px(11, 7, c.princessHairDk);
        row([5,6,7], 8, c.princessSkin);
        px(2, 8, c.princessHairDk);
        px(11, 8, c.princessHairDk);

        // Bodice
        row([3,4,5,6,7,8,9], 9, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 10, c.princessPink);

        // Arms swing per frame
        if (frame === 0) {
            px(1, 11, c.princessSkin);
            row([2,3,4,5,6,7,8,9,10], 11, c.princessPink);
            row([2,3,4,5,6,7,8,9,10], 12, c.princessPink);
            px(11, 12, c.princessSkin);
        } else if (frame === 1) {
            row([3,4,5,6,7,8,9], 11, c.princessPink);
            row([3,4,5,6,7,8,9], 12, c.princessPink);
        } else {
            row([2,3,4,5,6,7,8,9,10], 11, c.princessPink);
            px(11, 11, c.princessSkin);
            px(1, 12, c.princessSkin);
            row([2,3,4,5,6,7,8,9,10], 12, c.princessPink);
        }

        // Gem
        px(6, 11, c.princessCrown); px(7, 11, c.princessCrown);

        // Sash
        row([3,4,5,6,7,8,9], 13, c.princessPinkDk);

        // Dress body
        row([2,3,4,5,6,7,8,9,10], 14, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 15, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 16, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 17, c.princessPink);
        row([1,2,3,4,5,6,7,8,9,10,11], 18, c.princessPinkDk);

        // Skirt sway by frame
        if (frame === 0) {
            row([0,1,2,3,4,5,6,7,8,9,10,11], 19, c.princessPink);
            row([0,1,2,3,4,5,6,7,8,9,10], 20, c.princessPink);
            row([0,1,2,3,4,5,6,7,8,9,10], 21, c.princessPink);
            row([0,1,2,3,4,5,6,7,8,9,10], 22, c.princessPinkLt);
            row([1,2,3], 23, c.princessPinkDk);
            row([9,10,11], 23, c.princessPinkDk);
            row([0,1,2], 24, c.princessPinkDk);
        } else if (frame === 1) {
            row([0,1,2,3,4,5,6,7,8,9,10,11], 19, c.princessPink);
            row([0,1,2,3,4,5,6,7,8,9,10,11], 20, c.princessPink);
            row([0,1,2,3,4,5,6,7,8,9,10,11], 21, c.princessPink);
            row([0,1,2,3,4,5,6,7,8,9,10,11], 22, c.princessPinkLt);
            row([2,3,4,5], 23, c.princessPinkDk);
            row([7,8,9,10], 23, c.princessPinkDk);
            row([2,3,4,5], 24, c.princessPinkDk);
            row([7,8,9,10], 24, c.princessPinkDk);
        } else {
            row([1,2,3,4,5,6,7,8,9,10,11], 19, c.princessPink);
            row([2,3,4,5,6,7,8,9,10,11], 20, c.princessPink);
            row([2,3,4,5,6,7,8,9,10,11], 21, c.princessPink);
            row([2,3,4,5,6,7,8,9,10,11], 22, c.princessPinkLt);
            row([3,4,5], 23, c.princessPinkDk);
            row([10,11], 23, c.princessPinkDk);
            row([7,8,9], 24, c.princessPinkDk);
        }

        return canvas;
    },

    _drawPrincessBigJump(W, H, P) {
        const canvas = this.createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head
        px(5, 0, c.princessCrown); px(7, 0, c.princessCrown); px(9, 0, c.princessCrown);
        row([4,5,6,7,8,9,10], 1, c.princessCrownDk);
        row([4,5,6,7,8,9,10], 2, c.princessCrown);
        row([3,4,5,6,7,8,9,10], 3, c.princessHair);
        row([3,4,5,6,7,8,9,10,11], 4, c.princessHair);
        px(2, 5, c.princessHair);
        row([3,4], 5, c.princessSkin);
        px(5, 5, c.princessEye);
        row([6,7], 5, c.princessSkin);
        px(8, 5, c.princessEye);
        row([9,10], 5, c.princessSkin);
        px(11, 5, c.princessHair);
        px(2, 6, c.princessHair);
        row([3,4,5], 6, c.princessSkin);
        row([6,7], 6, c.princessPink);
        row([8,9,10], 6, c.princessSkin);
        px(11, 6, c.princessHair);
        px(2, 7, c.princessHairDk);
        row([3,4,5,6,7,8,9,10], 7, c.princessSkin);
        px(11, 7, c.princessHairDk);
        row([5,6,7], 8, c.princessSkin);

        // Hair flowing up (jump)
        px(2, 3, c.princessHairDk);
        px(11, 3, c.princessHairDk);

        // Arm up on right
        px(10, 7, c.princessPink);
        px(11, 6, c.princessSkin);
        px(11, 7, c.princessPink);

        // Body
        row([3,4,5,6,7,8,9], 9, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 10, c.princessPink);

        // Left arm forward
        px(1, 10, c.princessSkin);
        px(1, 11, c.princessSkin);

        row([2,3,4,5,6,7,8,9,10], 11, c.princessPink);
        row([2,3,4,5,6,7,8,9], 12, c.princessPink);
        px(6, 11, c.princessCrown); px(7, 11, c.princessCrown);

        // Sash
        row([3,4,5,6,7,8,9], 13, c.princessPinkDk);

        // Dress body
        row([2,3,4,5,6,7,8,9,10], 14, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 15, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 16, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 17, c.princessPink);
        row([2,3,4,5,6,7,8,9,10], 18, c.princessPinkDk);

        // Dress (tucked up, legs showing)
        row([3,4,5,6,7,8,9], 19, c.princessPink);
        row([3,4,5,6,7,8,9], 20, c.princessPinkLt);

        // Legs
        row([3,4,5], 21, c.princessSkin);
        row([8,9,10], 21, c.princessSkin);

        // Shoes
        row([2,3,4], 22, c.princessPinkDk);
        row([9,10,11], 22, c.princessPinkDk);
        row([1,2,3], 23, c.princessPinkDk);
        row([10,11], 23, c.princessPinkDk);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // ATTACK / PROJECTILE SPRITES
    // ═══════════════════════════════════════════════════════

    _createAttacks() {
        // Fireball (12x12)
        this.sprites.attacks.fireball = this._drawFireball();

        // Shuriken (14x14) - 4 rotation frames
        this.sprites.attacks.shuriken = [];
        for (let i = 0; i < 4; i++) {
            this.sprites.attacks.shuriken.push(this._drawShuriken(i));
        }

        // Magic blast (20x20) - 3 animation frames
        this.sprites.attacks.magic = [];
        for (let i = 0; i < 3; i++) {
            this.sprites.attacks.magic.push(this._drawMagicBlast(i));
        }
    },

    _drawFireball() {
        const canvas = this.createCanvas(12, 12);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Core (bright yellow/orange circle)
        ctx.fillStyle = c.fireYellow;
        ctx.fillRect(3, 1, 6, 10);
        ctx.fillRect(1, 3, 10, 6);
        ctx.fillRect(2, 2, 8, 8);

        // Orange ring
        ctx.fillStyle = c.fireOrange;
        ctx.fillRect(3, 0, 6, 1);
        ctx.fillRect(3, 11, 6, 1);
        ctx.fillRect(0, 3, 1, 6);
        ctx.fillRect(11, 3, 1, 6);
        ctx.fillRect(1, 1, 2, 2);
        ctx.fillRect(9, 1, 2, 2);
        ctx.fillRect(1, 9, 2, 2);
        ctx.fillRect(9, 9, 2, 2);

        // Red flame tips
        ctx.fillStyle = c.fireRed;
        ctx.fillRect(5, 0, 2, 1);
        ctx.fillRect(0, 5, 1, 2);
        ctx.fillRect(11, 5, 1, 2);
        ctx.fillRect(5, 11, 2, 1);

        // Hot white center
        ctx.fillStyle = c.white;
        ctx.fillRect(4, 4, 4, 4);

        // Yellow inner glow
        ctx.fillStyle = c.fireYellow;
        ctx.fillRect(5, 3, 2, 1);
        ctx.fillRect(3, 5, 1, 2);
        ctx.fillRect(8, 5, 1, 2);
        ctx.fillRect(5, 8, 2, 1);

        return canvas;
    },

    _drawShuriken(frame) {
        const canvas = this.createCanvas(14, 14);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        ctx.clearRect(0, 0, 14, 14);

        if (frame === 0) {
            // Vertical + horizontal cross orientation
            ctx.fillStyle = c.shurikenGray;
            ctx.fillRect(6, 0, 2, 14);
            ctx.fillRect(0, 6, 14, 2);
            // Center hub
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(5, 5, 4, 4);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(6, 6, 2, 2);
            // Blade tips
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(6, 0, 2, 2);
            ctx.fillRect(6, 12, 2, 2);
            ctx.fillRect(0, 6, 2, 2);
            ctx.fillRect(12, 6, 2, 2);
            // Blade edges
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(5, 1, 1, 5);
            ctx.fillRect(8, 8, 1, 5);
            ctx.fillRect(1, 5, 5, 1);
            ctx.fillRect(8, 8, 5, 1);
        } else if (frame === 1) {
            // 45 degree rotation - X shape
            ctx.fillStyle = c.shurikenGray;
            for (let i = 0; i < 14; i++) {
                ctx.fillRect(i, i, 2, 2);
            }
            for (let i = 0; i < 14; i++) {
                ctx.fillRect(12-i, i, 2, 2);
            }
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(5, 5, 4, 4);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(6, 6, 2, 2);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(0, 0, 2, 2);
            ctx.fillRect(12, 0, 2, 2);
            ctx.fillRect(0, 12, 2, 2);
            ctx.fillRect(12, 12, 2, 2);
        } else if (frame === 2) {
            // Cross rotated slightly
            ctx.fillStyle = c.shurikenGray;
            ctx.fillRect(6, 0, 2, 14);
            ctx.fillRect(0, 6, 14, 2);
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(5, 5, 4, 4);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(6, 6, 2, 2);
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(8, 1, 1, 5);
            ctx.fillRect(5, 8, 1, 5);
            ctx.fillRect(8, 5, 5, 1);
            ctx.fillRect(1, 8, 5, 1);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(6, 0, 2, 2);
            ctx.fillRect(6, 12, 2, 2);
            ctx.fillRect(0, 6, 2, 2);
            ctx.fillRect(12, 6, 2, 2);
        } else {
            // 45 degree variant
            ctx.fillStyle = c.shurikenGray;
            for (let i = 0; i < 14; i++) {
                ctx.fillRect(i, i, 2, 2);
            }
            for (let i = 0; i < 14; i++) {
                ctx.fillRect(12-i, i, 2, 2);
            }
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(5, 5, 4, 4);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(6, 6, 2, 2);
            ctx.fillStyle = c.shurikenDark;
            ctx.fillRect(1, 1, 2, 1);
            ctx.fillRect(11, 11, 2, 1);
            ctx.fillStyle = c.shurikenLight;
            ctx.fillRect(12, 0, 2, 2);
            ctx.fillRect(0, 12, 2, 2);
        }

        return canvas;
    },

    _drawMagicBlast(frame) {
        const canvas = this.createCanvas(20, 20);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        if (frame === 0) {
            // Compact sparkle
            ctx.fillStyle = c.magicLight;
            ctx.fillRect(8, 8, 4, 4);
            ctx.fillStyle = c.magicPink;
            ctx.fillRect(9, 4, 2, 4);
            ctx.fillRect(9, 12, 2, 4);
            ctx.fillRect(4, 9, 4, 2);
            ctx.fillRect(12, 9, 4, 2);
            ctx.fillStyle = c.magicPurple;
            ctx.fillRect(5, 5, 2, 2);
            ctx.fillRect(13, 5, 2, 2);
            ctx.fillRect(5, 13, 2, 2);
            ctx.fillRect(13, 13, 2, 2);
            ctx.fillStyle = c.princessWhite;
            ctx.fillRect(9, 9, 2, 2);
            ctx.fillRect(3, 3, 1, 1);
            ctx.fillRect(16, 3, 1, 1);
            ctx.fillRect(3, 16, 1, 1);
            ctx.fillRect(16, 16, 1, 1);
        } else if (frame === 1) {
            // Medium expanded sparkle
            ctx.fillStyle = c.magicLight;
            ctx.fillRect(7, 7, 6, 6);
            ctx.fillStyle = c.princessWhite;
            ctx.fillRect(8, 8, 4, 4);
            ctx.fillStyle = c.magicPink;
            ctx.fillRect(9, 2, 2, 5);
            ctx.fillRect(9, 13, 2, 5);
            ctx.fillRect(2, 9, 5, 2);
            ctx.fillRect(13, 9, 5, 2);
            ctx.fillStyle = c.magicPurple;
            ctx.fillRect(4, 4, 2, 2);
            ctx.fillRect(14, 4, 2, 2);
            ctx.fillRect(4, 14, 2, 2);
            ctx.fillRect(14, 14, 2, 2);
            ctx.fillStyle = c.magicPink;
            ctx.fillRect(1, 1, 1, 1);
            ctx.fillRect(18, 1, 1, 1);
            ctx.fillRect(1, 18, 1, 1);
            ctx.fillRect(18, 18, 1, 1);
            ctx.fillRect(9, 0, 2, 1);
            ctx.fillRect(9, 19, 2, 1);
            ctx.fillRect(0, 9, 1, 2);
            ctx.fillRect(19, 9, 1, 2);
        } else {
            // Large burst sparkle
            ctx.fillStyle = c.magicPurple;
            ctx.fillRect(6, 6, 8, 8);
            ctx.fillStyle = c.magicLight;
            ctx.fillRect(7, 7, 6, 6);
            ctx.fillStyle = c.princessWhite;
            ctx.fillRect(8, 8, 4, 4);
            ctx.fillStyle = c.magicPink;
            ctx.fillRect(9, 0, 2, 7);
            ctx.fillRect(9, 13, 2, 7);
            ctx.fillRect(0, 9, 7, 2);
            ctx.fillRect(13, 9, 7, 2);
            ctx.fillStyle = c.magicPurple;
            ctx.fillRect(3, 3, 3, 3);
            ctx.fillRect(14, 3, 3, 3);
            ctx.fillRect(3, 14, 3, 3);
            ctx.fillRect(14, 14, 3, 3);
            ctx.fillStyle = c.princessWhite;
            ctx.fillRect(2, 2, 1, 1);
            ctx.fillRect(17, 2, 1, 1);
            ctx.fillRect(2, 17, 1, 1);
            ctx.fillRect(17, 17, 1, 1);
            ctx.fillRect(0, 9, 1, 1);
            ctx.fillRect(19, 9, 1, 1);
            ctx.fillRect(9, 0, 1, 1);
            ctx.fillRect(9, 19, 1, 1);
        }

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // TILE SPRITES (32x32)
    // ═══════════════════════════════════════════════════════

    _createTileSprites() {
        this.sprites.tiles.ground = this._drawGroundTile();
        this.sprites.tiles.brick = this._drawBrickTile();
        this.sprites.tiles.question = this._drawQuestionTile();
        this.sprites.tiles.questionUsed = this._drawQuestionUsedTile();
        this.sprites.tiles.hardBlock = this._drawHardBlockTile();
        this.sprites.tiles.pipeTopLeft = this._drawPipePart('topLeft');
        this.sprites.tiles.pipeTopRight = this._drawPipePart('topRight');
        this.sprites.tiles.pipeBodyLeft = this._drawPipePart('bodyLeft');
        this.sprites.tiles.pipeBodyRight = this._drawPipePart('bodyRight');
    },

    _drawGroundTile() {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Base fill
        ctx.fillStyle = c.brick;
        ctx.fillRect(0, 0, 32, 32);

        // Darker brick pattern
        ctx.fillStyle = c.brickDark;
        // Horizontal mortar lines
        ctx.fillRect(0, 7, 32, 1);
        ctx.fillRect(0, 15, 32, 1);
        ctx.fillRect(0, 23, 32, 1);
        ctx.fillRect(0, 31, 32, 1);

        // Vertical mortar lines offset per row
        ctx.fillRect(7, 0, 1, 8);
        ctx.fillRect(23, 0, 1, 8);
        ctx.fillRect(15, 8, 1, 8);
        ctx.fillRect(7, 16, 1, 8);
        ctx.fillRect(23, 16, 1, 8);
        ctx.fillRect(15, 24, 1, 8);

        // Subtle top highlight
        ctx.fillStyle = c.brickMortar;
        ctx.fillRect(0, 0, 32, 1);

        return canvas;
    },

    _drawBrickTile() {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Base fill
        ctx.fillStyle = c.brick;
        ctx.fillRect(0, 0, 32, 32);

        // Mortar lines (lighter)
        ctx.fillStyle = c.brickMortar;
        // Horizontal
        ctx.fillRect(0, 0, 32, 1);
        ctx.fillRect(0, 8, 32, 1);
        ctx.fillRect(0, 16, 32, 1);
        ctx.fillRect(0, 24, 32, 1);

        // Vertical - staggered
        ctx.fillRect(0, 0, 1, 9);
        ctx.fillRect(15, 0, 1, 9);
        ctx.fillRect(8, 8, 1, 9);
        ctx.fillRect(24, 8, 1, 9);
        ctx.fillRect(0, 16, 1, 9);
        ctx.fillRect(15, 16, 1, 9);
        ctx.fillRect(8, 24, 1, 9);
        ctx.fillRect(24, 24, 1, 9);

        // Dark edge on bottom and right of each brick
        ctx.fillStyle = c.brickDark;
        // Row 1 bricks
        ctx.fillRect(1, 7, 14, 1);
        ctx.fillRect(14, 1, 1, 7);
        ctx.fillRect(16, 7, 15, 1);
        ctx.fillRect(31, 1, 1, 7);
        // Row 2 bricks
        ctx.fillRect(1, 15, 7, 1);
        ctx.fillRect(7, 9, 1, 7);
        ctx.fillRect(9, 15, 14, 1);
        ctx.fillRect(23, 9, 1, 7);
        ctx.fillRect(25, 15, 6, 1);
        ctx.fillRect(31, 9, 1, 7);
        // Row 3
        ctx.fillRect(1, 23, 14, 1);
        ctx.fillRect(14, 17, 1, 7);
        ctx.fillRect(16, 23, 15, 1);
        ctx.fillRect(31, 17, 1, 7);
        // Row 4
        ctx.fillRect(1, 31, 7, 1);
        ctx.fillRect(7, 25, 1, 7);
        ctx.fillRect(9, 31, 14, 1);
        ctx.fillRect(23, 25, 1, 7);
        ctx.fillRect(25, 31, 6, 1);
        ctx.fillRect(31, 25, 1, 7);

        return canvas;
    },

    _drawQuestionTile() {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // 3D bevel - light edges top/left
        ctx.fillStyle = c.questionLight;
        ctx.fillRect(0, 0, 32, 2);
        ctx.fillRect(0, 0, 2, 32);

        // Dark edges bottom/right
        ctx.fillStyle = c.questionDark;
        ctx.fillRect(0, 30, 32, 2);
        ctx.fillRect(30, 0, 2, 32);

        // Main body
        ctx.fillStyle = c.questionBlock;
        ctx.fillRect(2, 2, 28, 28);

        // Draw "?" mark
        ctx.fillStyle = c.brickDark;
        // Top of question mark
        ctx.fillRect(11, 7, 10, 3);
        ctx.fillRect(18, 10, 3, 4);
        ctx.fillRect(14, 13, 7, 3);
        ctx.fillRect(14, 16, 4, 3);
        // Dot
        ctx.fillRect(14, 21, 4, 3);

        // Inner highlight on "?"
        ctx.fillStyle = c.questionLight;
        ctx.fillRect(12, 8, 8, 1);
        ctx.fillRect(15, 14, 5, 1);
        ctx.fillRect(15, 22, 2, 1);

        // Corner darkening
        ctx.fillStyle = c.questionDark;
        ctx.fillRect(0, 0, 2, 2);
        ctx.fillRect(30, 0, 2, 2);
        ctx.fillRect(0, 30, 2, 2);
        ctx.fillRect(30, 30, 2, 2);

        return canvas;
    },

    _drawQuestionUsedTile() {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Darker used block
        ctx.fillStyle = c.emptyBlockDk;
        ctx.fillRect(0, 0, 32, 2);
        ctx.fillRect(0, 0, 2, 32);

        ctx.fillStyle = c.emptyBlock;
        ctx.fillRect(2, 2, 28, 28);

        ctx.fillStyle = c.emptyBlockDk;
        ctx.fillRect(0, 30, 32, 2);
        ctx.fillRect(30, 0, 2, 32);

        // Subtle inner rectangle
        ctx.fillStyle = c.emptyBlockDk;
        ctx.fillRect(4, 4, 24, 1);
        ctx.fillRect(4, 4, 1, 24);
        ctx.fillRect(4, 27, 24, 1);
        ctx.fillRect(27, 4, 1, 24);

        return canvas;
    },

    _drawHardBlockTile() {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Base
        ctx.fillStyle = c.hardBlock;
        ctx.fillRect(0, 0, 32, 32);

        // Light bevel
        ctx.fillStyle = c.hardBlockLt;
        ctx.fillRect(0, 0, 32, 2);
        ctx.fillRect(0, 0, 2, 32);

        // Dark bevel
        ctx.fillStyle = c.hardBlockDk;
        ctx.fillRect(0, 30, 32, 2);
        ctx.fillRect(30, 0, 2, 32);

        // Inner stone lines
        ctx.fillStyle = c.hardBlockDk;
        ctx.fillRect(4, 10, 24, 1);
        ctx.fillRect(4, 20, 24, 1);
        ctx.fillRect(10, 4, 1, 24);
        ctx.fillRect(20, 4, 1, 24);

        // Inner highlights
        ctx.fillStyle = c.hardBlockLt;
        ctx.fillRect(4, 11, 24, 1);
        ctx.fillRect(4, 21, 24, 1);
        ctx.fillRect(11, 4, 1, 24);
        ctx.fillRect(21, 4, 1, 24);

        return canvas;
    },

    _drawPipePart(part) {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        if (part === 'topLeft') {
            // Rim
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(0, 0, 32, 8);
            // Lighter rim top
            ctx.fillStyle = c.pipeGreenLight;
            ctx.fillRect(0, 0, 32, 2);
            ctx.fillRect(0, 0, 2, 8);
            // Main pipe body
            ctx.fillStyle = c.pipeGreen;
            ctx.fillRect(4, 8, 28, 24);
            // Highlight stripe
            ctx.fillStyle = c.pipeGreenLight;
            ctx.fillRect(6, 8, 4, 24);
            // Dark left edge
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(4, 8, 2, 24);
            // Rim face
            ctx.fillStyle = c.pipeGreen;
            ctx.fillRect(2, 2, 28, 4);
            // Rim highlight
            ctx.fillStyle = c.pipeGreenLight;
            ctx.fillRect(4, 2, 4, 4);
        } else if (part === 'topRight') {
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(0, 0, 32, 8);
            ctx.fillStyle = c.pipeGreenLight;
            ctx.fillRect(0, 0, 32, 2);
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(30, 0, 2, 8);
            ctx.fillStyle = c.pipeGreen;
            ctx.fillRect(0, 8, 28, 24);
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(26, 8, 2, 24);
            ctx.fillStyle = c.pipeGreen;
            ctx.fillRect(2, 2, 28, 4);
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(28, 2, 2, 4);
        } else if (part === 'bodyLeft') {
            ctx.fillStyle = c.pipeGreen;
            ctx.fillRect(4, 0, 28, 32);
            ctx.fillStyle = c.pipeGreenLight;
            ctx.fillRect(6, 0, 4, 32);
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(4, 0, 2, 32);
        } else if (part === 'bodyRight') {
            ctx.fillStyle = c.pipeGreen;
            ctx.fillRect(0, 0, 28, 32);
            ctx.fillStyle = c.pipeGreenDark;
            ctx.fillRect(26, 0, 2, 32);
        }

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // ENEMY SPRITES
    // ═══════════════════════════════════════════════════════

    _createEnemySprites() {
        for (let i = 0; i < 2; i++) {
            this.sprites.enemies['goombaWalk' + i] = this._drawGoomba(i);
        }
        this.sprites.enemies.goombaFlat = this._drawGoombaFlat();

        for (let i = 0; i < 2; i++) {
            const k = this._drawKoopa(i);
            this.sprites.enemies['koopaWalkRight' + i] = k;
            this.sprites.enemies['koopaWalkLeft' + i] = this.mirrorSprite(k);
        }
        this.sprites.enemies.shell = this._drawKoopaShell();
    },

    _drawGoomba(frame) {
        const canvas = this.createCanvas(28, 28);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const P = 2; // pixel size
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Mushroom cap
        row([5,6,7,8], 0, c.goombaBrown);
        row([4,5,6,7,8,9], 1, c.goombaBrown);
        row([3,4,5,6,7,8,9,10], 2, c.goombaBrown);
        row([2,3,4,5,6,7,8,9,10,11], 3, c.goombaBrown);
        row([1,2,3,4,5,6,7,8,9,10,11,12], 4, c.goombaBrown);
        row([1,2,3,4,5,6,7,8,9,10,11,12], 5, c.goombaBrown);

        // Cap highlight
        px(5, 1, c.goombaDark);
        px(8, 1, c.goombaDark);

        // Face area
        row([2,3,4,5,6,7,8,9,10,11], 6, c.marioSkin);
        row([2,3,4,5,6,7,8,9,10,11], 7, c.marioSkin);

        // Eyes (angry - dark with white)
        px(4, 6, c.white);
        px(5, 6, c.black);
        px(4, 7, c.black);
        px(5, 7, c.white);

        px(8, 6, c.white);
        px(9, 6, c.black);
        px(8, 7, c.black);
        px(9, 7, c.white);

        // Mouth area
        row([3,4,5,6,7,8,9,10], 8, c.marioSkin);
        px(6, 8, c.goombaDark);
        px(7, 8, c.goombaDark);

        // Body
        row([4,5,6,7,8,9], 9, c.goombaBrown);
        row([4,5,6,7,8,9], 10, c.goombaBrown);

        // Feet
        if (frame === 0) {
            row([2,3,4,5], 11, c.goombaDark);
            row([8,9,10,11], 11, c.goombaDark);
            row([1,2,3,4], 12, c.goombaDark);
            row([9,10,11,12], 12, c.goombaDark);
        } else {
            row([3,4,5,6], 11, c.goombaDark);
            row([7,8,9,10], 11, c.goombaDark);
            row([3,4,5], 12, c.goombaDark);
            row([8,9,10], 12, c.goombaDark);
        }

        return canvas;
    },

    _drawGoombaFlat() {
        const canvas = this.createCanvas(28, 28);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Squished goomba - flat version
        ctx.fillStyle = c.goombaBrown;
        ctx.fillRect(2, 20, 24, 4);
        ctx.fillStyle = c.goombaDark;
        ctx.fillRect(2, 24, 24, 2);
        // Eyes
        ctx.fillStyle = c.white;
        ctx.fillRect(8, 20, 3, 2);
        ctx.fillRect(17, 20, 3, 2);
        ctx.fillStyle = c.black;
        ctx.fillRect(9, 20, 2, 2);
        ctx.fillRect(18, 20, 2, 2);

        return canvas;
    },

    _drawKoopa(frame) {
        const canvas = this.createCanvas(28, 38);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const P = 2;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Head
        row([6,7,8], 0, c.koopaGreen);
        row([5,6,7,8,9], 1, c.koopaGreen);
        row([5,6,7,8,9], 2, c.koopaGreen);

        // Eyes
        px(7, 1, c.white);
        px(8, 1, c.white);
        px(8, 2, c.black);

        // Neck
        row([6,7], 3, c.koopaYellow);

        // Shell
        row([4,5,6,7,8,9], 4, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 5, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 6, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 7, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 8, c.koopaGreen);
        row([4,5,6,7,8,9], 9, c.koopaGreen);

        // Shell details
        px(5, 5, c.koopaGreenDk);
        px(6, 6, c.koopaGreenDk);
        px(7, 7, c.koopaGreenDk);
        px(8, 5, c.koopaGreenDk);
        px(7, 5, c.koopaGreenDk);
        // Shell highlight
        px(4, 5, c.pipeGreenLight);
        px(4, 6, c.pipeGreenLight);

        // Belly
        row([5,6,7,8], 10, c.koopaYellow);

        // Body / belly
        row([5,6,7,8], 11, c.koopaYellow);

        // Legs
        if (frame === 0) {
            row([4,5], 12, c.koopaYellow);
            row([8,9], 12, c.koopaYellow);
            row([3,4], 13, c.koopaYellow);
            row([9,10], 13, c.koopaYellow);

            // Shoes
            row([2,3,4], 14, c.koopaGreen);
            row([9,10,11], 14, c.koopaGreen);
        } else {
            row([5,6], 12, c.koopaYellow);
            row([7,8], 12, c.koopaYellow);
            row([5,6], 13, c.koopaYellow);
            row([7,8], 13, c.koopaYellow);
            row([4,5,6], 14, c.koopaGreen);
            row([7,8,9], 14, c.koopaGreen);
        }

        // Arms
        px(3, 6, c.koopaYellow);
        px(10, 6, c.koopaYellow);

        return canvas;
    },

    _drawKoopaShell() {
        const canvas = this.createCanvas(28, 28);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const P = 2;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Shell oval shape
        row([5,6,7,8], 2, c.koopaGreen);
        row([4,5,6,7,8,9], 3, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 4, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 5, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 6, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 7, c.koopaGreen);
        row([3,4,5,6,7,8,9,10], 8, c.koopaGreen);
        row([4,5,6,7,8,9], 9, c.koopaGreen);
        row([5,6,7,8], 10, c.koopaGreen);

        // Bottom yellow
        row([4,5,6,7,8,9], 10, c.koopaYellow);
        row([5,6,7,8], 11, c.koopaYellow);

        // Shell pattern
        px(5, 4, c.koopaGreenDk);
        px(8, 4, c.koopaGreenDk);
        px(6, 5, c.koopaGreenDk);
        px(7, 5, c.koopaGreenDk);
        px(5, 6, c.koopaGreenDk);
        px(8, 6, c.koopaGreenDk);
        px(6, 7, c.koopaGreenDk);
        px(7, 7, c.koopaGreenDk);

        // Highlight
        px(4, 4, c.pipeGreenLight);
        px(3, 5, c.pipeGreenLight);
        px(3, 6, c.pipeGreenLight);
        px(4, 7, c.pipeGreenLight);

        // Dark right edge
        px(9, 4, c.koopaGreenDk);
        px(10, 5, c.koopaGreenDk);
        px(10, 6, c.koopaGreenDk);
        px(10, 7, c.koopaGreenDk);
        px(9, 8, c.koopaGreenDk);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // ITEM SPRITES
    // ═══════════════════════════════════════════════════════

    _createItemSprites() {
        this.sprites.items.mushroom = this._drawMushroom();
        this.sprites.items.fireFlower = this._drawFireFlower();
        for (let i = 0; i < 4; i++) {
            this.sprites.items['coin' + i] = this._drawCoin(i);
        }
    },

    _drawMushroom() {
        const canvas = this.createCanvas(28, 28);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const P = 2;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Cap
        row([4,5,6,7,8,9], 0, c.mushroomRed);
        row([3,4,5,6,7,8,9,10], 1, c.mushroomRed);
        row([2,3,4,5,6,7,8,9,10,11], 2, c.mushroomRed);
        row([1,2,3,4,5,6,7,8,9,10,11,12], 3, c.mushroomRed);
        row([1,2,3,4,5,6,7,8,9,10,11,12], 4, c.mushroomRed);
        row([1,2,3,4,5,6,7,8,9,10,11,12], 5, c.mushroomRed);
        row([2,3,4,5,6,7,8,9,10,11], 6, c.mushroomRed);

        // White spots on cap
        row([5,6], 1, c.mushroomWhite);
        row([8,9], 1, c.mushroomWhite);
        row([4,5,6], 2, c.mushroomWhite);
        row([8,9,10], 2, c.mushroomWhite);
        row([5,6], 3, c.mushroomWhite);
        row([8,9], 3, c.mushroomWhite);

        // Central white area at bottom of cap
        row([3,4,5,6,7,8,9,10], 5, c.mushroomWhite);
        row([4,5,6,7,8,9], 6, c.mushroomWhite);

        // Eyes on face area
        row([4,5,6,7,8,9], 7, c.mushroomTan);
        row([3,4,5,6,7,8,9,10], 8, c.mushroomTan);
        // Eyes
        px(5, 7, c.black);
        px(8, 7, c.black);
        px(5, 8, c.black);
        px(8, 8, c.black);

        // Stem
        row([4,5,6,7,8,9], 9, c.mushroomTan);
        row([4,5,6,7,8,9], 10, c.mushroomTan);
        row([5,6,7,8], 11, c.mushroomTan);
        row([5,6,7,8], 12, c.mushroomTan);

        // Stem shadow
        px(4, 9, c.marioSkinDark);
        px(9, 9, c.marioSkinDark);
        px(4, 10, c.marioSkinDark);
        px(9, 10, c.marioSkinDark);

        return canvas;
    },

    _drawCoin(rotationFrame) {
        const canvas = this.createCanvas(16, 28);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Coin rotation: 0=full, 1=3/4, 2=half, 3=3/4 other side
        const widths = [12, 8, 4, 8];
        const w = widths[rotationFrame];
        const offset = (16 - w) / 2;

        // Coin body
        ctx.fillStyle = c.coinGold;
        ctx.beginPath();
        ctx.ellipse(8, 14, w / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring
        ctx.fillStyle = c.coinLight;
        ctx.beginPath();
        ctx.ellipse(8, 14, Math.max(w / 2 - 2, 1), 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Center
        ctx.fillStyle = c.coinGold;
        ctx.beginPath();
        ctx.ellipse(8, 14, Math.max(w / 2 - 3, 1), 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shine highlight
        if (rotationFrame === 0 || rotationFrame === 1) {
            ctx.fillStyle = c.white;
            ctx.fillRect(offset + 2, 6, 2, 2);
        }

        return canvas;
    },

    _drawFireFlower() {
        const canvas = this.createCanvas(28, 28);
        const ctx = canvas.getContext('2d');
        const c = this.colors;
        const P = 2;
        const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*P, y*P, P, P); };
        const row = (xs, y, col) => { for (const x of xs) px(x, y, col); };

        // Top petal
        row([6,7], 0, c.fireRed);
        row([5,6,7,8], 1, c.fireRed);

        // Side petals + center
        row([2,3], 2, c.fireRed);
        row([5,6,7,8], 2, c.fireOrange);
        row([10,11], 2, c.fireRed);

        row([1,2,3], 3, c.fireRed);
        row([5,6,7,8], 3, c.fireYellow);
        row([10,11,12], 3, c.fireRed);

        row([2,3], 4, c.fireRed);
        row([5,6,7,8], 4, c.fireOrange);
        row([10,11], 4, c.fireRed);

        // Bottom petal
        row([5,6,7,8], 5, c.fireRed);
        row([6,7], 6, c.fireRed);

        // Stem
        row([6,7], 7, c.pipeGreen);
        row([6,7], 8, c.pipeGreen);
        row([6,7], 9, c.pipeGreen);

        // Leaves
        row([4,5], 8, c.pipeGreen);
        row([8,9], 9, c.pipeGreen);

        // Stem continues
        row([6,7], 10, c.pipeGreen);
        row([6,7], 11, c.pipeGreen);
        row([6,7], 12, c.pipeGreen);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // FLAG SPRITES
    // ═══════════════════════════════════════════════════════

    _createFlagSprites() {
        this.sprites.flag.pole = this._drawFlagpole();
        this.sprites.flag.flag = this._drawFlag();
    },

    _drawFlagpole() {
        const canvas = this.createCanvas(8, 320);
        const ctx = canvas.getContext('2d');

        // Ball on top
        ctx.fillStyle = this.colors.grayLight;
        ctx.beginPath();
        ctx.arc(4, 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pole
        ctx.fillStyle = this.colors.gray;
        ctx.fillRect(3, 8, 3, 312);

        // Highlight
        ctx.fillStyle = this.colors.grayLight;
        ctx.fillRect(3, 8, 1, 312);

        return canvas;
    },

    _drawFlag() {
        const canvas = this.createCanvas(32, 32);
        const ctx = canvas.getContext('2d');
        const c = this.colors;

        // Green flag triangle
        ctx.fillStyle = c.flagGreen;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(28, 14);
        ctx.lineTo(0, 28);
        ctx.closePath();
        ctx.fill();

        // Darker border
        ctx.strokeStyle = c.pipeGreenDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(28, 14);
        ctx.lineTo(0, 28);
        ctx.closePath();
        ctx.stroke();

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // BACKGROUND SPRITES
    // ═══════════════════════════════════════════════════════

    _createBackgroundSprites() {
        this.sprites.background.cloudSmall = this._drawCloud(64, 32);
        this.sprites.background.cloudMedium = this._drawCloud(96, 40);
        this.sprites.background.cloudLarge = this._drawCloud(128, 48);

        this.sprites.background.hillSmall = this._drawHill(128, 64);
        this.sprites.background.hillLarge = this._drawHill(224, 96);

        this.sprites.background.bush1 = this._drawBush(64, 32);
        this.sprites.background.bush2 = this._drawBush(96, 32);
        this.sprites.background.bush3 = this._drawBush(128, 36);
    },

    _drawCloud(w, h) {
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = this.colors.cloudWhite;

        // Build cloud from overlapping circles
        const cx = w / 2;
        const cy = h * 0.6;
        const r = h * 0.35;

        // Bottom row of circles
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - r * 0.9, cy, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.9, cy, r * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Top bumps
        ctx.beginPath();
        ctx.arc(cx - r * 0.4, cy - r * 0.6, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.4, cy - r * 0.6, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Subtle outline
        ctx.strokeStyle = this.colors.cloudGray;
        ctx.lineWidth = 1;
        // Re-draw the circles as strokes for subtle outline
        ctx.beginPath();
        ctx.arc(cx - r * 0.9, cy, r * 0.8, Math.PI * 0.5, Math.PI * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + r * 0.9, cy, r * 0.8, Math.PI * 1.8, Math.PI * 0.5);
        ctx.stroke();

        return canvas;
    },

    _drawHill(w, h) {
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');

        // Rounded hill shape
        ctx.fillStyle = this.colors.hillGreen;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.quadraticCurveTo(w * 0.25, h * 0.1, w / 2, 0);
        ctx.quadraticCurveTo(w * 0.75, h * 0.1, w, h);
        ctx.closePath();
        ctx.fill();

        // Lighter highlight stripe
        ctx.fillStyle = this.colors.bushGreenLt;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h);
        ctx.quadraticCurveTo(w * 0.3, h * 0.2, w / 2, h * 0.08);
        ctx.quadraticCurveTo(w * 0.55, h * 0.15, w * 0.5, h * 0.3);
        ctx.quadraticCurveTo(w * 0.4, h * 0.5, w * 0.15, h);
        ctx.closePath();
        ctx.fill();

        // Darker edge on right
        ctx.fillStyle = this.colors.hillGreenDk;
        ctx.beginPath();
        ctx.moveTo(w * 0.65, h * 0.3);
        ctx.quadraticCurveTo(w * 0.8, h * 0.3, w, h);
        ctx.lineTo(w * 0.85, h);
        ctx.quadraticCurveTo(w * 0.75, h * 0.4, w * 0.65, h * 0.3);
        ctx.closePath();
        ctx.fill();

        return canvas;
    },

    _drawBush(w, h) {
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');

        const cx = w / 2;
        const r = h * 0.45;

        // Main body
        ctx.fillStyle = this.colors.bushGreen;
        ctx.beginPath();
        ctx.arc(cx, h - r, r, 0, Math.PI * 2);
        ctx.fill();

        // Side bumps
        if (w > 70) {
            ctx.beginPath();
            ctx.arc(cx - r * 0.9, h - r * 0.8, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + r * 0.9, h - r * 0.8, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        if (w > 100) {
            ctx.beginPath();
            ctx.arc(cx - r * 1.6, h - r * 0.6, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + r * 1.6, h - r * 0.6, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight bumps
        ctx.fillStyle = this.colors.bushGreenLt;
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, h - r * 1.1, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        if (w > 70) {
            ctx.beginPath();
            ctx.arc(cx + r * 0.5, h - r * 0.9, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        // Flatten bottom
        ctx.fillStyle = this.colors.bushGreen;
        ctx.fillRect(0, h - 2, w, 4);

        return canvas;
    },

    // ═══════════════════════════════════════════════════════
    // DRAWING METHODS (called during game rendering)
    // ═══════════════════════════════════════════════════════

    /**
     * Draw the player sprite based on current state.
     */
    drawPlayer(ctx, player) {
        if (!player) return;

        // Invincibility blinking
        if (player.invincible && player.invincibleTimer !== undefined) {
            if (Math.floor(player.invincibleTimer / 4) % 2 === 0) return;
        }

        const big = (player.state === 'big' || player.state === 'fire');
        const character = player.character || 'mario';
        let spriteSet;
        if (character === 'ninja') {
            spriteSet = big ? this.sprites.ninjaBig : this.sprites.ninjaSmall;
        } else if (character === 'princess') {
            spriteSet = big ? this.sprites.princessBig : this.sprites.princessSmall;
        } else {
            spriteSet = big ? this.sprites.marioBig : this.sprites.marioSmall;
        }
        const dir = player.facing === 'left' ? 'Left' : 'Right';

        let sprite;

        if (player._dying) {
            const dyingSet = character === 'ninja' ? this.sprites.ninjaSmall
                           : character === 'princess' ? this.sprites.princessSmall
                           : this.sprites.marioSmall;
            sprite = dyingSet.jumpRight;
        } else if (!player.grounded) {
            sprite = spriteSet['jump' + dir];
        } else if (Math.abs(player.vx) > 0.5) {
            const frameIndex = (player.animFrame || 0) % 3;
            sprite = spriteSet['walk' + dir + frameIndex];
        } else {
            sprite = spriteSet['stand' + dir];
        }

        if (!sprite) {
            sprite = spriteSet['standRight'];
        }

        if (sprite) {
            ctx.drawImage(sprite, Math.round(player.x), Math.round(player.y), sprite.width, sprite.height);
        }
    },

    /**
     * Draw a projectile sprite based on type.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} projectile - must have .type ('fireball'/'shuriken'/'magic'), .x, .y
     *   and optionally .animFrame for animated projectiles.
     */
    drawProjectile(ctx, projectile) {
        if (!projectile || !projectile.type) return;

        let sprite;
        const type = projectile.type;

        if (type === 'fireball') {
            sprite = this.sprites.attacks.fireball;
        } else if (type === 'shuriken') {
            const frames = this.sprites.attacks.shuriken;
            if (frames && frames.length) {
                const frameIndex = (projectile.animFrame || Math.floor(Date.now() / 80)) % frames.length;
                sprite = frames[frameIndex];
            }
        } else if (type === 'magic') {
            const frames = this.sprites.attacks.magic;
            if (frames && frames.length) {
                const frameIndex = (projectile.animFrame || Math.floor(Date.now() / 120)) % frames.length;
                sprite = frames[frameIndex];
            }
        }

        if (sprite) {
            ctx.drawImage(sprite, Math.round(projectile.x), Math.round(projectile.y), sprite.width, sprite.height);
        }
    },

    /**
     * Draw a tile at the given position.
     */
    drawTile(ctx, tileType, x, y) {
        // Map numeric tile types to sprite names
        const numToName = {
            1: 'ground',
            2: 'brick',
            3: 'question',
            4: 'hardBlock',
            5: 'pipeTopLeft',
            6: 'pipeTopRight',
            7: 'pipeBodyLeft',
            8: 'pipeBodyRight',
            9: 'flagpole'
        };

        const spriteName = typeof tileType === 'number' ? numToName[tileType] : tileType;
        if (!spriteName) return;

        let sprite = this.sprites.tiles[spriteName];

        // Fallback for flagpole - draw directly
        if (tileType === 9 && !sprite) {
            ctx.fillStyle = '#888';
            ctx.fillRect(Math.round(x) + 14, Math.round(y), 4, 32);
            ctx.fillStyle = '#AAA';
            ctx.fillRect(Math.round(x) + 15, Math.round(y), 2, 32);
            return;
        }

        if (sprite) {
            ctx.drawImage(sprite, Math.round(x), Math.round(y));
        }
    },

    /**
     * Draw an enemy sprite with animation.
     */
    drawEnemy(ctx, enemy, screenX, screenY) {
        if (!enemy || !enemy.type) return;

        const frameIndex = Math.floor(Date.now() / 200) % 2;
        let sprite;

        if (enemy.type === 'goomba') {
            if (!enemy.alive) {
                sprite = this.sprites.enemies.goombaFlat;
            } else {
                sprite = this.sprites.enemies['goombaWalk' + frameIndex];
            }
        } else if (enemy.type === 'koopa') {
            if (enemy.isShell) {
                sprite = this.sprites.enemies.shell;
            } else {
                const dir = enemy.direction >= 0 ? 'Right' : 'Left';
                sprite = this.sprites.enemies['koopaWalk' + dir + frameIndex];
            }
        }

        if (sprite) {
            const dx = screenX !== undefined ? Math.round(screenX) : Math.round(enemy.x);
            const dy = screenY !== undefined ? Math.round(screenY) : Math.round(enemy.y);
            ctx.drawImage(sprite, dx, dy, sprite.width, sprite.height);
        }
    },

    /**
     * Draw an item sprite.
     */
    drawItem(ctx, item, screenX, screenY) {
        if (!item || !item.type) return;

        let sprite;

        if (item.type === 'mushroom') {
            sprite = this.sprites.items.mushroom;
        } else if (item.type === 'coin') {
            const frame = Math.floor(Date.now() / 150) % 4;
            sprite = this.sprites.items['coin' + frame];
        } else if (item.type === 'fireflower' || item.type === 'fireFlower' || item.type === 'flower') {
            sprite = this.sprites.items.fireFlower;
        }

        if (sprite) {
            const dx = screenX !== undefined ? Math.round(screenX) : Math.round(item.x);
            const dy = screenY !== undefined ? Math.round(screenY) : Math.round(item.y);
            ctx.drawImage(sprite, dx, dy, sprite.width, sprite.height);
        }
    },

    drawCoin(ctx, x, y, w, h) {
        const frame = Math.floor(Date.now() / 150) % 4;
        const sprite = this.sprites.items['coin' + frame];
        if (sprite) {
            ctx.drawImage(sprite, Math.round(x), Math.round(y));
        }
    },

    /**
     * Draw scrolling background with parallax.
     */
    drawBackground(ctx, cameraX, levelWidth) {
        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        // Sky
        ctx.fillStyle = this.colors.sky;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Ground line reference (bottom 2 tiles)
        const groundY = canvasH - 64;

        // Hills (slow parallax - 0.3x)
        const hillParallax = 0.3;
        const hillOffset = cameraX * hillParallax;
        const hillSpacing = 500;

        const hillLarge = this.sprites.background.hillLarge;
        const hillSmall = this.sprites.background.hillSmall;

        // Determine visible range
        const startHillIndex = Math.floor((hillOffset - canvasW) / hillSpacing);
        const endHillIndex = Math.ceil((hillOffset + canvasW * 2) / hillSpacing);

        for (let i = startHillIndex; i <= endHillIndex; i++) {
            const baseX = i * hillSpacing - hillOffset;
            if (i % 2 === 0 && hillLarge) {
                ctx.drawImage(hillLarge, baseX, groundY - hillLarge.height + 10);
            } else if (hillSmall) {
                ctx.drawImage(hillSmall, baseX + 200, groundY - hillSmall.height + 8);
            }
        }

        // Clouds (very slow parallax - 0.15x)
        const cloudParallax = 0.15;
        const cloudOffset = cameraX * cloudParallax;
        const cloudSpacing = 400;

        const clouds = [
            this.sprites.background.cloudSmall,
            this.sprites.background.cloudMedium,
            this.sprites.background.cloudLarge,
        ];

        const cloudYPositions = [40, 70, 30, 90, 55];
        const startCloudIdx = Math.floor((cloudOffset - canvasW) / cloudSpacing);
        const endCloudIdx = Math.ceil((cloudOffset + canvasW * 2) / cloudSpacing);

        for (let i = startCloudIdx; i <= endCloudIdx; i++) {
            const cloud = clouds[((i % 3) + 3) % 3];
            const yPos = cloudYPositions[((i % 5) + 5) % 5];
            const baseX = i * cloudSpacing - cloudOffset + ((i * 137) % 150);
            if (cloud) {
                ctx.drawImage(cloud, baseX, yPos);
            }
        }

        // Bushes (same speed as ground - 1x but placed decoratively)
        const bushParallax = 0.5;
        const bushOffset = cameraX * bushParallax;
        const bushSpacing = 350;

        const bushes = [
            this.sprites.background.bush1,
            this.sprites.background.bush2,
            this.sprites.background.bush3,
        ];

        const startBushIdx = Math.floor((bushOffset - canvasW) / bushSpacing);
        const endBushIdx = Math.ceil((bushOffset + canvasW * 2) / bushSpacing);

        for (let i = startBushIdx; i <= endBushIdx; i++) {
            const bush = bushes[((i % 3) + 3) % 3];
            const baseX = i * bushSpacing - bushOffset + ((i * 97) % 120);
            if (bush) {
                ctx.drawImage(bush, baseX, groundY - bush.height + 4);
            }
        }
    },

    /**
     * Draw the flagpole and flag at end of level.
     */
    drawFlag(ctx, x, y) {
        const pole = this.sprites.flag.pole;
        const flag = this.sprites.flag.flag;

        if (pole) {
            ctx.drawImage(pole, Math.round(x) - 1, Math.round(y));
        }
        if (flag) {
            ctx.drawImage(flag, Math.round(x) + 4, Math.round(y) + 16);
        }
    },

    /**
     * Get sprite dimensions for collision or positioning purposes.
     */
    getSpriteSize(type) {
        switch (type) {
            case 'marioSmall':    return { width: 24, height: 32 };
            case 'marioBig':      return { width: 24, height: 56 };
            case 'ninjaSmall':    return { width: 24, height: 32 };
            case 'ninjaBig':      return { width: 24, height: 56 };
            case 'princessSmall': return { width: 24, height: 32 };
            case 'princessBig':   return { width: 24, height: 56 };
            case 'fireball':      return { width: 12, height: 12 };
            case 'shuriken':      return { width: 14, height: 14 };
            case 'magic':         return { width: 20, height: 20 };
            case 'goomba':        return { width: 28, height: 28 };
            case 'koopa':         return { width: 28, height: 38 };
            case 'shell':         return { width: 28, height: 28 };
            case 'mushroom':      return { width: 28, height: 28 };
            case 'coin':          return { width: 16, height: 28 };
            case 'fireFlower':    return { width: 28, height: 28 };
            case 'tile':          return { width: 32, height: 32 };
            default:              return { width: 32, height: 32 };
        }
    }
};

// Make available globally
window.SpriteRenderer = SpriteRenderer;
