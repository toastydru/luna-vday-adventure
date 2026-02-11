// ============================================
// SIAMESE CAT PLATFORM GAME
// A simple 2D platformer with envelope collection mechanic
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================
// GAME PHASE MANAGEMENT
// Controls which screen is displayed
// ============================================
let gamePhase = 'title';  // 'title', 'playing', 'letter', 'letterYes'
let titleFrameCount = 0;  // Animation counter for title screen

// ============================================
// ENDING SEQUENCE VARIABLES
// Letter popup and Luna blocking animation
// ============================================
let lunaNoBlocker = {
    active: false,
    x: 0,
    y: 0,
    targetY: 0,
    arrived: false
};

let confettiPieces = [];
let letterFrameCount = 0;  // Animation counter for letter popup

// Mouse tracking for button interactions
let mouseX = 0;
let mouseY = 0;

// ============================================
// GAME STATE
// Tracks collectibles and room access
// ============================================
const gameState = {
    hasEnvelope: false,      // Whether player has collected the envelope
    hasSushi: false,         // Whether player has collected the sushi
    hasTennisBall: false,    // Whether player has collected the tennis ball
    leftRoomUnlocked: false, // Whether left room is accessible
    gateOpen: false,         // Whether the staircase gate is open
    valentineDelivered: false, // Whether player completed the letter delivery
    inLeftBed: false,        // Whether Luna is in the left cat bed (hole)
    onCloudBed: false,       // Whether Luna is sleeping on the cloud bed
    doorThoughtBubbleDismissed: false,  // Whether door thought bubble has been dismissed
    boySneeze: false,        // Whether boy is sneezing (Luna touching him)
    sneezeTimer: 0           // Timer for sneeze animation
};

// Function to reset game state for new game
function resetGameState() {
    gameState.hasEnvelope = false;
    gameState.hasSushi = false;
    gameState.hasTennisBall = false;
    gameState.leftRoomUnlocked = false;
    gameState.gateOpen = false;
    gameState.valentineDelivered = false;
    gameState.inLeftBed = false;
    gameState.onCloudBed = false;
    gameState.doorThoughtBubbleDismissed = false;
    gameState.boySneeze = false;
    gameState.sneezeTimer = 0;
    zzzParticles = [];
    player.x = 620;
    player.y = 480;
    player.velocityX = 0;
    player.velocityY = 0;
    player.facingRight = true;
    envelope.collected = false;
    sushi.collected = false;
    tennisBall.collected = false;
    // Reset ending sequence state
    lunaNoBlocker = {
        active: false,
        x: 0,
        y: canvas.height,
        targetY: 0,
        arrived: false
    };
    confettiPieces = [];
    letterFrameCount = 0;
}

// ============================================
// ANIMATION TIMER
// Used for floating/bobbing animations
// ============================================
let animationTime = 0;

// ============================================
// PLAYER DEFINITION
// Luna the Siamese cat with detailed anatomy
// ============================================
const player = {
    x: 620,              // Starting x position (between staircase and tennis ball)
    y: 480,              // Starting y position (on first floor)
    width: 30,           // Player width (collision box)
    height: 40,          // Player height (collision box)
    velocityX: 0,        // Horizontal velocity
    velocityY: 0,        // Vertical velocity
    speed: 5,            // Movement speed
    climbSpeed: 3,       // Climbing speed on stairs
    jumpForce: -11,      // Jump strength (enough to reach cloud bed)
    isOnGround: false,   // Whether player is standing on something
    isClimbing: false,   // Whether player is on the stairs
    facingRight: true,   // Direction Luna is facing
    // Pixel-art Siamese cat colors
    bodyColor: '#e8d5b0',     // Warm cream body
    pointColor: '#3d2008',    // Deep dark brown Siamese points
    eyeColor: '#a8d8f0',      // Light icy blue eyes
    pupilColor: '#1a1a1a',    // Dark pupils
    noseColor: '#e89090',     // Pink nose
    innerEarColor: '#f0b0b0', // Pink inner ear
    whiskerColor: '#f0f0e0'   // Near-white whiskers
};

// Walk animation frame counter
let walkFrame = 0;

// ============================================
// PHYSICS CONSTANTS
// Gravity and friction values
// ============================================
const physics = {
    gravity: 0.5,        // Downward acceleration
    friction: 0.8        // Horizontal slowdown when not moving
};

// ============================================
// INPUT HANDLING
// Track which keys are currently pressed
// ============================================
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};

document.addEventListener('keydown', (e) => {
    // Handle title screen transition
    if (gamePhase === 'title') {
        gamePhase = 'playing';
        resetGameState();
        e.preventDefault();
        return;
    }

    // Handle exiting left cat bed (any key exits)
    if (gameState.inLeftBed) {
        exitLeftBed();
        e.preventDefault();
        return;
    }

    // Handle waking from cloud bed (any key wakes)
    if (gameState.onCloudBed) {
        wakeFromCloudBed();
        e.preventDefault();
        return;
    }

    // Normal gameplay key handling
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'Space') {
        keys.space = true;
        e.preventDefault(); // Prevent page scroll
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'Space') keys.space = false;
});

// ============================================
// MOUSE EVENT LISTENERS
// For letter popup button interactions
// ============================================
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    handleLetterClick(clickX, clickY);
});

// ============================================
// WOODEN HOUSE COLOR PALETTE
// Warm, natural wood tones with light beige walls
// ============================================
const colors = {
    // Background & walls
    background: '#f5ede0',     // Warm light beige background
    wallMain: '#f0e6d3',       // Main wall color
    wallTexture: '#e8dcc8',    // Subtle wall texture lines
    baseboard: '#d4c4a8',      // Baseboard darker warm tone
    // Window colors
    windowFrame: '#c4a882',    // Window frame wood color
    windowPane: '#b8d4e8',     // Light sky blue window pane
    windowHighlight: '#ffffff', // White highlight reflection
    windowSill: '#c4a882',     // Window sill (same as frame)
    // Room walls
    wallLight: '#f0e6d8',      // Light warm beige for exterior walls
    wallInterior: '#f5ede3',   // Very light beige for interior walls
    // Floor & wood
    floorWood: '#b8936f',      // Warm light brown for floors
    floorWoodGrain: '#9a7a58', // Darker grain lines for wood texture
    floorWoodPlank: '#a8855f', // Plank separation lines
    stairWood: '#b08860',      // Lighter warm wood for stairs
    stairWoodGrain: '#907050', // Stair grain lines
    railingWood: '#6b5030',    // Darker for railings (contrast)
    doorWood: '#c49a70',       // Light warm door color
    doorWoodDark: '#a07850',   // Door panel darker shade
    doorWoodGrain: '#b08860',  // Door grain lines
    bedFrame: '#8b6540',       // Bed frame wood
    blanketBlue: '#5b7fa3',    // Boy's blue blanket
    blanketPink: '#c48a9a',    // Girl's pink blanket
    desk: '#a8855f',           // Desk wood (lighter)
    chair: '#8b7050',          // Chair wood
    monitor: '#2a2a3a',        // Monitor color
    monitorScreen: '#4a6a8a',  // Monitor screen glow
    skinTone: '#e8c4a0',       // Character skin
    boyHair: '#4a3a2a',        // Boy's brown hair
    girlHair: '#3a2a1a',       // Girl's dark hair
    boyShirt: '#5a7a9a',       // Boy's blue shirt
    girlShirt: '#9a5a7a'       // Girl's pink shirt
};

// ============================================
// PLATFORMS AND ENVIRONMENT
// Define all solid surfaces in the game
// REMOVED RAMP-BASED STAIRS AND BLOCKING OBJECTS
// ============================================
const platforms = [
    // First floor - ground platform (wood tone)
    { x: 0, y: 520, width: 800, height: 80, color: colors.floorWood },

    // Second floor platform (same wood tone)
    { x: 0, y: 280, width: 800, height: 20, color: colors.floorWood }
];

// ============================================
// TWO-WAY STAIR CLIMBING ENABLED
// Centered staircase that Luna can climb up/down from either floor
//
// How it works:
// 1. stairZone defines the climbable area - extends ABOVE second floor
//    so Luna can step onto it from the second floor and descend
// 2. When Luna overlaps stairZone and presses UP/DOWN:
//    - Gravity is disabled (isClimbing = true)
//    - Horizontal movement is locked
//    - Luna moves vertically based on UP/DOWN keys
// 3. Luna exits climb mode when:
//    - Reaching the top (lands on second floor)
//    - Reaching the bottom (lands on first floor)
//    - Moving horizontally out of the stair zone
// ============================================
const stairZone = {
    x: 350,              // Centered on screen (800/2 - 50)
    y: 240,              // Top of zone - ABOVE second floor so Luna can enter from top
    width: 100,          // Width of climbable area
    height: 280,         // Extended height to include area above second floor
    bottomY: 520,        // First floor level
    topY: 280            // Second floor platform level
};

// ============================================
// STAIRCASE MESH GATE
// Blocks Luna from reaching second floor until she has sushi AND tennis ball
// ============================================
const gate = {
    x: 350,              // Same as stairZone.x
    y: 230,              // Just above second floor platform
    width: 100,          // Same as stairZone width
    height: 50,          // Slightly taller than Luna
    frameThickness: 4,   // Dark iron frame thickness
    frameColor: '#4a4a4a',
    meshColor: '#5a5a5a',
    lockColor: '#8a7a5a'
};

// ============================================
// ROOMS ON SECOND FLOOR
// Left room (locked until envelope collected) and right room (contains envelope)
// ============================================
const rooms = {
    // Left room - Girl's room (starts locked)
    left: {
        x: 0,
        y: 100,
        width: 200,
        height: 180,
        floorY: 280,
        wallColor: colors.wallLight,
        interiorColor: colors.wallInterior,
        // Doorway at right edge of room
        doorwayX: 200,
        doorwayY: 180,
        doorwayWidth: 5,
        doorwayHeight: 100
    },
    // Right room - Boy's room (contains the envelope)
    right: {
        x: 600,
        y: 100,
        width: 200,
        height: 180,
        floorY: 280,
        wallColor: colors.wallLight,
        interiorColor: colors.wallInterior,
        // Doorway at left edge of room
        doorwayX: 595,
        doorwayY: 180,
        doorwayWidth: 5,
        doorwayHeight: 100
    }
};

// ============================================
// BOY CHARACTER CONTACT ZONE
// For sneeze interaction when Luna touches the boy
// ============================================
const boyContactZone = {
    x: 720,        // Left edge of boy area (chairX + 10 area)
    y: 230,        // Top of boy area (above chair seat)
    width: 50,     // Width of contact zone
    height: 50     // Height of contact zone
};

// ============================================
// DOOR ROTATES AROUND FIXED HINGE EDGE LIKE A REAL DOOR
//
// CLOSED = thin edge only (side profile view)
// OPEN = full door rotating around vertical hinge edge
//
// In a side-view 2D game:
// - When door is CLOSED (angle=0): we see only the thin edge of the door
//   (imagine looking at a door from the side - you just see a thin line)
// - When door OPENS: it rotates around the hinge, revealing more of the face
//
// LEFT ROOM DOOR:
// - Hinge along LEFT vertical edge (x = 200) - this edge stays FIXED
// - When closed: thin vertical line at x=200
// - When opening: door face becomes visible, swinging into left room
//
// RIGHT ROOM DOOR:
// - Hinge along RIGHT vertical edge (x = 600) - this edge stays FIXED
// - When closed: thin vertical line at x=600
// - When opening: door face becomes visible, swinging into right room
// ============================================
const doors = {
    // Left room door - hinge on LEFT edge (FIXED), swings into left room
    left: {
        hingeX: 200,              // LEFT edge = FIXED hinge line
        hingeY: 230,              // Vertical CENTER of hinge (doorway top 180 + height/2)
        thickness: 4,             // Thickness of door edge when closed
        width: 30,                // Full door width when open
        height: 100,              // Door height
        angle: 0,                 // Current rotation angle (radians)
        targetAngle: 0,           // Target angle for animation
        maxAngle: -Math.PI / 2.5, // ~72 degrees (negative = swing into left room)
        animSpeed: 0.1            // Animation smoothness
    },
    // Right room door - hinge on RIGHT edge (FIXED), swings into right room
    right: {
        hingeX: 600,              // RIGHT edge = FIXED hinge line
        hingeY: 230,              // Vertical CENTER of hinge (doorway top 180 + height/2)
        thickness: 4,             // Thickness of door edge when closed
        width: 30,                // Full door width when open
        height: 100,              // Door height
        angle: 0,                 // Current rotation angle (radians)
        targetAngle: 0,           // Target angle for animation
        maxAngle: Math.PI / 2.5,  // ~72 degrees (positive = swing into right room)
        animSpeed: 0.1            // Animation smoothness
    }
};

// Door trigger zones - when player overlaps, door opens
const doorTriggers = {
    left: {
        x: 180,
        y: 200,
        width: 50,
        height: 80
    },
    right: {
        x: 570,
        y: 200,
        width: 50,
        height: 80
    }
};

// Invisible wall blocking left room entrance (removed when unlocked)
const leftRoomBlocker = {
    x: 195,
    y: 180,
    width: 10,
    height: 100
};

// ============================================
// ROOM WALL COLLISION SEGMENTS
// Walls above doorways that complete room enclosure
// ============================================

// Wall segment above left room doorway (from ceiling to doorway top)
const wallAboveLeftDoor = {
    x: 195,        // Right edge of left room
    y: 100,        // Room ceiling
    width: 10,     // Wall thickness
    height: 80     // From y=100 (ceiling) to y=180 (doorway top)
};

// Wall segment above right room doorway (from ceiling to doorway top)
const wallAboveRightDoor = {
    x: 595,        // Left edge of right room
    y: 100,        // Room ceiling
    width: 10,     // Wall thickness
    height: 80     // From y=100 (ceiling) to y=180 (doorway top)
};

// Room ceiling collision objects (prevent jumping through ceiling)
const roomCeilings = [
    { x: 0, y: 95, width: 205, height: 10 },      // Left room ceiling
    { x: 595, y: 95, width: 205, height: 10 }     // Right room ceiling
];

// ============================================
// COLLECTIBLE ITEMS
// ============================================

// Envelope - Located in the right room on second floor (on the bed)
const envelope = {
    // Position directly above boy's head (head center at x=742, head top at y=226)
    x: 725,       // Centered: 742 - 35/2 ≈ 725
    y: 186,       // 18px above head top: 226 - 22 - 18 = 186
    width: 35,
    height: 22,
    scale: 0.75,  // 75% size
    collected: false,
    color: '#f5e6d3',
    stripeColor: '#d4534a',
    slot: 3  // Inventory slot number
};

// Shrimp Nigiri Sushi - Left side of first floor
const sushi = {
    x: 50,
    y: 500,
    width: 20,
    height: 15,
    collected: false,
    riceColor: '#f5f5dc',
    shrimpColor: '#ff9a8b',
    shrimpAccent: '#ff6b5a',
    noriColor: '#2a2a2a',
    slot: 1  // Inventory slot number
};

// Yellow Tennis Ball - Right side of first floor
const tennisBall = {
    x: 740,
    y: 508,
    radius: 6,
    width: 12,  // For collision detection
    height: 12,
    collected: false,
    mainColor: '#f4d03f',
    seamColor: '#d4b030',
    slot: 2  // Inventory slot number
};

// ============================================
// CAT BEDS
// Two interactive beds on the first floor
// ============================================

// Left Cat Bed - House/cube structure with circular hole and ears (scaled down)
const leftCatBed = {
    x: 145,              // centered under left window
    y: 468,              // sits on first floor (floor is at y=520, bed height is 52)
    width: 60,           // bottom width (scaled down from 80)
    topWidth: 52,        // top width (slight taper)
    height: 52,          // total height of house (scaled down from 70)
    holeRadius: 15,      // radius of circular entry hole (30px diameter for P=4 face)
    // Hole center position (relative to bed x,y)
    get holeX() { return this.x + this.width / 2; },
    get holeY() { return this.y + 28; },
    // Colors matching reference image
    mainColor: '#90d870',      // bright lime green
    sideColor: '#70b850',      // darker green for 3D effect
    highlightColor: '#a8e888', // lighter green highlight
    holeInterior: '#1a2a1a',   // dark interior
    holeBorder: '#50904a',     // darker green ring around hole
    earInner: '#e8a878'        // peach/salmon inner ear
};

// Right Cat Bed - Cloud platform bed (under right window)
const rightCatBed = {
    x: 575,          // right side near right window
    y: 420,          // elevated on wall below window
    width: 100,      // widened to accommodate larger sleeping pose
    height: 22,
    color: '#f8f8f8',       // white
    cloudColor: '#efefef',  // slightly off-white for cloud bumps
    shadowColor: '#e8e8e8'  // subtle shadow
};

// Zzz particles for sleeping animation
let zzzParticles = [];

// ============================================
// INVENTORY SLOTS
// 3 slots in top-right corner for collected items
// ============================================
const inventorySlots = {
    startX: 650,
    startY: 20,
    slotSize: 40,
    spacing: 10,
    borderColor: '#c0c0c0',
    fillColor: '#e8e8e8',
    count: 3
};

// ============================================
// PIXEL ART HELPER FUNCTION
// Draws a single pixel block at given position
// ============================================
function drawPixel(x, y, color, size = 3) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
}

// ============================================
// COLLISION DETECTION
// Check if two rectangles overlap
// ============================================
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ============================================
// PLATFORM COLLISION HANDLING
// Resolve collisions between player and platforms
// ============================================
function handlePlatformCollisions() {
    // Skip platform collision if climbing
    if (player.isClimbing) return;

    player.isOnGround = false;

    for (const platform of platforms) {
        if (checkCollision(player, platform)) {
            // Calculate overlap on each side
            const overlapLeft = (player.x + player.width) - platform.x;
            const overlapRight = (platform.x + platform.width) - player.x;
            const overlapTop = (player.y + player.height) - platform.y;
            const overlapBottom = (platform.y + platform.height) - player.y;

            // Find smallest overlap to determine collision side
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop && player.velocityY >= 0) {
                // Landing on top of platform
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isOnGround = true;
            } else if (minOverlap === overlapBottom && player.velocityY < 0) {
                // Hitting bottom of platform (head bump)
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            } else if (minOverlap === overlapLeft) {
                // Hitting left side of platform
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (minOverlap === overlapRight) {
                // Hitting right side of platform
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }
}

// ============================================
// WALL COLLISION HANDLING
// Handles collision with wall segments above doorways and room ceilings
// ============================================
function handleWallCollisions() {
    // Skip wall collision if climbing stairs
    if (player.isClimbing) return;

    // Wall segments above doorways
    const walls = [wallAboveLeftDoor, wallAboveRightDoor];

    walls.forEach(wall => {
        // Check if Luna overlaps this wall
        if (player.x < wall.x + wall.width &&
            player.x + player.width > wall.x &&
            player.y < wall.y + wall.height &&
            player.y + player.height > wall.y) {

            // Calculate overlap on each horizontal side
            const overlapLeft = (player.x + player.width) - wall.x;
            const overlapRight = (wall.x + wall.width) - player.x;

            // Push Luna out based on smallest overlap
            if (overlapLeft < overlapRight) {
                // Luna came from left - push back left
                player.x = wall.x - player.width - 1;
                player.velocityX = 0;
            } else {
                // Luna came from right - push back right
                player.x = wall.x + wall.width + 1;
                player.velocityX = 0;
            }
        }
    });

    // Room ceiling collision (prevent jumping through ceiling)
    roomCeilings.forEach(ceiling => {
        if (player.x < ceiling.x + ceiling.width &&
            player.x + player.width > ceiling.x &&
            player.y < ceiling.y + ceiling.height &&
            player.y + player.height > ceiling.y) {

            // Only push down if moving upward (jumping)
            if (player.velocityY < 0) {
                player.y = ceiling.y + ceiling.height;
                player.velocityY = 0;
            }
        }
    });
}

// ============================================
// TWO-WAY STAIR CLIMBING ENABLED
// Handles climbing up and down the centered staircase
// Luna can enter from EITHER the first floor OR second floor
// ============================================
function handleStairClimbing() {
    const playerCenterX = player.x + player.width / 2;
    const playerBottom = player.y + player.height;

    // Check if player is within the stair zone horizontally
    const inStairZoneX = playerCenterX >= stairZone.x && playerCenterX <= stairZone.x + stairZone.width;

    // Check if player is within the stair zone vertically
    // This now includes the area ABOVE the second floor platform
    // so Luna can step onto stairs from the second floor and descend
    const inStairZoneY = player.y >= stairZone.y && playerBottom <= stairZone.bottomY + player.height;

    const inStairZone = inStairZoneX && inStairZoneY;

    // Enter climbing mode when in stair zone and pressing UP or DOWN
    if (inStairZone && (keys.up || keys.down)) {
        player.isClimbing = true;
    }

    // Handle climbing movement
    if (player.isClimbing) {
        // Lock horizontal movement and disable gravity
        player.velocityX = 0;
        player.velocityY = 0;

        // Move up
        if (keys.up) {
            player.y -= player.climbSpeed;
        }

        // Move down
        if (keys.down) {
            player.y += player.climbSpeed;
        }

        // Exit climbing when reaching top (land on second floor)
        // BUT if gate is closed, stop Luna at the gate
        if (player.y + player.height <= stairZone.topY) {
            if (!gameState.gateOpen) {
                // Gate is closed - stop Luna at the gate
                player.y = gate.y + gate.height - player.height;
            } else {
                // Gate is open - allow Luna through
                player.y = stairZone.topY - player.height;
                player.isClimbing = false;
                player.isOnGround = true;
            }
        }

        // Exit climbing when reaching bottom (land on first floor)
        if (player.y + player.height >= stairZone.bottomY) {
            player.y = stairZone.bottomY - player.height;
            player.isClimbing = false;
            player.isOnGround = true;
        }

        // Exit climbing if player moves horizontally out of zone
        if (!inStairZoneX) {
            player.isClimbing = false;
        }
    }
}

// ============================================
// ROOM ACCESS / LOCKED DOOR MECHANIC
// Block entry to left room unless envelope is collected
// ============================================
function handleRoomAccess() {
    // If left room is still locked and player tries to enter
    if (!gameState.leftRoomUnlocked) {
        if (checkCollision(player, leftRoomBlocker)) {
            // Push player back out
            player.x = leftRoomBlocker.x + leftRoomBlocker.width;
            player.velocityX = 0;
        }
    }
}

// ============================================
// GATE CONTACT CHECK
// Returns true if Luna's bounding box overlaps the gate
// ============================================
function lunaAtGate() {
    return player.x < gate.x + gate.width &&
           player.x + player.width > gate.x &&
           player.y < gate.y + gate.height &&
           player.y + player.height > gate.y;
}

// ============================================
// GATE CONDITION CHECK
// Gate opens when Luna has BOTH items AND physically touches the gate
// ============================================
function checkGateCondition() {
    if (!gameState.gateOpen &&
        gameState.hasSushi &&
        gameState.hasTennisBall &&
        lunaAtGate()) {
        gameState.gateOpen = true;
    }
}

// ============================================
// COLLECTIBLE ITEM HANDLERS
// Check if player touches collectible items
// ============================================
function handleEnvelopeCollection() {
    if (!envelope.collected && checkCollision(player, envelope)) {
        envelope.collected = true;
        gameState.hasEnvelope = true;
        gameState.leftRoomUnlocked = true; // Unlock the left room
    }
}

function handleSushiCollection() {
    if (!sushi.collected && checkCollision(player, sushi)) {
        sushi.collected = true;
        gameState.hasSushi = true;
    }
}

function handleTennisBallCollection() {
    // Create collision box for the circular tennis ball
    const ballCollider = {
        x: tennisBall.x - tennisBall.radius,
        y: tennisBall.y - tennisBall.radius,
        width: tennisBall.radius * 2,
        height: tennisBall.radius * 2
    };
    if (!tennisBall.collected && checkCollision(player, ballCollider)) {
        tennisBall.collected = true;
        gameState.hasTennisBall = true;
    }
}

// ============================================
// CAT BED INTERACTIONS
// ============================================

// Check if Luna is near the left cat bed
function nearLeftBed() {
    const bedCenterX = leftCatBed.x + leftCatBed.width / 2;
    const bedBottom = leftCatBed.y + leftCatBed.height;
    return Math.abs((player.x + player.width / 2) - bedCenterX) < 45 &&
           player.isOnGround &&
           player.y + player.height >= bedBottom - 10; // Near floor level at bed
}

// Enter the left cat bed
function enterLeftBed() {
    gameState.inLeftBed = true;
    player.isClimbing = false;
    player.velocityX = 0;
    player.velocityY = 0;
}

// Exit the left cat bed
function exitLeftBed() {
    gameState.inLeftBed = false;
    // Place Luna on the floor beside the bed
    player.x = leftCatBed.x + leftCatBed.width / 2 - player.width / 2;
    player.y = leftCatBed.y + leftCatBed.height - player.height; // Floor level
    player.isOnGround = true;
}

// Handle cloud bed landing detection
function checkCloudBedLanding() {
    // Only check when Luna is falling and above the cloud bed
    if (player.velocityY > 0 && !gameState.onCloudBed) {
        const bedTop = rightCatBed.y;
        const bedLeft = rightCatBed.x;
        const bedRight = rightCatBed.x + rightCatBed.width;

        // Check if player is landing on cloud bed
        if (player.x + player.width > bedLeft &&
            player.x < bedRight &&
            player.y + player.height >= bedTop &&
            player.y + player.height <= bedTop + 10) {
            // Land on cloud bed and start sleeping
            player.y = bedTop - player.height;
            player.velocityY = 0;
            player.isOnGround = true;
            gameState.onCloudBed = true;
            initZzzParticles();
        }
    }
}

// Initialize Zzz particles for sleeping (larger sizes)
function initZzzParticles() {
    zzzParticles = [];
    const sizes = [10, 14, 18]; // Scaled up sizes
    for (let i = 0; i < 3; i++) {
        zzzParticles.push({
            x: rightCatBed.x + rightCatBed.width / 2 + 18 + i * 10,
            y: rightCatBed.y - 30 - i * 14,
            size: sizes[i],
            opacity: 1.0 - i * 0.2,
            char: i === 0 ? 'z' : 'Z',
            startY: rightCatBed.y - 30 - i * 14
        });
    }
}

// Update Zzz particles animation
function updateZzzParticles() {
    if (!gameState.onCloudBed) return;

    for (let i = 0; i < zzzParticles.length; i++) {
        const p = zzzParticles[i];
        p.y -= 0.3;
        p.opacity -= 0.005;

        // Reset particle when faded or too high
        if (p.opacity <= 0 || p.y < rightCatBed.y - 60) {
            p.y = p.startY;
            p.opacity = 1.0 - i * 0.2;
        }
    }
}

// Draw Zzz particles
function drawZzzParticles() {
    if (!gameState.onCloudBed || zzzParticles.length === 0) return;

    ctx.save();
    for (const p of zzzParticles) {
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = '#8aabcc';
        ctx.font = `bold ${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(p.char, p.x, p.y);
    }
    ctx.restore();
}

// Wake up from cloud bed
function wakeFromCloudBed() {
    gameState.onCloudBed = false;
    zzzParticles = [];
    player.isOnGround = true;
}

// Handle bed entry with up arrow
function handleBedInteractions() {
    // Check for left bed entry
    if (keys.up && nearLeftBed() && !gameState.inLeftBed && !player.isClimbing) {
        enterLeftBed();
    }

    // Cloud bed landing is handled in checkCloudBedLanding()
}

// ============================================
// DOOR ANIMATION UPDATE
// Detects player near doorways and animates doors open/closed
//
// Detection works by checking if player overlaps trigger zone:
// - If overlapping: set targetAngle to maxAngle (open)
// - If not overlapping: set targetAngle to 0 (closed)
// - Door angle smoothly animates toward targetAngle using lerp
// ============================================
function updateDoors() {
    // Check left door trigger (only if room is unlocked)
    if (gameState.leftRoomUnlocked) {
        const inLeftTrigger = checkCollision(player, doorTriggers.left);
        doors.left.targetAngle = inLeftTrigger ? doors.left.maxAngle : 0;
    }

    // Check right door trigger
    const inRightTrigger = checkCollision(player, doorTriggers.right);
    doors.right.targetAngle = inRightTrigger ? doors.right.maxAngle : 0;

    // Animate doors toward target angles using lerp
    doors.left.angle += (doors.left.targetAngle - doors.left.angle) * doors.left.animSpeed;
    doors.right.angle += (doors.right.targetAngle - doors.right.angle) * doors.right.animSpeed;
}

// ============================================
// PLAYER UPDATE
// Apply physics and input to player movement
// ============================================
function updatePlayer() {
    // Skip normal movement if climbing
    if (player.isClimbing) {
        return;
    }

    // Horizontal movement from input
    if (keys.left) {
        player.velocityX = -player.speed;
        player.facingRight = false;  // Update facing direction
        walkFrame++;  // Increment walk animation
    } else if (keys.right) {
        player.velocityX = player.speed;
        player.facingRight = true;   // Update facing direction
        walkFrame++;  // Increment walk animation
    } else {
        // Apply friction when not pressing movement keys
        player.velocityX *= physics.friction;
    }

    // Jumping (only when on ground)
    if (keys.space && player.isOnGround) {
        player.velocityY = player.jumpForce;
        player.isOnGround = false;
    }

    // Apply gravity
    player.velocityY += physics.gravity;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Keep player within canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isOnGround = true;
    }
}

// ============================================
// DRAWING FUNCTIONS
// Render all game elements to canvas
// ============================================

// ============================================
// DRAW BACKGROUND
// Warm beige walls with windows on first floor
// Must be called FIRST before all other draw calls
// ============================================
function drawBackground() {
    // Fill entire canvas with warm background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ============================================
    // FIRST FLOOR WALLS
    // Left wall section: x=0 to x=350 (left of staircase)
    // Right wall section: x=450 to x=800 (right of staircase)
    // ============================================

    const wallTop = 280;      // Just below second floor
    const wallBottom = 520;   // Just above first floor platform
    const wallHeight = wallBottom - wallTop;

    // Left wall section
    ctx.fillStyle = colors.wallMain;
    ctx.fillRect(0, wallTop, 350, wallHeight);

    // Right wall section
    ctx.fillRect(450, wallTop, 350, wallHeight);

    // Add subtle vertical wallpaper texture lines
    ctx.fillStyle = colors.wallTexture;
    // Left wall texture
    for (let x = 30; x < 350; x += 35) {
        ctx.fillRect(x, wallTop, 1, wallHeight);
    }
    // Right wall texture
    for (let x = 480; x < 800; x += 35) {
        ctx.fillRect(x, wallTop, 1, wallHeight);
    }

    // ============================================
    // BASEBOARDS
    // Slightly darker warm tone, 15px tall
    // ============================================
    ctx.fillStyle = colors.baseboard;
    // Left baseboard
    ctx.fillRect(0, wallBottom - 15, 350, 15);
    // Right baseboard
    ctx.fillRect(450, wallBottom - 15, 350, 15);
    // Baseboard top highlight
    ctx.fillStyle = '#e0d0b8';
    ctx.fillRect(0, wallBottom - 15, 350, 2);
    ctx.fillRect(450, wallBottom - 15, 350, 2);

    // ============================================
    // WINDOWS
    // Left window centered at x=175, Right window centered at x=625
    // Each window: 100px wide x 100px tall
    // ============================================
    drawWindow(125, 350);  // Left window (centered at x=175)
    drawWindow(575, 350);  // Right window (centered at x=625)
}

// ============================================
// DRAW WINDOW
// Window with 4 panes, wooden frame, and sill
// ============================================
function drawWindow(x, y) {
    const width = 100;
    const height = 100;
    const frameThickness = 8;
    const dividerThickness = 8;

    // Outer frame
    ctx.fillStyle = colors.windowFrame;
    ctx.fillRect(x, y, width, height);

    // Window panes (4 panes in 2x2 grid)
    const paneWidth = (width - frameThickness * 2 - dividerThickness) / 2;
    const paneHeight = (height - frameThickness * 2 - dividerThickness) / 2;

    ctx.fillStyle = colors.windowPane;

    // Top-left pane
    const pane1X = x + frameThickness;
    const pane1Y = y + frameThickness;
    ctx.fillRect(pane1X, pane1Y, paneWidth, paneHeight);

    // Top-right pane
    const pane2X = x + frameThickness + paneWidth + dividerThickness;
    const pane2Y = y + frameThickness;
    ctx.fillRect(pane2X, pane2Y, paneWidth, paneHeight);

    // Bottom-left pane
    const pane3X = x + frameThickness;
    const pane3Y = y + frameThickness + paneHeight + dividerThickness;
    ctx.fillRect(pane3X, pane3Y, paneWidth, paneHeight);

    // Bottom-right pane
    const pane4X = x + frameThickness + paneWidth + dividerThickness;
    const pane4Y = y + frameThickness + paneHeight + dividerThickness;
    ctx.fillRect(pane4X, pane4Y, paneWidth, paneHeight);

    // White highlight reflections (top-left corner of each pane)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(pane1X + 3, pane1Y + 3, 12, 6);
    ctx.fillRect(pane2X + 3, pane2Y + 3, 12, 6);
    ctx.fillRect(pane3X + 3, pane3Y + 3, 12, 6);
    ctx.fillRect(pane4X + 3, pane4Y + 3, 12, 6);

    // Cross divider (horizontal)
    ctx.fillStyle = colors.windowFrame;
    ctx.fillRect(x + frameThickness, y + frameThickness + paneHeight, width - frameThickness * 2, dividerThickness);

    // Cross divider (vertical)
    ctx.fillRect(x + frameThickness + paneWidth, y + frameThickness, dividerThickness, height - frameThickness * 2);

    // Window sill (below window)
    ctx.fillStyle = colors.windowSill;
    ctx.fillRect(x - 5, y + height, width + 10, 10);
    // Sill shadow
    ctx.fillStyle = '#a89070';
    ctx.fillRect(x - 5, y + height + 8, width + 10, 2);
    // Sill highlight
    ctx.fillStyle = '#d8c8a8';
    ctx.fillRect(x - 5, y + height, width + 10, 2);
}

// ============================================
// LUNA PIXEL ART COLORS
// ============================================
const lunaColors = {
    body: '#e8d5b0',        // Cream body
    belly: '#f0e8d0',       // Light cream belly
    points: '#5c3010',      // Dark brown Siamese points
    eye: '#2a7fd4',         // Bright blue eyes
    tongue: '#e87878',      // Pink tongue (kept for potential use)
    snout: '#1a1a1a'        // Black snout/nose
};

// Draw the player (Luna - Pixel-art Siamese cat)
function drawPlayer() {
    ctx.save();

    const x = player.x;
    const y = player.y;

    // Determine if Luna is moving or idle
    const isMoving = Math.abs(player.velocityX) > 0.5;
    const isAirborne = !player.isOnGround && !player.isClimbing;

    // Animation frame for walking (toggle every 10 ticks)
    const animFrame = Math.floor(walkFrame / 10) % 2;

    if (!isMoving && !isAirborne) {
        // ============================================
        // IDLE/SITTING POSE - Front-facing
        // ============================================
        drawLunaSitting(x, y);
    } else {
        // ============================================
        // WALKING/CRAWLING POSE - Side-facing
        // ============================================
        drawLunaCrawling(x, y, player.facingRight, animFrame, isAirborne);
    }

    ctx.restore();
}

// Draw Luna in sitting pose (front-facing, idle) - PIXEL ART VERSION
function drawLunaSitting(x, y) {
    const P = 4; // pixel block size (increased from 3 for clearer features)
    const c = lunaColors;

    // Sprite dimensions at new scale
    const spriteWidth = 10 * P;   // 10 blocks wide
    const spriteHeight = 12 * P;  // 12 blocks tall

    // Center the larger sprite on the collision box
    const offsetX = x + (player.width - spriteWidth) / 2;
    const offsetY = y + (player.height - spriteHeight);

    // Helper to draw pixel at grid position
    const px = (col, row, color) => drawPixel(offsetX + col * P, offsetY + row * P, color, P);

    // ============================================
    // TAIL (curves around right side)
    // ============================================
    px(9, 7, c.body);   // Tail base
    px(9, 6, c.body);
    px(10, 5, c.body);
    px(10, 4, c.points); // Tail tip dark
    px(10, 3, c.points);

    // ============================================
    // BODY (cream, 8 blocks wide x 5 blocks tall)
    // ============================================
    for (let row = 6; row < 11; row++) {
        for (let col = 1; col < 9; col++) {
            px(col, row, c.body);
        }
    }

    // ============================================
    // FRONT PAWS (dark brown)
    // ============================================
    px(2, 11, c.points);
    px(3, 11, c.points);
    px(6, 11, c.points);
    px(7, 11, c.points);

    // ============================================
    // HEAD (cream base, 8 blocks wide)
    // ============================================
    // Top of head row
    for (let col = 2; col < 8; col++) {
        px(col, 1, c.body);
    }
    // Main head rows
    for (let row = 2; row < 6; row++) {
        for (let col = 1; col < 9; col++) {
            px(col, row, c.body);
        }
    }

    // ============================================
    // EARS (dark brown triangles)
    // ============================================
    // Left ear
    px(1, 1, c.points);
    px(1, 0, c.points);
    px(2, 0, c.points);
    // Right ear
    px(8, 1, c.points);
    px(8, 0, c.points);
    px(7, 0, c.points);

    // ============================================
    // FACE MASK (dark brown - surrounds eyes)
    // Covers rows 2-4, cols 2-7
    // ============================================
    for (let row = 2; row < 5; row++) {
        for (let col = 2; col < 8; col++) {
            px(col, row, c.points);
        }
    }

    // ============================================
    // EYES (2x2 each, with 2-block gap between)
    // Left eye: cols 2-3, rows 2-3
    // Right eye: cols 6-7, rows 2-3
    // Gap: cols 4-5 (dark mask)
    // ============================================
    // Left eye (2x2 blue)
    px(2, 2, c.eye);
    px(3, 2, c.eye);
    px(2, 3, c.eye);
    px(3, 3, c.eye);
    // Left pupil
    px(3, 3, '#1a1a1a');

    // Right eye (2x2 blue)
    px(6, 2, c.eye);
    px(7, 2, c.eye);
    px(6, 3, c.eye);
    px(7, 3, c.eye);
    // Right pupil
    px(6, 3, '#1a1a1a');

    // ============================================
    // SNOUT/NOSE (black, 2 blocks wide centered)
    // ============================================
    px(4, 4, '#1a1a1a');
    px(5, 4, '#1a1a1a');

    // ============================================
    // MUZZLE (cream area below snout)
    // ============================================
    px(3, 5, c.body);
    px(4, 5, c.body);
    px(5, 5, c.body);
    px(6, 5, c.body);
}

// Draw Luna in crawling pose (side-facing, walking) - PIXEL ART VERSION
function drawLunaCrawling(x, y, facingRight, animFrame, isAirborne) {
    const P = 4; // pixel block size (increased from 3)
    const c = lunaColors;

    // Leg tuck when jumping (in pixel units)
    const legTuck = isAirborne ? 2 : 0;

    // Sprite dimensions
    const spriteWidth = 14 * P;
    const spriteHeight = 9 * P;

    // For mirroring when facing left
    ctx.save();
    if (!facingRight) {
        ctx.translate(x + player.width, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
    }

    // Center sprite on collision box
    const offsetX = x + (player.width - spriteWidth) / 2;
    const offsetY = y + (player.height - spriteHeight);

    // Helper to draw pixel at grid position
    const px = (col, row, color) => drawPixel(offsetX + col * P, offsetY + row * P, color, P);

    // ============================================
    // TAIL (curves upward behind body)
    // ============================================
    px(0, 4, c.body);   // Tail base
    px(0, 3, c.body);
    px(1, 2, c.body);
    px(1, 1, c.body);
    px(1, 0, c.points); // Tail tip dark
    px(2, 0, c.points);

    // ============================================
    // BACK LEGS (animated)
    // ============================================
    const backLegOffset = animFrame === 0 ? 1 : 0;

    // Back leg 1
    px(3, 5 + backLegOffset - legTuck, c.body);
    px(3, 6 + backLegOffset - legTuck, c.body);
    px(3, 7 + backLegOffset - legTuck, c.points);

    // Back leg 2
    px(4, 5 - backLegOffset - legTuck, c.body);
    px(4, 6 - backLegOffset - legTuck, c.body);
    px(4, 7 - backLegOffset - legTuck, c.points);

    // ============================================
    // BODY (horizontal, elongated)
    // ============================================
    // Main body (cream) - 8 blocks wide
    for (let col = 2; col < 10; col++) {
        px(col, 3, c.body);
        px(col, 4, c.body);
    }
    // Belly (light cream)
    for (let col = 3; col < 9; col++) {
        px(col, 5, c.belly);
    }

    // ============================================
    // FRONT LEGS (animated)
    // ============================================
    const frontLegOffset = animFrame === 0 ? 0 : 1;

    // Front leg 1
    px(8, 5 + frontLegOffset - legTuck, c.body);
    px(8, 6 + frontLegOffset - legTuck, c.body);
    px(8, 7 + frontLegOffset - legTuck, c.points);

    // Front leg 2
    px(9, 5 - frontLegOffset - legTuck, c.body);
    px(9, 6 - frontLegOffset - legTuck, c.body);
    px(9, 7 - frontLegOffset - legTuck, c.points);

    // ============================================
    // HEAD (side view, 4x4 blocks)
    // ============================================
    // Head base (cream)
    for (let row = 0; row < 4; row++) {
        for (let col = 9; col < 13; col++) {
            px(col, row, c.body);
        }
    }

    // ============================================
    // EARS (dark brown)
    // ============================================
    // Front ear (more visible)
    px(12, -1, c.points);
    px(13, -1, c.points);
    px(13, -2, c.points);
    // Back ear (behind)
    px(9, -1, c.points);
    px(10, -1, c.points);

    // ============================================
    // FACE MASK (dark brown on front of face)
    // Covers 2x3 area on front of head
    // ============================================
    px(11, 0, c.points);
    px(12, 0, c.points);
    px(11, 1, c.points);
    px(12, 1, c.points);
    px(11, 2, c.points);
    px(12, 2, c.points);

    // ============================================
    // EYE (2x2 blue with pupil, clearly on mask)
    // ============================================
    px(11, 0, c.eye);
    px(12, 0, c.eye);
    px(11, 1, c.eye);
    px(12, 1, c.eye);
    // Pupil (dark)
    px(12, 1, '#1a1a1a');

    // ============================================
    // PROTRUDING SNOUT (black, extends beyond face)
    // 2x2 block protruding outward from front of head
    // ============================================
    px(13, 2, '#1a1a1a');
    px(14, 2, '#1a1a1a');
    px(13, 3, '#1a1a1a');
    px(14, 3, '#1a1a1a');

    ctx.restore();
}

// ============================================
// CAT BED DRAWING FUNCTIONS
// ============================================

// Draw the left cat bed BACKGROUND (main body and ears) - called BEFORE Luna
function drawLeftCatBedBackground() {
    const bed = leftCatBed;
    const inset = (bed.width - bed.topWidth) / 2; // How much each side tapers

    // ============================================
    // MAIN BODY - Slightly trapezoidal front face
    // ============================================

    // Side shading (3D effect) - draw first as slightly wider
    ctx.fillStyle = bed.sideColor;
    ctx.beginPath();
    ctx.moveTo(bed.x - 3, bed.y + bed.height);           // Bottom-left
    ctx.lineTo(bed.x + bed.width + 3, bed.y + bed.height); // Bottom-right
    ctx.lineTo(bed.x + bed.width - inset + 3, bed.y);    // Top-right
    ctx.lineTo(bed.x + inset - 3, bed.y);                // Top-left
    ctx.closePath();
    ctx.fill();

    // Main green body
    ctx.fillStyle = bed.mainColor;
    ctx.beginPath();
    ctx.moveTo(bed.x, bed.y + bed.height);               // Bottom-left
    ctx.lineTo(bed.x + bed.width, bed.y + bed.height);   // Bottom-right
    ctx.lineTo(bed.x + bed.width - inset, bed.y);        // Top-right
    ctx.lineTo(bed.x + inset, bed.y);                    // Top-left
    ctx.closePath();
    ctx.fill();

    // Top highlight (rounded padding effect)
    ctx.fillStyle = bed.highlightColor;
    ctx.fillRect(bed.x + inset + 2, bed.y, bed.topWidth - 4, 4);

    // ============================================
    // EARS ON TOP (scaled down to match smaller bed)
    // ============================================

    // Left ear
    ctx.fillStyle = bed.mainColor;
    ctx.beginPath();
    ctx.moveTo(bed.x + inset + 4, bed.y);           // Bottom-right of ear (on bed top)
    ctx.lineTo(bed.x + inset - 6, bed.y - 14);      // Top point (angled left)
    ctx.lineTo(bed.x + inset - 9, bed.y - 6);       // Left edge
    ctx.lineTo(bed.x + inset - 4, bed.y);           // Bottom-left of ear
    ctx.closePath();
    ctx.fill();

    // Left inner ear
    ctx.fillStyle = bed.earInner;
    ctx.beginPath();
    ctx.moveTo(bed.x + inset + 1, bed.y - 2);
    ctx.lineTo(bed.x + inset - 4, bed.y - 11);
    ctx.lineTo(bed.x + inset - 6, bed.y - 5);
    ctx.closePath();
    ctx.fill();

    // Right ear
    ctx.fillStyle = bed.mainColor;
    ctx.beginPath();
    ctx.moveTo(bed.x + bed.width - inset - 4, bed.y);    // Bottom-left of ear
    ctx.lineTo(bed.x + bed.width - inset + 6, bed.y - 14); // Top point (angled right)
    ctx.lineTo(bed.x + bed.width - inset + 9, bed.y - 6);  // Right edge
    ctx.lineTo(bed.x + bed.width - inset + 4, bed.y);    // Bottom-right of ear
    ctx.closePath();
    ctx.fill();

    // Right inner ear
    ctx.fillStyle = bed.earInner;
    ctx.beginPath();
    ctx.moveTo(bed.x + bed.width - inset - 1, bed.y - 2);
    ctx.lineTo(bed.x + bed.width - inset + 4, bed.y - 11);
    ctx.lineTo(bed.x + bed.width - inset + 6, bed.y - 5);
    ctx.closePath();
    ctx.fill();

    // ============================================
    // CIRCULAR ENTRY HOLE
    // ============================================
    if (gameState.inLeftBed) {
        // Draw Luna's face in the hole
        drawLunaFaceInHole();
    } else {
        // Draw dark interior
        ctx.fillStyle = bed.holeInterior;
        ctx.beginPath();
        ctx.arc(bed.holeX, bed.holeY, bed.holeRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hole border ring (always on top)
    ctx.strokeStyle = bed.holeBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bed.holeX, bed.holeY, bed.holeRadius, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw Luna's face centered in the hole - using EXACT pixel art from idle pose
// Uses P=4 to match normal Luna's idle sitting pose exactly
function drawLunaFaceInHole() {
    const bed = leftCatBed;
    const c = lunaColors;
    const centerX = bed.holeX;
    const centerY = bed.holeY;

    // SAME pixel size as idle pose for identical appearance
    const P = 4;

    // Calculate offset to center the head in the hole
    // Head is about 10 blocks wide (cols 0-9), center at col 4.5
    // Head is about 6 blocks tall (rows 0-5), center at row 3
    const offsetX = centerX - 4.5 * P;
    const offsetY = centerY - 3 * P;

    // Helper to draw pixel at grid position
    const px = (col, row, color) => drawPixel(offsetX + col * P, offsetY + row * P, color, P);

    // ============================================
    // HEAD (cream base, matching idle pose exactly)
    // ============================================
    // Top of head row
    for (let col = 2; col < 8; col++) {
        px(col, 1, c.body);
    }
    // Main head rows
    for (let row = 2; row < 6; row++) {
        for (let col = 1; col < 9; col++) {
            px(col, row, c.body);
        }
    }

    // ============================================
    // EARS (dark brown triangles)
    // ============================================
    // Left ear
    px(1, 1, c.points);
    px(1, 0, c.points);
    px(2, 0, c.points);
    // Right ear
    px(8, 1, c.points);
    px(8, 0, c.points);
    px(7, 0, c.points);

    // ============================================
    // FACE MASK (dark brown - surrounds eyes)
    // ============================================
    for (let row = 2; row < 5; row++) {
        for (let col = 2; col < 8; col++) {
            px(col, row, c.points);
        }
    }

    // ============================================
    // EYES (2x2 each, with gap between)
    // ============================================
    // Left eye (2x2 blue)
    px(2, 2, c.eye);
    px(3, 2, c.eye);
    px(2, 3, c.eye);
    px(3, 3, c.eye);
    // Left pupil
    px(3, 3, '#1a1a1a');

    // Right eye (2x2 blue)
    px(6, 2, c.eye);
    px(7, 2, c.eye);
    px(6, 3, c.eye);
    px(7, 3, c.eye);
    // Right pupil
    px(6, 3, '#1a1a1a');

    // ============================================
    // SNOUT/NOSE (black, 2 blocks wide centered)
    // ============================================
    px(4, 4, '#1a1a1a');
    px(5, 4, '#1a1a1a');

    // ============================================
    // MUZZLE (cream area below snout)
    // ============================================
    px(3, 5, c.body);
    px(4, 5, c.body);
    px(5, 5, c.body);
    px(6, 5, c.body);
}

// Draw the left cat bed FOREGROUND (rim overlay) - called AFTER Luna
// This creates the illusion of Luna being inside the bed by masking face edges
function drawLeftCatBedForeground() {
    if (!gameState.inLeftBed) return;

    const bed = leftCatBed;

    // Draw the green rim around the hole to mask any face pixels outside the circle
    // Use a thick ring that covers the area between the face and the hole edge
    ctx.save();

    // Create a clipping region that is OUTSIDE the hole (inverse clip)
    // Draw the green bed surface over any face pixels that extend past hole edge
    ctx.beginPath();
    ctx.rect(bed.x - 10, bed.y - 10, bed.width + 20, bed.height + 20);
    ctx.arc(bed.holeX, bed.holeY, bed.holeRadius - 1, 0, Math.PI * 2, true);
    ctx.clip();

    // Redraw the green bed front face to cover face overflow
    ctx.fillStyle = bed.mainColor;
    ctx.fillRect(bed.x, bed.y, bed.width, bed.height);

    ctx.restore();

    // Redraw hole border ring on top
    ctx.strokeStyle = bed.holeBorder;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bed.holeX, bed.holeY, bed.holeRadius, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw the right cat bed (cloud platform)
function drawRightCatBed() {
    const bed = rightCatBed;

    // Draw flat base platform
    ctx.fillStyle = bed.color;
    ctx.fillRect(bed.x, bed.y + bed.height - 10, bed.width, 10);

    // Draw cloud bumps on top
    ctx.fillStyle = bed.color;
    const bumpY = bed.y + bed.height - 10;

    // Draw overlapping circles for cloud effect
    ctx.beginPath();
    ctx.arc(bed.x + 15, bumpY, 12, 0, Math.PI * 2);
    ctx.arc(bed.x + 35, bumpY - 2, 14, 0, Math.PI * 2);
    ctx.arc(bed.x + 55, bumpY, 13, 0, Math.PI * 2);
    ctx.arc(bed.x + 75, bumpY - 1, 12, 0, Math.PI * 2);
    ctx.fill();

    // Subtle shadow under bumps
    ctx.fillStyle = bed.shadowColor;
    ctx.beginPath();
    ctx.ellipse(bed.x + 35, bumpY + 6, 30, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Redraw white to cover shadow overlap
    ctx.fillStyle = bed.color;
    ctx.fillRect(bed.x, bed.y + bed.height - 10, bed.width, 10);
}

// Draw Luna sleeping curled up on cloud bed
function drawLunaSleeping() {
    if (!gameState.onCloudBed) return;

    const bed = rightCatBed;
    const c = lunaColors;

    // Position Luna centered on bed (larger pose)
    const centerX = bed.x + bed.width / 2;
    const centerY = bed.y + bed.height - 18;

    ctx.save();

    // Curled body (cream oval) - LARGER: 38px wide x 24px tall
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 19, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark tail curled around (C-shape) - proportionally larger
    ctx.strokeStyle = c.points;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Tail tip darker
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0.5, 1.2);
    ctx.stroke();

    // Head tucked (larger circle at front) - 14px diameter
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.arc(centerX - 11, centerY - 5, 10, 0, Math.PI * 2);
    ctx.fill();

    // Dark face mask (larger)
    ctx.fillStyle = c.points;
    ctx.beginPath();
    ctx.arc(centerX - 14, centerY - 3, 6, 0, Math.PI * 2);
    ctx.fill();

    // Closed eyes (^_^) - larger and more visible
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left eye
    ctx.moveTo(centerX - 18, centerY - 6);
    ctx.lineTo(centerX - 15, centerY - 9);
    ctx.lineTo(centerX - 12, centerY - 6);
    // Right eye
    ctx.moveTo(centerX - 11, centerY - 6);
    ctx.lineTo(centerX - 8, centerY - 9);
    ctx.lineTo(centerX - 5, centerY - 6);
    ctx.stroke();

    // Ear tips peeking (larger)
    ctx.fillStyle = c.points;
    ctx.beginPath();
    ctx.moveTo(centerX - 18, centerY - 10);
    ctx.lineTo(centerX - 22, centerY - 18);
    ctx.lineTo(centerX - 14, centerY - 12);
    ctx.closePath();
    ctx.fill();

    // Paw tips visible at front (larger: 6px wide x 4px tall)
    ctx.fillStyle = c.points;
    ctx.fillRect(centerX - 5, centerY + 6, 6, 4);
    ctx.fillRect(centerX + 3, centerY + 7, 6, 4);

    ctx.restore();
}

// Draw all platforms with wood grain texture
function drawPlatforms() {
    for (const platform of platforms) {
        // Base wood color
        ctx.fillStyle = colors.floorWood;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Add wood grain lines (horizontal, every 10 pixels)
        ctx.fillStyle = colors.floorWoodGrain;
        for (let y = platform.y + 5; y < platform.y + platform.height; y += 10) {
            ctx.fillRect(platform.x, y, platform.width, 1);
        }

        // Add vertical plank separations (every 60 pixels)
        ctx.fillStyle = colors.floorWoodPlank;
        for (let x = platform.x + 60; x < platform.x + platform.width; x += 60) {
            ctx.fillRect(x, platform.y, 2, platform.height);
        }

        // Add subtle highlight on top edge
        ctx.fillStyle = '#c8a880';
        ctx.fillRect(platform.x, platform.y, platform.width, 2);
    }
}

// ============================================
// STAIR VISUALS WITH WOOD GRAIN TEXTURE
// Wooden staircase in the center of the screen
// ============================================
function drawStairs() {
    const x = stairZone.x;
    const width = stairZone.width;
    const stairTop = stairZone.topY;      // Second floor level
    const stairBottom = stairZone.bottomY; // First floor level
    const stairHeight = stairBottom - stairTop;

    // Number of visible steps
    const stepCount = 8;
    const stepHeight = stairHeight / stepCount;
    const stepDepth = 12;  // Visual depth of each step

    // Draw staircase background (side wall)
    ctx.fillStyle = colors.wallInterior;
    ctx.fillRect(x, stairTop, width, stairHeight);

    // Draw each step from bottom to top
    for (let i = 0; i < stepCount; i++) {
        const stepY = stairBottom - ((i + 1) * stepHeight);

        // Step tread (top surface) - warm wood
        ctx.fillStyle = colors.stairWood;
        ctx.fillRect(x, stepY, width, stepDepth);

        // Wood grain on step tread
        ctx.fillStyle = colors.stairWoodGrain;
        ctx.fillRect(x, stepY + 3, width, 1);
        ctx.fillRect(x, stepY + 7, width, 1);

        // Step riser (front face) - slightly darker
        ctx.fillStyle = colors.stairWoodGrain;
        ctx.fillRect(x, stepY + stepDepth, width, stepHeight - stepDepth);

        // Highlight on step edge
        ctx.fillStyle = '#c8a878';
        ctx.fillRect(x, stepY, width, 2);

        // Edge shadow for depth
        ctx.fillStyle = '#806040';
        ctx.fillRect(x, stepY + stepDepth - 1, width, 1);
    }

    // Left side rail with grain
    ctx.fillStyle = colors.railingWood;
    ctx.fillRect(x - 8, stairTop - 40, 8, stairHeight + 40);
    // Rail grain
    ctx.fillStyle = '#4a3020';
    for (let gy = stairTop - 35; gy < stairBottom; gy += 15) {
        ctx.fillRect(x - 7, gy, 6, 1);
    }

    // Right side rail with grain
    ctx.fillStyle = colors.railingWood;
    ctx.fillRect(x + width, stairTop - 40, 8, stairHeight + 40);
    // Rail grain
    ctx.fillStyle = '#4a3020';
    for (let gy = stairTop - 35; gy < stairBottom; gy += 15) {
        ctx.fillRect(x + width + 1, gy, 6, 1);
    }

    // Handrail posts
    const postCount = 4;
    const postSpacing = stairHeight / postCount;
    ctx.fillStyle = colors.stairWood;
    for (let i = 0; i <= postCount; i++) {
        const postY = stairTop + (i * postSpacing) - 30;
        // Left posts
        ctx.fillRect(x - 6, postY, 4, 30);
        // Right posts
        ctx.fillRect(x + width + 2, postY, 4, 30);
    }

    // Top handrail (horizontal bar at top)
    ctx.fillStyle = colors.railingWood;
    ctx.fillRect(x - 10, stairTop - 45, width + 20, 6);
    // Handrail grain
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(x - 8, stairTop - 43, width + 16, 1);
}

// ============================================
// DRAW STAIRCASE MESH GATE
// Wire mesh safety gate that blocks Luna until she has both toys
// ============================================
function drawGate() {
    // Only draw if gate is closed
    if (gameState.gateOpen) return;

    const x = gate.x;
    const y = gate.y;
    const w = gate.width;
    const h = gate.height;
    const frame = gate.frameThickness;

    // 1. Draw outer frame FIRST (no clipping)
    ctx.fillStyle = gate.frameColor;
    // Top frame
    ctx.fillRect(x, y, w, frame);
    // Bottom frame
    ctx.fillRect(x, y + h - frame, w, frame);
    // Left frame
    ctx.fillRect(x, y, frame, h);
    // Right frame
    ctx.fillRect(x + w - frame, y, frame, h);

    // Inner area for mesh
    const innerX = x + frame;
    const innerY = y + frame;
    const innerW = w - frame * 2;
    const innerH = h - frame * 2;

    // 2. Save context and set clipping region
    ctx.save();
    ctx.beginPath();
    ctx.rect(innerX, innerY, innerW, innerH);
    ctx.clip();

    // 3. Draw diagonal crosshatch mesh pattern (clipped to inner area)
    ctx.strokeStyle = gate.meshColor;
    ctx.lineWidth = 1;

    // Diagonal lines from top-left to bottom-right
    ctx.beginPath();
    for (let offset = -innerH; offset < innerW + innerH; offset += 8) {
        ctx.moveTo(innerX + offset, innerY);
        ctx.lineTo(innerX + offset + innerH, innerY + innerH);
    }
    ctx.stroke();

    // Diagonal lines from top-right to bottom-left
    ctx.beginPath();
    for (let offset = 0; offset < innerW + innerH; offset += 8) {
        ctx.moveTo(innerX + innerW - offset, innerY);
        ctx.lineTo(innerX + innerW - offset - innerH, innerY + innerH);
    }
    ctx.stroke();

    // 4. Restore context (removes clipping)
    ctx.restore();

    // 5. Draw padlock on top (outside clipping region)
    ctx.fillStyle = gate.lockColor;
    ctx.fillRect(x + w - frame - 10, y + h / 2 - 5, 8, 10);
    // Lock shackle
    ctx.strokeStyle = gate.lockColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w - frame - 6, y + h / 2 - 5, 4, Math.PI, 0);
    ctx.stroke();
}

// ============================================
// GATE THOUGHT BUBBLE
// Shows required items (sushi + tennis ball) when gate is closed
// ============================================
function drawGateThoughtBubble() {
    // Only show when gate is closed
    if (gameState.gateOpen) return;

    ctx.save();

    // Gentle float animation
    const floatOffset = Math.sin(Date.now() / 800) * 3;

    // Main bubble position (above and right of gate)
    // Enlarged to fit full-size items
    const bubbleX = 370;
    const bubbleY = 115 + floatOffset;
    const bubbleW = 120;
    const bubbleH = 55;

    // ============================================
    // THOUGHT BUBBLE TRAIL (3 circles leading from gate)
    // ============================================
    ctx.fillStyle = '#fafafa';
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2;

    // Small circle 1 (closest to gate)
    ctx.beginPath();
    ctx.arc(375, 218 + floatOffset, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small circle 2 (middle)
    ctx.beginPath();
    ctx.arc(380, 200 + floatOffset, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small circle 3 (largest, closest to bubble)
    ctx.beginPath();
    ctx.arc(387, 180 + floatOffset, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ============================================
    // MAIN THOUGHT BUBBLE
    // ============================================
    ctx.fillStyle = '#fafafa';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
    ctx.fill();
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ============================================
    // CENTER ITEMS INSIDE BUBBLE
    // Calculate total content width and center horizontally
    // ============================================
    // Sushi dimensions: approximately 24px wide (8 blocks * 3px)
    // Plus symbol: approximately 10px wide
    // Tennis ball: approximately 16px wide (8 blocks * 2px)
    // Gap between items: 8px on each side of plus
    const sushiWidth = 24;
    const plusWidth = 10;
    const ballWidth = 16;
    const gap = 8;
    const totalContentWidth = sushiWidth + gap + plusWidth + gap + ballWidth;
    const contentStartX = bubbleX + (bubbleW - totalContentWidth) / 2;

    // Center vertically (sushi is ~18px tall, ball is ~16px)
    const itemHeight = 18;
    const contentStartY = bubbleY + (bubbleH - itemHeight) / 2;

    // ============================================
    // FULL-SIZE SUSHI (centered left position)
    // ============================================
    drawSushiItem(contentStartX, contentStartY, 1);

    // ============================================
    // "+" SYMBOL (between items, centered)
    // ============================================
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = '#8a8a8a';
    ctx.textAlign = 'center';
    ctx.fillText('+', contentStartX + sushiWidth + gap + plusWidth / 2, bubbleY + bubbleH / 2 + 5);

    // ============================================
    // FULL-SIZE TENNIS BALL (centered right position)
    // Tennis ball draws from center point, so offset by half its size
    // ============================================
    const ballCenterX = contentStartX + sushiWidth + gap + plusWidth + gap + ballWidth / 2;
    const ballCenterY = bubbleY + bubbleH / 2;
    drawTennisBallItem(ballCenterX, ballCenterY, 1);

    ctx.restore();
}

// Draw rooms and doorways (wooden house style)
function drawRooms() {
    // ============================================
    // LEFT ROOM - GIRL'S ROOM
    // ============================================

    // Left room walls (warm beige)
    ctx.fillStyle = rooms.left.wallColor;
    ctx.fillRect(rooms.left.x, rooms.left.y, rooms.left.width, rooms.left.height);

    // Left room interior (very light beige)
    ctx.fillStyle = rooms.left.interiorColor;
    ctx.fillRect(rooms.left.x + 8, rooms.left.y + 8, rooms.left.width - 12, rooms.left.height - 8);

    // Fix wall color above left door (extend interior to door edge)
    // Door is at x=200, doorway starts at y=180, so fill strip from x=188 to x=200, y=108 to y=180
    ctx.fillStyle = rooms.left.interiorColor;
    ctx.fillRect(rooms.left.x + rooms.left.width - 12, rooms.left.y + 8, 8, 72);

    // Wood trim on left room (top and side)
    ctx.fillStyle = colors.floorWood;
    ctx.fillRect(rooms.left.x, rooms.left.y, rooms.left.width, 6);  // Top trim
    ctx.fillRect(rooms.left.x, rooms.left.y, 6, rooms.left.height); // Left trim
    // Trim wood grain
    ctx.fillStyle = colors.floorWoodGrain;
    ctx.fillRect(rooms.left.x, rooms.left.y + 2, rooms.left.width, 1);

    // Draw girl's room furniture
    drawGirlsRoom();

    // ============================================
    // RIGHT ROOM - BOY'S ROOM
    // ============================================

    // Right room walls (warm beige)
    ctx.fillStyle = rooms.right.wallColor;
    ctx.fillRect(rooms.right.x, rooms.right.y, rooms.right.width, rooms.right.height);

    // Right room interior (very light beige)
    ctx.fillStyle = rooms.right.interiorColor;
    ctx.fillRect(rooms.right.x + 4, rooms.right.y + 8, rooms.right.width - 12, rooms.right.height - 8);

    // Fix wall color above right door (extend interior to door edge)
    // Door is at x=600, doorway starts at y=180, so fill strip from x=600 to x=604, y=108 to y=180
    ctx.fillStyle = rooms.right.interiorColor;
    ctx.fillRect(rooms.right.x, rooms.right.y + 8, 4, 72);

    // Wood trim on right room (top and side)
    ctx.fillStyle = colors.floorWood;
    ctx.fillRect(rooms.right.x, rooms.right.y, rooms.right.width, 6);  // Top trim
    ctx.fillRect(rooms.right.x + rooms.right.width - 6, rooms.right.y, 6, rooms.right.height); // Right trim
    // Trim wood grain
    ctx.fillStyle = colors.floorWoodGrain;
    ctx.fillRect(rooms.right.x, rooms.right.y + 2, rooms.right.width, 1);

    // Draw boy's room furniture
    drawBoysRoom();

    // ============================================
    // WALL SEGMENTS ABOVE DOORWAYS
    // These complete the room enclosure above each door
    // ============================================

    // Left room - wall segment above doorway (right edge of left room)
    // From room ceiling (y=100) down to doorway top (y=180)
    ctx.fillStyle = rooms.left.wallColor;
    ctx.fillRect(wallAboveLeftDoor.x, wallAboveLeftDoor.y, wallAboveLeftDoor.width, wallAboveLeftDoor.height);
    // Interior color strip
    ctx.fillStyle = rooms.left.interiorColor;
    ctx.fillRect(wallAboveLeftDoor.x, wallAboveLeftDoor.y + 6, wallAboveLeftDoor.width - 4, wallAboveLeftDoor.height - 6);

    // Right room - wall segment above doorway (left edge of right room)
    // From room ceiling (y=100) down to doorway top (y=180)
    ctx.fillStyle = rooms.right.wallColor;
    ctx.fillRect(wallAboveRightDoor.x, wallAboveRightDoor.y, wallAboveRightDoor.width, wallAboveRightDoor.height);
    // Interior color strip
    ctx.fillStyle = rooms.right.interiorColor;
    ctx.fillRect(wallAboveRightDoor.x + 4, wallAboveRightDoor.y + 6, wallAboveRightDoor.width - 4, wallAboveRightDoor.height - 6);
}

// ============================================
// GIRL'S ROOM FURNITURE (LEFT ROOM)
// Pink theme - girl sits at desk facing LEFT wall
// ============================================
function drawGirlsRoom() {
    const roomX = rooms.left.x;
    const floorY = 280;

    // ----- BED (no outer frame, just mattress/pillow/blanket) -----
    const bedX = roomX + 100;
    const bedY = floorY - 25;
    const bedWidth = 70;
    const bedHeight = 25;

    // Mattress
    ctx.fillStyle = '#f0e6dc';
    ctx.fillRect(bedX, bedY, bedWidth, bedHeight);

    // Pink blanket
    ctx.fillStyle = colors.blanketPink;
    ctx.fillRect(bedX + 5, bedY + 5, bedWidth - 10, bedHeight - 8);

    // Pillow (at left side - headboard side)
    ctx.fillStyle = '#fff8f0';
    ctx.fillRect(bedX + 5, bedY + 2, 18, 10);

    // ----- DESK (against left wall, girl faces left) -----
    const deskX = roomX + 10;
    const deskY = floorY - 28;
    const deskWidth = 35;

    // Desk surface with wood grain
    ctx.fillStyle = colors.desk;
    ctx.fillRect(deskX, deskY, deskWidth, 5);
    ctx.fillStyle = colors.floorWoodGrain;
    ctx.fillRect(deskX + 2, deskY + 2, deskWidth - 4, 1);

    // Desk legs
    ctx.fillStyle = colors.desk;
    ctx.fillRect(deskX + 2, deskY + 5, 4, 23);
    ctx.fillRect(deskX + deskWidth - 6, deskY + 5, 4, 23);

    // Monitor on desk
    ctx.fillStyle = colors.monitor;
    ctx.fillRect(deskX + 8, deskY - 20, 18, 18);

    // Monitor screen
    ctx.fillStyle = colors.monitorScreen;
    ctx.fillRect(deskX + 10, deskY - 18, 14, 13);

    // Monitor stand
    ctx.fillStyle = colors.monitor;
    ctx.fillRect(deskX + 13, deskY - 2, 8, 2);

    // ----- CHAIR (behind desk, girl sits on it) -----
    const chairX = deskX + deskWidth + 5;
    const chairY = floorY - 35;

    // Chair seat
    ctx.fillStyle = colors.chair;
    ctx.fillRect(chairX, chairY + 20, 20, 5);

    // Chair back
    ctx.fillRect(chairX + 15, chairY, 5, 25);

    // Chair legs
    ctx.fillRect(chairX + 2, chairY + 25, 3, 10);
    ctx.fillRect(chairX + 15, chairY + 25, 3, 10);

    // ----- GIRL (seated on chair, facing LEFT) -----
    drawGirlCharacter(chairX + 10, chairY + 18, 'left');
}

// ============================================
// BOY'S ROOM FURNITURE (RIGHT ROOM)
// Blue theme - boy sits at desk facing RIGHT wall
// ============================================
function drawBoysRoom() {
    const roomX = rooms.right.x;
    const floorY = 280;

    // ----- BED (no outer frame, just mattress/pillow/blanket) -----
    const bedX = roomX + 30;
    const bedY = floorY - 25;
    const bedWidth = 70;
    const bedHeight = 25;

    // Mattress
    ctx.fillStyle = '#f0e6dc';
    ctx.fillRect(bedX, bedY, bedWidth, bedHeight);

    // Blue blanket
    ctx.fillStyle = colors.blanketBlue;
    ctx.fillRect(bedX + 5, bedY + 5, bedWidth - 10, bedHeight - 8);

    // Pillow (at right side - headboard side)
    ctx.fillStyle = '#fff8f0';
    ctx.fillRect(bedX + bedWidth - 23, bedY + 2, 18, 10);

    // ----- DESK (against right wall, boy faces right) -----
    const deskX = roomX + 155;
    const deskY = floorY - 28;
    const deskWidth = 35;

    // Desk surface with wood grain
    ctx.fillStyle = colors.desk;
    ctx.fillRect(deskX, deskY, deskWidth, 5);
    ctx.fillStyle = colors.floorWoodGrain;
    ctx.fillRect(deskX + 2, deskY + 2, deskWidth - 4, 1);

    // Desk legs
    ctx.fillStyle = colors.desk;
    ctx.fillRect(deskX + 2, deskY + 5, 4, 23);
    ctx.fillRect(deskX + deskWidth - 6, deskY + 5, 4, 23);

    // Monitor on desk
    ctx.fillStyle = colors.monitor;
    ctx.fillRect(deskX + 9, deskY - 20, 18, 18);

    // Monitor screen
    ctx.fillStyle = colors.monitorScreen;
    ctx.fillRect(deskX + 11, deskY - 18, 14, 13);

    // Monitor stand
    ctx.fillStyle = colors.monitor;
    ctx.fillRect(deskX + 14, deskY - 2, 8, 2);

    // ----- CHAIR (behind desk, boy sits on it) -----
    const chairX = deskX - 25;
    const chairY = floorY - 35;

    // Chair seat
    ctx.fillStyle = colors.chair;
    ctx.fillRect(chairX, chairY + 20, 20, 5);

    // Chair back
    ctx.fillRect(chairX, chairY, 5, 25);

    // Chair legs
    ctx.fillRect(chairX + 2, chairY + 25, 3, 10);
    ctx.fillRect(chairX + 15, chairY + 25, 3, 10);

    // ----- BOY (seated on chair, facing RIGHT) -----
    drawBoyCharacter(chairX + 10, chairY + 18, 'right');
}

// Girl character (seated, facing specified direction)
function drawGirlCharacter(x, y, facing) {
    const facingLeft = facing === 'left';

    // Legs (seated, bent at knee, feet above floor)
    ctx.fillStyle = '#5a4a6a'; // pants color
    ctx.fillRect(x - 6, y, 12, 8);  // upper legs on seat

    // Body (torso)
    ctx.fillStyle = colors.girlShirt;
    ctx.fillRect(x - 7, y - 18, 14, 18);

    // Head (offset toward facing direction)
    const headOffsetX = facingLeft ? -2 : 2;
    ctx.fillStyle = colors.skinTone;
    ctx.beginPath();
    ctx.arc(x + headOffsetX, y - 28, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = colors.girlHair;
    ctx.beginPath();
    ctx.arc(x + headOffsetX, y - 30, 10, Math.PI, 2 * Math.PI);
    ctx.fill();
    // Long hair strands - always fall BEHIND the face
    if (facingLeft) {
        // Facing left: hair flows to the RIGHT (behind the head)
        ctx.fillRect(x + headOffsetX + 4, y - 30, 4, 18);
        ctx.fillRect(x + headOffsetX + 8, y - 28, 4, 14);
    } else {
        // Facing right: hair flows to the LEFT (behind the head)
        ctx.fillRect(x + headOffsetX - 8, y - 30, 4, 18);
        ctx.fillRect(x + headOffsetX - 12, y - 28, 4, 14);
    }

    // Eye (only one visible from side view)
    ctx.fillStyle = '#3a3a3a';
    if (facingLeft) {
        ctx.fillRect(x + headOffsetX - 5, y - 29, 2, 2);
    } else {
        ctx.fillRect(x + headOffsetX + 3, y - 29, 2, 2);
    }

    // Arm reaching toward desk
    ctx.fillStyle = colors.skinTone;
    if (facingLeft) {
        ctx.fillRect(x - 14, y - 12, 8, 4);
    } else {
        ctx.fillRect(x + 6, y - 12, 8, 4);
    }
}

// Boy character (seated, facing specified direction)
function drawBoyCharacter(x, y, facing) {
    const facingRight = facing === 'right';

    // Legs (seated, bent at knee, feet above floor)
    ctx.fillStyle = '#4a5a6a'; // pants color
    ctx.fillRect(x - 6, y, 12, 8);  // upper legs on seat

    // Body (torso)
    ctx.fillStyle = colors.boyShirt;
    ctx.fillRect(x - 7, y - 18, 14, 18);

    // Head (offset toward facing direction)
    const headOffsetX = facingRight ? 2 : -2;
    ctx.fillStyle = colors.skinTone;
    ctx.beginPath();
    ctx.arc(x + headOffsetX, y - 28, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair (short, spiky)
    ctx.fillStyle = colors.boyHair;
    ctx.beginPath();
    ctx.arc(x + headOffsetX, y - 30, 9, Math.PI, 2 * Math.PI);
    ctx.fill();
    // Spiky top
    ctx.fillRect(x + headOffsetX - 6, y - 38, 3, 5);
    ctx.fillRect(x + headOffsetX - 1, y - 40, 3, 7);
    ctx.fillRect(x + headOffsetX + 4, y - 38, 3, 5);

    // Eye (only one visible from side view)
    ctx.fillStyle = '#3a3a3a';
    if (facingRight) {
        ctx.fillRect(x + headOffsetX + 3, y - 29, 2, 2);
    } else {
        ctx.fillRect(x + headOffsetX - 5, y - 29, 2, 2);
    }

    // Arm reaching toward desk
    ctx.fillStyle = colors.skinTone;
    if (facingRight) {
        ctx.fillRect(x + 6, y - 12, 8, 4);
    } else {
        ctx.fillRect(x - 14, y - 12, 8, 4);
    }
}

// ============================================
// DRAW DOOR - 2D FORESHORTENING WITH WOOD GRAIN
//
// In 2D side-view, door rotation is shown as width change:
// - Closed (angle=0): only thin edge visible
// - Opening: door face progressively reveals with wood grain
// - visibleWidth = doorWidth * sin(|angle|)
// ============================================
function drawDoor(door, side) {
    const doorTop = door.hingeY - door.height / 2;
    const absAngle = Math.abs(door.angle);

    // Calculate visible width using foreshortening
    const visibleWidth = door.width * Math.sin(absAngle);

    // Always draw the thin hinge edge first
    ctx.fillStyle = colors.doorWood;
    if (side === 'left') {
        ctx.fillRect(door.hingeX, doorTop, door.thickness, door.height);
    } else {
        ctx.fillRect(door.hingeX - door.thickness, doorTop, door.thickness, door.height);
    }

    // If door is opening, draw the visible door face
    if (visibleWidth > 1) {
        const doorX = side === 'left' ? door.hingeX - visibleWidth : door.hingeX;

        // Door face (wood color)
        ctx.fillStyle = colors.doorWood;
        ctx.fillRect(doorX, doorTop, visibleWidth, door.height);

        // Wood grain lines (horizontal, subtle)
        if (visibleWidth > 4) {
            ctx.fillStyle = colors.doorWoodGrain;
            for (let gy = doorTop + 8; gy < doorTop + door.height; gy += 12) {
                ctx.fillRect(doorX + 2, gy, visibleWidth - 4, 1);
            }
        }

        // Panel details (scaled by foreshortening)
        if (visibleWidth > 8) {
            ctx.fillStyle = colors.doorWoodDark;
            const panelInset = 4 * (visibleWidth / door.width);
            const panelWidth = visibleWidth - (panelInset * 2);
            if (panelWidth > 2) {
                // Upper panel
                ctx.fillRect(doorX + panelInset, doorTop + 15, panelWidth, 30);
                // Lower panel
                ctx.fillRect(doorX + panelInset, doorTop + 55, panelWidth, 30);

                // Panel grain (lighter lines inside panels)
                if (panelWidth > 6) {
                    ctx.fillStyle = colors.doorWoodGrain;
                    ctx.fillRect(doorX + panelInset + 2, doorTop + 25, panelWidth - 4, 1);
                    ctx.fillRect(doorX + panelInset + 2, doorTop + 35, panelWidth - 4, 1);
                    ctx.fillRect(doorX + panelInset + 2, doorTop + 65, panelWidth - 4, 1);
                    ctx.fillRect(doorX + panelInset + 2, doorTop + 75, panelWidth - 4, 1);
                }
            }

            // Door handle on free edge
            ctx.fillStyle = '#d4b070';
            if (side === 'left') {
                ctx.fillRect(doorX + 2, doorTop + 45, 4, 10);
            } else {
                ctx.fillRect(doorX + visibleWidth - 6, doorTop + 45, 4, 10);
            }
            // Handle highlight
            ctx.fillStyle = '#e8c888';
            if (side === 'left') {
                ctx.fillRect(doorX + 3, doorTop + 46, 2, 3);
            } else {
                ctx.fillRect(doorX + visibleWidth - 5, doorTop + 46, 2, 3);
            }
        }

        // Edge highlight on door face
        ctx.fillStyle = '#d8b888';
        ctx.fillRect(doorX, doorTop, visibleWidth, 2);
    }
}

// ============================================
// DRAW DOORS
// Uses the reusable drawDoor function for each door
// ============================================
function drawDoors() {
    // Door frames (fixed, do not rotate)
    ctx.fillStyle = colors.floorWood;
    ctx.fillRect(doors.left.hingeX - 2, doors.left.hingeY - doors.left.height / 2 - 5, 4, doors.left.height + 10);
    ctx.fillRect(doors.right.hingeX - 2, doors.right.hingeY - doors.right.height / 2 - 5, 4, doors.right.height + 10);

    // Draw doors
    drawDoor(doors.left, 'left');
    drawDoor(doors.right, 'right');

    // Draw padlock on girl's door (only when locked)
    drawDoorPadlock();
}

// ============================================
// GIRL'S DOOR PADLOCK
// Small padlock on the outside of the left room door
// ============================================
function drawDoorPadlock() {
    // Only show when door is locked
    if (gameState.leftRoomUnlocked) return;

    ctx.save();

    // Padlock position - outside the door (right side), at knob height
    const lockX = 205;
    const lockY = 225;
    const bodyW = 10;
    const bodyH = 10;

    // Lock body (gold/brass)
    ctx.fillStyle = '#c8a84a';
    ctx.beginPath();
    ctx.roundRect(lockX, lockY, bodyW, bodyH, 2);
    ctx.fill();

    // Lock body shadow/detail
    ctx.fillStyle = '#a08030';
    ctx.fillRect(lockX + 1, lockY + bodyH - 3, bodyW - 2, 2);

    // Lock shackle (U-shaped bar on top)
    ctx.strokeStyle = '#a08030';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lockX + bodyW / 2, lockY, 4, Math.PI, 0);
    ctx.stroke();

    // Keyhole
    ctx.fillStyle = '#5a4a30';
    ctx.beginPath();
    ctx.arc(lockX + bodyW / 2, lockY + bodyH / 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(lockX + bodyW / 2 - 1, lockY + bodyH / 2, 2, 3);

    ctx.restore();
}

// ============================================
// GIRL'S DOOR THOUGHT BUBBLE
// Shows envelope is required to unlock the door
// ============================================
function drawDoorThoughtBubble() {
    // Only show when: gate is open, left room still locked, and not dismissed
    if (!gameState.gateOpen || gameState.leftRoomUnlocked || gameState.doorThoughtBubbleDismissed) {
        return;
    }

    ctx.save();

    // Gentle float animation
    const floatOffset = Math.sin(Date.now() / 800) * 3;

    // Main bubble position (above and to the right of door)
    const bubbleX = 215;
    const bubbleY = 140 + floatOffset;
    const bubbleW = 50;
    const bubbleH = 40;

    // ============================================
    // THOUGHT BUBBLE TRAIL (3 circles from padlock to bubble)
    // ============================================
    ctx.fillStyle = '#fafafa';
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2;

    // Circle 1 (smallest, closest to door/padlock)
    ctx.beginPath();
    ctx.arc(208, 215 + floatOffset, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circle 2 (medium)
    ctx.beginPath();
    ctx.arc(212, 195 + floatOffset, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circle 3 (larger, closest to bubble)
    ctx.beginPath();
    ctx.arc(218, 172 + floatOffset, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ============================================
    // MAIN THOUGHT BUBBLE
    // ============================================
    ctx.fillStyle = '#fafafa';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 10);
    ctx.fill();
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ============================================
    // ENVELOPE INSIDE BUBBLE (centered)
    // ============================================
    // Envelope dimensions (from envelope object): width=35, height=22
    const envW = 28;  // Slightly smaller to fit in bubble
    const envH = 18;
    const envX = bubbleX + (bubbleW - envW) / 2;
    const envY = bubbleY + (bubbleH - envH) / 2;

    // Draw mini envelope
    // Envelope body
    ctx.fillStyle = '#f5e6d3';
    ctx.fillRect(envX, envY, envW, envH);

    // Envelope flap
    ctx.fillStyle = '#e8d5c0';
    ctx.beginPath();
    ctx.moveTo(envX, envY);
    ctx.lineTo(envX + envW / 2, envY + 8);
    ctx.lineTo(envX + envW, envY);
    ctx.closePath();
    ctx.fill();

    // Heart seal
    drawHeart(envX + envW / 2, envY + 5, 8, '#c0253a');

    ctx.restore();
}

// ============================================
// CHECK IF LUNA IS AT GIRL'S DOOR
// Used to dismiss the thought bubble
// ============================================
function checkDoorThoughtBubbleDismiss() {
    // Check if Luna is touching the girl's door area while carrying envelope
    if (gameState.hasEnvelope &&
        player.x < 215 &&
        player.x + player.width > 190 &&
        player.y < 280 &&
        player.y + player.height > 180) {
        gameState.doorThoughtBubbleDismissed = true;
    }
}

// ============================================
// BOY SNEEZE INTERACTION
// Boy sneezes "Achoo!" when Luna touches him
// ============================================

// Check if Luna is touching the boy character
function lunaContactBoy() {
    // Only check if Luna is on the second floor (in right room area)
    if (player.y > 280) return false;  // Luna is below second floor

    return player.x < boyContactZone.x + boyContactZone.width &&
           player.x + player.width > boyContactZone.x &&
           player.y < boyContactZone.y + boyContactZone.height &&
           player.y + player.height > boyContactZone.y;
}

// Update sneeze state each frame
function updateBoySneezeState() {
    const wasSneezing = gameState.boySneeze;
    gameState.boySneeze = lunaContactBoy();

    // Reset timer when contact starts
    if (gameState.boySneeze && !wasSneezing) {
        gameState.sneezeTimer = 0;
    }

    // Increment timer while sneezing
    if (gameState.boySneeze) {
        gameState.sneezeTimer++;
    } else {
        gameState.sneezeTimer = 0;
    }
}

// Draw the "Achoo!" text above the boy's head
function drawBoySneeze() {
    if (!gameState.boySneeze) return;

    ctx.save();

    // Boy's head center position (from drawBoysRoom calculations)
    // chairX = roomX + 155 - 25 = 600 + 130 = 730
    // Boy drawn at chairX + 10 = 740
    const boyHeadX = 745;
    const textY = 205;  // Below envelope (at ~175), above boy's head (~220)

    // Font size with pop effect for first 10 frames
    const fontSize = gameState.sneezeTimer < 10 ? 15 : 13;

    // Draw motion lines FIRST (behind text)
    ctx.strokeStyle = '#8a8aaa';
    ctx.lineWidth = 1;

    // Motion lines radiating from text
    // Top-left line
    ctx.beginPath();
    ctx.moveTo(boyHeadX - 25, textY - 12);
    ctx.lineTo(boyHeadX - 32, textY - 18);
    ctx.stroke();

    // Top-right line
    ctx.beginPath();
    ctx.moveTo(boyHeadX + 25, textY - 12);
    ctx.lineTo(boyHeadX + 32, textY - 18);
    ctx.stroke();

    // Top center line
    ctx.beginPath();
    ctx.moveTo(boyHeadX, textY - 15);
    ctx.lineTo(boyHeadX, textY - 23);
    ctx.stroke();

    // Small diagonal lines
    ctx.beginPath();
    ctx.moveTo(boyHeadX - 18, textY - 8);
    ctx.lineTo(boyHeadX - 24, textY - 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boyHeadX + 18, textY - 8);
    ctx.lineTo(boyHeadX + 24, textY - 12);
    ctx.stroke();

    // Draw "Achoo!" text
    ctx.font = `italic bold ${fontSize}px Georgia, serif`;
    ctx.fillStyle = '#3a3a5a';
    ctx.textAlign = 'center';
    ctx.fillText('Achoo!', boyHeadX, textY);

    ctx.restore();
    ctx.textAlign = 'left';
}

// ============================================
// COLLECTIBLE DRAWING FUNCTIONS
// ============================================

// Draw envelope (in world or in inventory slot)
function drawEnvelopeItem(x, y, scale = 1) {
    ctx.save();
    const w = envelope.width * scale;
    const h = envelope.height * scale;

    // ============================================
    // ENVELOPE BODY - cream/white
    // ============================================
    ctx.fillStyle = '#f5e6d3';
    ctx.fillRect(x, y, w, h);

    // ============================================
    // ENVELOPE FLAP - slightly darker triangle
    // ============================================
    ctx.fillStyle = '#e8d5c0';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + 12 * scale);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();

    // Flap crease line for definition
    ctx.strokeStyle = '#d4c4a8';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x + 2 * scale, y + 1 * scale);
    ctx.lineTo(x + w / 2, y + 10 * scale);
    ctx.lineTo(x + w - 2 * scale, y + 1 * scale);
    ctx.stroke();

    // ============================================
    // WAX SEAL - heart stamp centered on flap point
    // Using drawHeart() helper function
    // ============================================
    const sealCenterX = x + w / 2;
    const sealCenterY = y + 12 * scale;
    const heartSize = 12 * scale;

    // Draw the heart using the helper function
    // Heart draws from top-center, so offset Y slightly
    drawHeart(sealCenterX, sealCenterY - heartSize * 0.5, heartSize, '#c0253a');

    ctx.restore();
}

// Draw envelope in the game world
function drawEnvelope() {
    if (!envelope.collected) {
        ctx.save();
        // Floating animation
        const floatOffset = Math.sin(animationTime * 3) * 3;
        const drawX = envelope.x;
        const drawY = envelope.y + floatOffset;
        const scale = envelope.scale || 1;

        // Draw the envelope at 75% scale
        drawEnvelopeItem(drawX, drawY, scale);

        // ============================================
        // SPARKLE EFFECT around envelope
        // ============================================
        const sparkleTime = Date.now() / 200;
        const sparkleColors = ['#fff8dc', '#ffe4b5', '#ffd700', '#ffec8b'];

        // Draw 4 sparkles around the envelope
        for (let i = 0; i < 4; i++) {
            const angle = (sparkleTime + i * Math.PI / 2) % (Math.PI * 2);
            const radius = 18 + Math.sin(sparkleTime * 2 + i) * 4;
            const sparkleX = drawX + (envelope.width * scale) / 2 + Math.cos(angle) * radius;
            const sparkleY = drawY + (envelope.height * scale) / 2 + Math.sin(angle) * radius;
            const sparkleSize = 2 + Math.sin(sparkleTime * 3 + i * 1.5) * 1.5;
            const alpha = 0.5 + Math.sin(sparkleTime * 2.5 + i) * 0.3;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = sparkleColors[i % sparkleColors.length];

            // Draw 4-point star sparkle
            ctx.beginPath();
            ctx.moveTo(sparkleX, sparkleY - sparkleSize);
            ctx.lineTo(sparkleX + sparkleSize * 0.3, sparkleY);
            ctx.lineTo(sparkleX + sparkleSize, sparkleY);
            ctx.lineTo(sparkleX + sparkleSize * 0.3, sparkleY);
            ctx.lineTo(sparkleX, sparkleY + sparkleSize);
            ctx.lineTo(sparkleX - sparkleSize * 0.3, sparkleY);
            ctx.lineTo(sparkleX - sparkleSize, sparkleY);
            ctx.lineTo(sparkleX - sparkleSize * 0.3, sparkleY);
            ctx.closePath();
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Draw sushi (in world or in inventory slot) - PIXEL ART VERSION
function drawSushiItem(x, y, scale = 1) {
    ctx.save();

    // Pixel size (scales with inventory)
    const px = Math.round(3 * scale);

    // Colors
    const shrimpMain = '#f07040';      // Bright coral orange
    const shrimpDark = '#d05020';      // Darker orange edge
    const shrimpLight = '#f89060';     // Lighter highlight
    const shrimpTail = '#c04020';      // Dark orange tail
    const riceMain = '#f0ede0';        // Off-white rice
    const riceGrain = '#e0ddd0';       // Grain texture

    // Center the sushi
    const offsetX = x;
    const offsetY = y;

    // ============================================
    // SHRIMP TOP (larger portion, mound shape)
    // Row 0 - top highlight
    // ============================================
    drawPixel(offsetX + px * 2, offsetY, shrimpLight, px);
    drawPixel(offsetX + px * 3, offsetY, shrimpLight, px);
    drawPixel(offsetX + px * 4, offsetY, shrimpLight, px);
    drawPixel(offsetX + px * 5, offsetY, shrimpLight, px);

    // Row 1 - main shrimp body
    drawPixel(offsetX + px * 1, offsetY + px, shrimpMain, px);
    drawPixel(offsetX + px * 2, offsetY + px, shrimpMain, px);
    drawPixel(offsetX + px * 3, offsetY + px, shrimpMain, px);
    drawPixel(offsetX + px * 4, offsetY + px, shrimpMain, px);
    drawPixel(offsetX + px * 5, offsetY + px, shrimpMain, px);
    drawPixel(offsetX + px * 6, offsetY + px, shrimpMain, px);
    drawPixel(offsetX + px * 7, offsetY + px, shrimpTail, px); // tail start

    // Row 2 - main shrimp body with tail
    drawPixel(offsetX + px * 0, offsetY + px * 2, shrimpMain, px);
    drawPixel(offsetX + px * 1, offsetY + px * 2, shrimpMain, px);
    drawPixel(offsetX + px * 2, offsetY + px * 2, shrimpMain, px);
    drawPixel(offsetX + px * 3, offsetY + px * 2, shrimpMain, px);
    drawPixel(offsetX + px * 4, offsetY + px * 2, shrimpMain, px);
    drawPixel(offsetX + px * 5, offsetY + px * 2, shrimpMain, px);
    drawPixel(offsetX + px * 6, offsetY + px * 2, shrimpTail, px);
    drawPixel(offsetX + px * 7, offsetY + px * 2, shrimpTail, px);

    // Row 3 - bottom of shrimp with dark edges
    drawPixel(offsetX + px * 0, offsetY + px * 3, shrimpDark, px);
    drawPixel(offsetX + px * 1, offsetY + px * 3, shrimpMain, px);
    drawPixel(offsetX + px * 2, offsetY + px * 3, shrimpMain, px);
    drawPixel(offsetX + px * 3, offsetY + px * 3, shrimpMain, px);
    drawPixel(offsetX + px * 4, offsetY + px * 3, shrimpMain, px);
    drawPixel(offsetX + px * 5, offsetY + px * 3, shrimpMain, px);
    drawPixel(offsetX + px * 6, offsetY + px * 3, shrimpDark, px);

    // ============================================
    // RICE BASE (bottom portion)
    // ============================================
    // Row 4 - rice top
    drawPixel(offsetX + px * 1, offsetY + px * 4, riceMain, px);
    drawPixel(offsetX + px * 2, offsetY + px * 4, riceMain, px);
    drawPixel(offsetX + px * 3, offsetY + px * 4, riceGrain, px);
    drawPixel(offsetX + px * 4, offsetY + px * 4, riceMain, px);
    drawPixel(offsetX + px * 5, offsetY + px * 4, riceMain, px);

    // Row 5 - rice bottom
    drawPixel(offsetX + px * 1, offsetY + px * 5, riceMain, px);
    drawPixel(offsetX + px * 2, offsetY + px * 5, riceGrain, px);
    drawPixel(offsetX + px * 3, offsetY + px * 5, riceMain, px);
    drawPixel(offsetX + px * 4, offsetY + px * 5, riceGrain, px);
    drawPixel(offsetX + px * 5, offsetY + px * 5, riceMain, px);

    ctx.restore();
}

// Draw sushi in the game world
function drawSushi() {
    if (!sushi.collected) {
        ctx.save();
        // Floating animation
        const floatOffset = Math.sin(animationTime * 3 + 1) * 2;
        const drawY = sushi.y + floatOffset;

        drawSushiItem(sushi.x, drawY);
        ctx.restore();
    }
}

// Draw tennis ball (in world or in inventory slot) - PIXEL ART VERSION
function drawTennisBallItem(x, y, scale = 1) {
    ctx.save();

    // Pixel size (scales with inventory, smaller pixels for ball)
    const px = Math.round(2 * scale);

    // Colors
    const yellow = '#e8d040';           // Main yellow
    const yellowDark = '#c8b020';       // Darker yellow
    const black = '#1a1a1a';            // Black outline
    const white = '#f8f8f8';            // White seam
    const highlight = '#ffffff';        // Highlight

    // Center the ball (x,y is center point)
    const offsetX = x - px * 4;
    const offsetY = y - px * 4;

    // ============================================
    // BUILD PIXEL CIRCLE WITH BLACK OUTLINE
    // Approximate 8x8 pixel circle
    // ============================================

    // Row 0 - top edge (black outline only)
    drawPixel(offsetX + px * 2, offsetY, black, px);
    drawPixel(offsetX + px * 3, offsetY, black, px);
    drawPixel(offsetX + px * 4, offsetY, black, px);
    drawPixel(offsetX + px * 5, offsetY, black, px);

    // Row 1
    drawPixel(offsetX + px * 1, offsetY + px, black, px);
    drawPixel(offsetX + px * 2, offsetY + px, highlight, px);  // highlight
    drawPixel(offsetX + px * 3, offsetY + px, highlight, px);  // highlight
    drawPixel(offsetX + px * 4, offsetY + px, white, px);      // seam
    drawPixel(offsetX + px * 5, offsetY + px, yellow, px);
    drawPixel(offsetX + px * 6, offsetY + px, black, px);

    // Row 2
    drawPixel(offsetX + px * 0, offsetY + px * 2, black, px);
    drawPixel(offsetX + px * 1, offsetY + px * 2, yellow, px);
    drawPixel(offsetX + px * 2, offsetY + px * 2, yellow, px);
    drawPixel(offsetX + px * 3, offsetY + px * 2, white, px);  // seam
    drawPixel(offsetX + px * 4, offsetY + px * 2, white, px);  // seam
    drawPixel(offsetX + px * 5, offsetY + px * 2, yellow, px);
    drawPixel(offsetX + px * 6, offsetY + px * 2, yellow, px);
    drawPixel(offsetX + px * 7, offsetY + px * 2, black, px);

    // Row 3
    drawPixel(offsetX + px * 0, offsetY + px * 3, black, px);
    drawPixel(offsetX + px * 1, offsetY + px * 3, yellow, px);
    drawPixel(offsetX + px * 2, offsetY + px * 3, yellow, px);
    drawPixel(offsetX + px * 3, offsetY + px * 3, yellow, px);
    drawPixel(offsetX + px * 4, offsetY + px * 3, white, px);  // seam
    drawPixel(offsetX + px * 5, offsetY + px * 3, white, px);  // seam
    drawPixel(offsetX + px * 6, offsetY + px * 3, yellow, px);
    drawPixel(offsetX + px * 7, offsetY + px * 3, black, px);

    // Row 4
    drawPixel(offsetX + px * 0, offsetY + px * 4, black, px);
    drawPixel(offsetX + px * 1, offsetY + px * 4, yellowDark, px);
    drawPixel(offsetX + px * 2, offsetY + px * 4, yellow, px);
    drawPixel(offsetX + px * 3, offsetY + px * 4, yellow, px);
    drawPixel(offsetX + px * 4, offsetY + px * 4, yellow, px);
    drawPixel(offsetX + px * 5, offsetY + px * 4, white, px);  // seam
    drawPixel(offsetX + px * 6, offsetY + px * 4, yellowDark, px);
    drawPixel(offsetX + px * 7, offsetY + px * 4, black, px);

    // Row 5
    drawPixel(offsetX + px * 0, offsetY + px * 5, black, px);
    drawPixel(offsetX + px * 1, offsetY + px * 5, yellowDark, px);
    drawPixel(offsetX + px * 2, offsetY + px * 5, yellowDark, px);
    drawPixel(offsetX + px * 3, offsetY + px * 5, white, px);  // seam
    drawPixel(offsetX + px * 4, offsetY + px * 5, white, px);  // seam
    drawPixel(offsetX + px * 5, offsetY + px * 5, yellowDark, px);
    drawPixel(offsetX + px * 6, offsetY + px * 5, yellowDark, px);
    drawPixel(offsetX + px * 7, offsetY + px * 5, black, px);

    // Row 6
    drawPixel(offsetX + px * 1, offsetY + px * 6, black, px);
    drawPixel(offsetX + px * 2, offsetY + px * 6, yellowDark, px);
    drawPixel(offsetX + px * 3, offsetY + px * 6, white, px);  // seam
    drawPixel(offsetX + px * 4, offsetY + px * 6, yellowDark, px);
    drawPixel(offsetX + px * 5, offsetY + px * 6, yellowDark, px);
    drawPixel(offsetX + px * 6, offsetY + px * 6, black, px);

    // Row 7 - bottom edge (black outline only)
    drawPixel(offsetX + px * 2, offsetY + px * 7, black, px);
    drawPixel(offsetX + px * 3, offsetY + px * 7, black, px);
    drawPixel(offsetX + px * 4, offsetY + px * 7, black, px);
    drawPixel(offsetX + px * 5, offsetY + px * 7, black, px);

    ctx.restore();
}

// Draw tennis ball in the game world
function drawTennisBall() {
    if (!tennisBall.collected) {
        ctx.save();
        // Floating animation
        const floatOffset = Math.sin(animationTime * 3 + 2) * 2;
        const drawY = tennisBall.y + floatOffset;

        drawTennisBallItem(tennisBall.x, drawY);
        ctx.restore();
    }
}

// ============================================
// INVENTORY SYSTEM
// Draw item slots and collected items
// ============================================
function drawItemSlots() {
    for (let i = 0; i < inventorySlots.count; i++) {
        const slotX = inventorySlots.startX + i * (inventorySlots.slotSize + inventorySlots.spacing);
        const slotY = inventorySlots.startY;

        // Slot background
        ctx.fillStyle = inventorySlots.fillColor;
        ctx.fillRect(slotX, slotY, inventorySlots.slotSize, inventorySlots.slotSize);

        // Slot border
        ctx.strokeStyle = inventorySlots.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(slotX, slotY, inventorySlots.slotSize, inventorySlots.slotSize);

        // Slot number (small, in corner)
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px Arial';
        ctx.fillText((i + 1).toString(), slotX + 3, slotY + 12);
    }

    // Draw collected items in their slots
    const slotCenterOffset = inventorySlots.slotSize / 2;

    // Slot 1: Sushi (pixel art - uses 2px pixels for inventory)
    if (gameState.hasSushi) {
        const slotX = inventorySlots.startX;
        const slotY = inventorySlots.startY;
        // Center the pixel sushi in slot
        drawSushiItem(slotX + 8, slotY + 10, 0.7);
    }

    // Slot 2: Tennis Ball (pixel art - draws from center point)
    if (gameState.hasTennisBall) {
        const slotX = inventorySlots.startX + (inventorySlots.slotSize + inventorySlots.spacing);
        const slotY = inventorySlots.startY;
        drawTennisBallItem(slotX + slotCenterOffset, slotY + slotCenterOffset, 1.2);
    }

    // Slot 3: Envelope (with heart seal)
    if (gameState.hasEnvelope) {
        const slotX = inventorySlots.startX + 2 * (inventorySlots.slotSize + inventorySlots.spacing);
        const slotY = inventorySlots.startY;
        drawEnvelopeItem(slotX + 4, slotY + 8, 0.75);
    }
}

// Draw UI elements
function drawUI() {
    // Draw inventory slots first
    drawItemSlots();

    // Game instructions/status text (darker color for light background)
    ctx.fillStyle = '#5a4a3a';
    ctx.font = '14px Arial';

    let message = '';

    // Stage 3: Letter delivered - game complete
    if (gameState.valentineDelivered) {
        message = 'Explore freely!';
    }
    // Stage 2: Gate open, need to deliver letter
    else if (gameState.gateOpen) {
        const letterCount = gameState.hasEnvelope ? 1 : 0;
        message = `Help deliver the letter! (${letterCount}/1 items)`;
    }
    // Stage 1: Gate locked - need toys
    else {
        const gateItems = (gameState.hasSushi ? 1 : 0) + (gameState.hasTennisBall ? 1 : 0);
        if (gateItems < 2) {
            message = `Collect the sushi and ball to open the gate! (${gateItems}/2 items)`;
        } else {
            message = 'Bring the toys to the gate! (2/2 items)';
        }
    }

    if (message) {
        ctx.fillText(message, 10, 30);
    }

    // Show climbing indicator
    if (player.isClimbing) {
        ctx.fillText('Climbing...', 10, 50);
    }
}

// ============================================
// TITLE SCREEN
// ============================================

// Helper function to draw a heart shape
function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    // Heart using bezier curves
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    ctx.fill();
    ctx.restore();
}

// Draw the title screen
function drawTitleScreen() {
    // Increment title animation counter
    titleFrameCount++;

    // ============================================
    // GRADIENT BACKGROUND
    // ============================================
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f5ede0');
    gradient.addColorStop(1, '#e8d5b8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ============================================
    // DECORATIVE BORDER
    // ============================================
    ctx.strokeStyle = '#c0394b';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Corner hearts
    const cornerSize = 16;
    drawHeart(20, 8, cornerSize, '#c0394b');
    drawHeart(canvas.width - 20, 8, cornerSize, '#c0394b');
    drawHeart(20, canvas.height - 28, cornerSize, '#c0394b');
    drawHeart(canvas.width - 20, canvas.height - 28, cornerSize, '#c0394b');

    // ============================================
    // FLOATING DECORATIVE HEARTS
    // ============================================
    const heartPositions = [
        { x: 120, y: 100, size: 12, color: '#e8728a', offset: 0 },
        { x: 680, y: 110, size: 10, color: '#c0394b', offset: 1 },
        { x: 180, y: 160, size: 8, color: '#f0a0b0', offset: 2 },
        { x: 620, y: 155, size: 14, color: '#e8728a', offset: 3 },
        { x: 100, y: 200, size: 10, color: '#c0394b', offset: 4 },
        { x: 700, y: 190, size: 8, color: '#f0a0b0', offset: 5 },
        { x: 250, y: 90, size: 8, color: '#c0394b', offset: 6 },
        { x: 550, y: 95, size: 10, color: '#e8728a', offset: 7 }
    ];

    heartPositions.forEach(heart => {
        const floatOffset = Math.sin((titleFrameCount * 0.03) + heart.offset) * 4;
        drawHeart(heart.x, heart.y + floatOffset, heart.size, heart.color);
    });

    // ============================================
    // TITLE TEXT - "Luna's V-day Adventure"
    // ============================================
    ctx.font = 'bold 42px Georgia, serif';
    ctx.textAlign = 'center';

    // Shadow
    ctx.fillStyle = '#8a1a2a';
    ctx.fillText("Luna's V-day Adventure", canvas.width / 2 + 3, 143);

    // Main title
    ctx.fillStyle = '#c0394b';
    ctx.fillText("Luna's V-day Adventure", canvas.width / 2, 140);

    // ============================================
    // DESCRIPTION TEXT
    // ============================================
    ctx.font = '20px Georgia, serif';
    ctx.fillStyle = '#8a5a3a';

    // Draw small hearts as bookends
    drawHeart(canvas.width / 2 - 180, 195, 10, '#e8728a');
    ctx.fillText("Help Dru deliver his V-day invite to Emi!", canvas.width / 2, 210);
    drawHeart(canvas.width / 2 + 170, 195, 10, '#e8728a');

    // ============================================
    // LUNA CHARACTER DISPLAY (pixel art, scaled up)
    // ============================================
    ctx.save();
    const lunaX = 335;
    const lunaY = 270;
    const P = 6; // larger pixel size for title screen
    const c = lunaColors;

    // Helper for title screen pixels
    const tpx = (col, row, color) => drawPixel(lunaX + col * P, lunaY + row * P, color, P);

    // ============================================
    // TAIL (curves around right side)
    // ============================================
    tpx(9, 7, c.body);
    tpx(9, 6, c.body);
    tpx(10, 5, c.body);
    tpx(10, 4, c.points);
    tpx(10, 3, c.points);

    // ============================================
    // BODY (cream, 8 blocks wide)
    // ============================================
    for (let row = 6; row < 11; row++) {
        for (let col = 1; col < 9; col++) {
            tpx(col, row, c.body);
        }
    }

    // ============================================
    // PAWS (dark brown)
    // ============================================
    tpx(2, 11, c.points);
    tpx(3, 11, c.points);
    tpx(6, 11, c.points);
    tpx(7, 11, c.points);

    // ============================================
    // HEAD (cream base)
    // ============================================
    for (let col = 2; col < 8; col++) {
        tpx(col, 1, c.body);
    }
    for (let row = 2; row < 6; row++) {
        for (let col = 1; col < 9; col++) {
            tpx(col, row, c.body);
        }
    }

    // ============================================
    // EARS (dark brown)
    // ============================================
    tpx(1, 1, c.points);
    tpx(1, 0, c.points);
    tpx(2, 0, c.points);
    tpx(8, 1, c.points);
    tpx(8, 0, c.points);
    tpx(7, 0, c.points);

    // ============================================
    // FACE MASK (dark brown - rows 2-4, cols 2-7)
    // ============================================
    for (let row = 2; row < 5; row++) {
        for (let col = 2; col < 8; col++) {
            tpx(col, row, c.points);
        }
    }

    // ============================================
    // EYES (2x2 each with gap, pupils)
    // Left eye: cols 2-3, Right eye: cols 6-7
    // ============================================
    tpx(2, 2, c.eye);
    tpx(3, 2, c.eye);
    tpx(2, 3, c.eye);
    tpx(3, 3, c.eye);
    tpx(3, 3, '#1a1a1a'); // pupil

    tpx(6, 2, c.eye);
    tpx(7, 2, c.eye);
    tpx(6, 3, c.eye);
    tpx(7, 3, c.eye);
    tpx(6, 3, '#1a1a1a'); // pupil

    // ============================================
    // SNOUT/NOSE (black, 2 blocks wide centered)
    // ============================================
    tpx(4, 4, '#1a1a1a');
    tpx(5, 4, '#1a1a1a');

    // ============================================
    // MUZZLE (cream)
    // ============================================
    tpx(3, 5, c.body);
    tpx(4, 5, c.body);
    tpx(5, 5, c.body);
    tpx(6, 5, c.body);

    ctx.restore();

    // Heart floating above Luna's head
    const heartFloat = Math.sin(titleFrameCount * 0.05) * 5;
    drawHeart(canvas.width / 2 + 5, 260 + heartFloat, 18, '#c0394b');

    // ============================================
    // CONTROLS PANEL (4 lines)
    // ============================================
    const panelX = (canvas.width - 340) / 2;
    const panelY = 420;
    const panelW = 340;
    const panelH = 105;

    // Panel background
    ctx.fillStyle = '#fdf5ec';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 8);
    ctx.fill();

    // Panel border
    ctx.strokeStyle = '#d4b896';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Controls text (4 lines evenly spaced)
    ctx.font = '15px Arial, sans-serif';
    ctx.fillStyle = '#6a4a2a';
    ctx.textAlign = 'center';
    ctx.fillText('Arrow Keys: Move', canvas.width / 2, panelY + 20);
    ctx.fillText('Space: Jump', canvas.width / 2, panelY + 42);
    ctx.fillText('Up Arrow: Enter Yoda Bed', canvas.width / 2, panelY + 64);
    ctx.fillText('Up / Down Arrow: Climb Stairs', canvas.width / 2, panelY + 86);

    // ============================================
    // START PROMPT (pulsing)
    // ============================================
    const pulseOpacity = 0.5 + Math.sin(titleFrameCount * 0.1) * 0.5;
    ctx.globalAlpha = pulseOpacity;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillStyle = '#c0394b';
    ctx.fillText('Press any key to start!', canvas.width / 2, 560);
    ctx.globalAlpha = 1.0;

    // Reset text alignment
    ctx.textAlign = 'left';
}

// ============================================
// ENDING SEQUENCE - LETTER POPUP SYSTEM
// ============================================

// Letter popup button definitions
const letterButtons = {
    yes: { x: 260, y: 355, width: 90, height: 44 },
    no: { x: 380, y: 355, width: 90, height: 44 },
    close: { x: 330, y: 420, width: 80, height: 36 }
};

// Check if Luna should deliver the letter (trigger ending)
function checkLetterDelivery() {
    // Must have envelope, be in left room, and on second floor
    if (gameState.hasEnvelope &&
        player.x >= rooms.left.x &&
        player.x <= rooms.left.x + rooms.left.width &&
        player.y + player.height <= platforms[1].y + 20) {

        // Trigger ending sequence
        gamePhase = 'letter';
        letterFrameCount = 0;
        resetLunaNoBlocker();
    }
}

// Reset Luna No Blocker to initial state
function resetLunaNoBlocker() {
    lunaNoBlocker = {
        active: false,
        x: letterButtons.no.x + letterButtons.no.width / 2 - 15,
        y: canvas.height,
        targetY: letterButtons.no.y - 30,
        arrived: false
    };
}

// Initialize confetti pieces for Yes page
function initConfetti() {
    confettiPieces = [];
    const confettiColors = ['#e8728a', '#f0a0b0', '#c0394b', '#f5d0d8', '#ffd700'];
    for (let i = 0; i < 30; i++) {
        confettiPieces.push({
            x: Math.random() * 400 + 200,
            y: Math.random() * -200,
            size: Math.random() * 4 + 3,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            speed: Math.random() * 2 + 1,
            wobble: Math.random() * Math.PI * 2
        });
    }
}

// Update and draw confetti animation
function updateAndDrawConfetti() {
    for (let piece of confettiPieces) {
        // Update position
        piece.y += piece.speed;
        piece.wobble += 0.05;
        const wobbleX = Math.sin(piece.wobble) * 2;

        // Reset when off screen
        if (piece.y > 470) {
            piece.y = 130 - Math.random() * 50;
            piece.x = Math.random() * 400 + 200;
        }

        // Draw confetti piece
        ctx.fillStyle = piece.color;
        ctx.fillRect(piece.x + wobbleX, piece.y, piece.size, piece.size);
    }
}

// Update Luna No Blocker animation
function updateLunaNoBlocker() {
    if (!lunaNoBlocker.active) return;

    if (lunaNoBlocker.y > lunaNoBlocker.targetY) {
        lunaNoBlocker.y -= 8;
        if (lunaNoBlocker.y <= lunaNoBlocker.targetY) {
            lunaNoBlocker.y = lunaNoBlocker.targetY;
            lunaNoBlocker.arrived = true;
        }
    }
}

// Draw rounded rectangle helper
function drawRoundedRect(x, y, w, h, r, fillColor, strokeColor, strokeWidth) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth || 2;
        ctx.stroke();
    }
}

// Check if point is inside rectangle
function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}

// Handle mouse clicks on letter popup
function handleLetterClick(clickX, clickY) {
    if (gamePhase === 'letter') {
        // Check YES button
        if (pointInRect(clickX, clickY, letterButtons.yes)) {
            gamePhase = 'letterYes';
            initConfetti();
            letterFrameCount = 0;
        }
        // Check NO button (only if Luna hasn't blocked it)
        else if (pointInRect(clickX, clickY, letterButtons.no) && !lunaNoBlocker.arrived) {
            lunaNoBlocker.active = true;
        }
    }
    else if (gamePhase === 'letterYes') {
        // Check CLOSE button
        if (pointInRect(clickX, clickY, letterButtons.close)) {
            gamePhase = 'ending';
            gameState.valentineDelivered = true;
            resetLunaNoBlocker();
            confettiPieces = [];
        }
    }
}

// Draw the letter popup (Page 1)
function drawLetterPopup() {
    ctx.save();
    letterFrameCount++;

    // Card dimensions - perfectly centered
    const cardWidth = 420;
    const cardHeight = 360;
    const cardX = (canvas.width - cardWidth) / 2;   // 190
    const cardY = (canvas.height - cardHeight) / 2; // 120
    const pad = 30;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Letter card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(cardX + 6, cardY + 6, cardWidth, cardHeight, 12);
    ctx.fill();

    // Letter card background
    drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 12, '#fdf5e4', '#c0394b', 3);

    // Decorative hearts at top (cardY + 30)
    const heartY = cardY + 30;
    const heartSpacing = (cardWidth - 2 * pad) / 4;
    for (let i = 0; i < 5; i++) {
        drawHeart(cardX + pad + i * heartSpacing, heartY, 10, '#e8728a');
    }

    // "Dear Emi," - left aligned (cardY + 80)
    ctx.textAlign = 'left';
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#8a4a2a';
    ctx.fillText('Dear Emi,', cardX + pad, cardY + 80);

    // "Will you be my Valentine?" - centered (cardY + 130)
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillStyle = '#c0394b';
    ctx.fillText('Will you be my Valentine?', cardX + cardWidth / 2, cardY + 130);

    // Small heart decoration (cardY + 160)
    drawHeart(cardX + cardWidth / 2, cardY + 155, 12, '#e8728a');

    // "- Dru" - right aligned (cardY + 195)
    ctx.textAlign = 'right';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = '#8a4a2a';
    ctx.fillText('- Dru', cardX + cardWidth - pad, cardY + 200);

    // Divider line (cardY + 225)
    ctx.strokeStyle = '#d4a0a8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + pad, cardY + 230);
    ctx.lineTo(cardX + cardWidth - pad, cardY + 230);
    ctx.stroke();

    // Button positioning - centered horizontally (cardY + 265)
    const buttonWidth = 90;
    const buttonHeight = 40;
    const buttonGap = 30;
    const totalButtonWidth = buttonWidth * 2 + buttonGap;
    const buttonStartX = cardX + (cardWidth - totalButtonWidth) / 2;
    const buttonY = cardY + 265;

    // Update button positions for hit detection
    letterButtons.yes.x = buttonStartX;
    letterButtons.yes.y = buttonY;
    letterButtons.yes.width = buttonWidth;
    letterButtons.yes.height = buttonHeight;

    letterButtons.no.x = buttonStartX + buttonWidth + buttonGap;
    letterButtons.no.y = buttonY;
    letterButtons.no.width = buttonWidth;
    letterButtons.no.height = buttonHeight;

    // Draw YES button
    const yesHover = pointInRect(mouseX, mouseY, letterButtons.yes);
    drawRoundedRect(
        letterButtons.yes.x, letterButtons.yes.y,
        letterButtons.yes.width, letterButtons.yes.height,
        8, yesHover ? '#d4506a' : '#c0394b', null, 0
    );
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Yes! 💕', letterButtons.yes.x + letterButtons.yes.width / 2, letterButtons.yes.y + 26);

    // Draw NO button (faded if Luna is blocking)
    const noHover = pointInRect(mouseX, mouseY, letterButtons.no) && !lunaNoBlocker.arrived;
    ctx.globalAlpha = lunaNoBlocker.arrived ? 0.4 : 1.0;
    drawRoundedRect(
        letterButtons.no.x, letterButtons.no.y,
        letterButtons.no.width, letterButtons.no.height,
        8, noHover ? '#7a7a7a' : '#9a9a9a', null, 0
    );
    ctx.fillStyle = '#ffffff';
    ctx.fillText('No', letterButtons.no.x + letterButtons.no.width / 2, letterButtons.no.y + 26);
    ctx.globalAlpha = 1.0;

    // Update Luna blocker target position based on new button position
    lunaNoBlocker.x = letterButtons.no.x + letterButtons.no.width / 2 - 15;
    lunaNoBlocker.targetY = letterButtons.no.y - 30;

    // Update and draw Luna blocker if active
    if (lunaNoBlocker.active) {
        updateLunaNoBlocker();
        drawLunaNoBlocker();
    }

    ctx.restore();
}

// Draw Luna blocking the No button - uses EXACT same P=4 as idle pose
function drawLunaNoBlocker() {
    ctx.save();

    const baseX = lunaNoBlocker.x;
    const baseY = lunaNoBlocker.y;
    const P = 4; // SAME pixel size as idle pose for identical appearance
    const c = lunaColors;

    // Helper for blocker pixels
    const bpx = (col, row, color) => drawPixel(baseX + col * P, baseY + row * P, color, P);

    // ============================================
    // TAIL (curves around right side) - EXACT match to idle
    // ============================================
    bpx(9, 7, c.body);   // Tail base
    bpx(9, 6, c.body);
    bpx(10, 5, c.body);
    bpx(10, 4, c.points); // Tail tip dark
    bpx(10, 3, c.points);

    // ============================================
    // BODY (cream, 8 blocks wide x 5 blocks tall)
    // ============================================
    for (let row = 6; row < 11; row++) {
        for (let col = 1; col < 9; col++) {
            bpx(col, row, c.body);
        }
    }

    // ============================================
    // FRONT PAWS (dark brown)
    // ============================================
    bpx(2, 11, c.points);
    bpx(3, 11, c.points);
    bpx(6, 11, c.points);
    bpx(7, 11, c.points);

    // ============================================
    // HEAD (cream base, 8 blocks wide)
    // ============================================
    // Top of head row
    for (let col = 2; col < 8; col++) {
        bpx(col, 1, c.body);
    }
    // Main head rows
    for (let row = 2; row < 6; row++) {
        for (let col = 1; col < 9; col++) {
            bpx(col, row, c.body);
        }
    }

    // ============================================
    // EARS (dark brown triangles)
    // ============================================
    // Left ear
    bpx(1, 1, c.points);
    bpx(1, 0, c.points);
    bpx(2, 0, c.points);
    // Right ear
    bpx(8, 1, c.points);
    bpx(8, 0, c.points);
    bpx(7, 0, c.points);

    // ============================================
    // FACE MASK (dark brown - surrounds eyes)
    // ============================================
    for (let row = 2; row < 5; row++) {
        for (let col = 2; col < 8; col++) {
            bpx(col, row, c.points);
        }
    }

    // ============================================
    // EYES (2x2 each, with gap between)
    // ============================================
    // Left eye (2x2 blue)
    bpx(2, 2, c.eye);
    bpx(3, 2, c.eye);
    bpx(2, 3, c.eye);
    bpx(3, 3, c.eye);
    // Left pupil
    bpx(3, 3, '#1a1a1a');

    // Right eye (2x2 blue)
    bpx(6, 2, c.eye);
    bpx(7, 2, c.eye);
    bpx(6, 3, c.eye);
    bpx(7, 3, c.eye);
    // Right pupil
    bpx(6, 3, '#1a1a1a');

    // ============================================
    // SNOUT/NOSE (black, 2 blocks wide centered)
    // ============================================
    bpx(4, 4, '#1a1a1a');
    bpx(5, 4, '#1a1a1a');

    // ============================================
    // MUZZLE (cream area below snout)
    // ============================================
    bpx(3, 5, c.body);
    bpx(4, 5, c.body);
    bpx(5, 5, c.body);
    bpx(6, 5, c.body);

    // Draw sign held by Luna and speech bubble if arrived
    if (lunaNoBlocker.arrived) {
        // Wooden sign held by Luna - positioned to her left
        const signX = baseX - 55;
        const signY = baseY + 10;
        const signWidth = 50;
        const signHeight = 35;

        // Sign post (brown wooden stick)
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(signX + signWidth - 5, signY + signHeight - 5, 8, 25);

        // Sign board shadow
        ctx.fillStyle = '#6b4a1b';
        ctx.fillRect(signX + 3, signY + 3, signWidth, signHeight);

        // Sign board (tan wood)
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(signX, signY, signWidth, signHeight);

        // Sign board border
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        ctx.strokeRect(signX, signY, signWidth, signHeight);

        // Wood grain lines
        ctx.strokeStyle = '#c4956a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(signX + 5, signY + 8);
        ctx.lineTo(signX + signWidth - 5, signY + 8);
        ctx.moveTo(signX + 5, signY + 18);
        ctx.lineTo(signX + signWidth - 5, signY + 18);
        ctx.moveTo(signX + 5, signY + 28);
        ctx.lineTo(signX + signWidth - 5, signY + 28);
        ctx.stroke();

        // Arrow painted on sign (pointing LEFT toward Yes button)
        const arrowCenterX = signX + signWidth / 2;
        const arrowCenterY = signY + signHeight / 2;

        // Arrow shaft
        ctx.fillStyle = '#c0394b';
        ctx.fillRect(arrowCenterX - 5, arrowCenterY - 4, 22, 8);

        // Arrowhead (triangle pointing left)
        ctx.beginPath();
        ctx.moveTo(arrowCenterX - 18, arrowCenterY);     // Leftmost tip
        ctx.lineTo(arrowCenterX - 5, arrowCenterY - 10); // Top
        ctx.lineTo(arrowCenterX - 5, arrowCenterY + 10); // Bottom
        ctx.closePath();
        ctx.fill();

        // Luna's paw holding the sign post
        ctx.fillStyle = c.points;
        ctx.fillRect(signX + signWidth - 2, signY + signHeight + 5, 10, 8);

        // Speech bubble
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(baseX + 5, baseY - 25, 55, 22, 6);
        ctx.fill();
        ctx.strokeStyle = '#c0394b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bubble tail
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(baseX + 18, baseY - 3);
        ctx.lineTo(baseX + 24, baseY - 10);
        ctx.lineTo(baseX + 30, baseY - 3);
        ctx.fill();

        // Bubble text
        ctx.font = '11px Arial, sans-serif';
        ctx.fillStyle = '#5a3a2a';
        ctx.textAlign = 'center';
        ctx.fillText('Nope! 🐾', baseX + 32, baseY - 10);
    }

    ctx.restore();
    ctx.textAlign = 'left';
}

// Draw the Yes response page (Page 2)
function drawLetterYesPage() {
    ctx.save();
    letterFrameCount++;

    // Card dimensions - perfectly centered (same as letter popup)
    const cardWidth = 420;
    const cardHeight = 360;
    const cardX = (canvas.width - cardWidth) / 2;   // 190
    const cardY = (canvas.height - cardHeight) / 2; // 120
    const pad = 30;
    const centerX = cardX + cardWidth / 2;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Letter card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(cardX + 6, cardY + 6, cardWidth, cardHeight, 12);
    ctx.fill();

    // Letter card background
    drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 12, '#fdf5e4', '#c0394b', 3);

    // Decorative hearts at top (cardY + 30)
    const heartTopY = cardY + 30;
    const heartSpacing = (cardWidth - 2 * pad) / 4;
    for (let i = 0; i < 5; i++) {
        drawHeart(cardX + pad + i * heartSpacing, heartTopY, 10, '#e8728a');
    }

    // Draw confetti (within card bounds)
    updateAndDrawConfetti();

    // Large pulsing heart (cardY + 90)
    const heartPulse = 1 + Math.sin(letterFrameCount * 0.1) * 0.1;
    const bigHeartSize = 40 * heartPulse;
    drawHeart(centerX, cardY + 90, bigHeartSize, '#c0394b');

    // "See you Feb 14th 2026" (cardY + 170)
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillStyle = '#c0394b';
    ctx.fillText('See you Feb 14th 2026', centerX, cardY + 175);

    // "@ Mojo Sushi Omakase" (cardY + 210)
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#8a4a2a';
    ctx.fillText('@ Mojo Sushi Omakase', centerX, cardY + 215);

    // Decorative hearts row (cardY + 260)
    for (let i = 0; i < 3; i++) {
        drawHeart(centerX - 40 + i * 40, cardY + 255, 14, '#e8728a');
    }

    // Close button (cardY + 310)
    const closeWidth = 100;
    const closeHeight = 36;
    letterButtons.close.x = centerX - closeWidth / 2;
    letterButtons.close.y = cardY + 300;
    letterButtons.close.width = closeWidth;
    letterButtons.close.height = closeHeight;

    const closeHover = pointInRect(mouseX, mouseY, letterButtons.close);
    drawRoundedRect(
        letterButtons.close.x, letterButtons.close.y,
        letterButtons.close.width, letterButtons.close.height,
        8, closeHover ? '#d4506a' : '#c0394b', null, 0
    );
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('💕 Close', centerX, letterButtons.close.y + 24);

    ctx.restore();
}

// Draw ending message after closing letter
function drawEndingUI() {
    // Only show if valentine was delivered
    if (!gameState.valentineDelivered) return;

    ctx.save();

    // Message text
    const message = "Happy Valentine's Day, Emily!";
    ctx.font = 'bold 16px Georgia, serif';
    const textWidth = ctx.measureText(message).width;

    // Pill dimensions with 20px padding on each side
    const pillWidth = textWidth + 40;
    const pillHeight = 32;
    const pillX = (canvas.width - pillWidth) / 2;
    const pillY = 15;

    // Draw soft rose white background pill
    ctx.fillStyle = '#fdf0f3';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 8);
    ctx.fill();

    // Draw rose border
    ctx.strokeStyle = '#c0394b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw text centered inside pill
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c0394b';
    ctx.fillText(message, canvas.width / 2, pillY + pillHeight / 2);

    ctx.restore();
}

// ============================================
// MAIN GAME LOOP
// Update and render every frame
// ============================================
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check game phase
    if (gamePhase === 'title') {
        // Show title screen only
        drawTitleScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    // ============================================
    // LETTER POPUP PHASES - Game frozen, show popup
    // ============================================
    if (gamePhase === 'letter' || gamePhase === 'letterYes') {
        // Draw frozen game world first
        drawBackground();
        drawRooms();
        drawDoors();
        drawPlatforms();
        drawStairs();
        drawRightCatBed();
        drawLeftCatBedBackground();
        drawGate();
        drawGateThoughtBubble();
        drawSushi();
        drawTennisBall();
        drawEnvelope();
        drawPlayer();
        drawLeftCatBedForeground();
        drawUI();

        // Draw popup on top
        if (gamePhase === 'letter') {
            drawLetterPopup();
        } else {
            drawLetterYesPage();
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    // ============================================
    // ENDING PHASE - Game continues with celebration message
    // ============================================
    if (gamePhase === 'ending') {
        // Update animation timer
        animationTime += 0.05;

        // Skip normal physics when in a bed
        if (gameState.inLeftBed) {
            player.x = leftCatBed.holeX - player.width / 2;
            player.y = leftCatBed.holeY - player.height / 2;
        } else if (gameState.onCloudBed) {
            player.x = rightCatBed.x + rightCatBed.width / 2 - player.width / 2;
            player.y = rightCatBed.y - player.height + 10;
            updateZzzParticles();
        } else {
            // Update game state (player can still move)
            updatePlayer();
            handleStairClimbing();
            handlePlatformCollisions();
            handleWallCollisions();     // Room wall collision
            checkCloudBedLanding();
            handleRoomAccess();
            handleBedInteractions();
            checkDoorThoughtBubbleDismiss(); // Check if door bubble should be dismissed
        }
        updateDoors();
        updateBoySneezeState();  // Check if Luna is touching the boy

        // Draw everything
        drawBackground();
        drawRooms();
        drawBoySneeze();       // Draw "Achoo!" above boy if Luna is touching him
        drawDoors();
        drawDoorThoughtBubble(); // Show envelope hint on girl's door (if conditions met)
        drawPlatforms();
        drawStairs();
        drawRightCatBed();
        drawLeftCatBedBackground();  // Draw bed background (includes Luna's face if inside)
        drawGate();
        drawGateThoughtBubble();
        drawSushi();
        drawTennisBall();
        drawEnvelope();

        // Draw Luna (skip if she's in the left bed - her face is drawn in bed background)
        if (gameState.onCloudBed) {
            drawLunaSleeping();
            drawZzzParticles();
        } else if (!gameState.inLeftBed) {
            drawPlayer();
        }

        drawLeftCatBedForeground();  // Draw bed foreground overlay
        drawUI();
        drawEndingUI();  // Celebration banner

        requestAnimationFrame(gameLoop);
        return;
    }

    // ============================================
    // PLAYING PHASE - Normal game update and render
    // ============================================

    // Update animation timer (for floating items)
    animationTime += 0.05;

    // Skip normal physics when in a bed
    if (gameState.inLeftBed) {
        // Luna is in the left bed hole - freeze position
        player.x = leftCatBed.holeX - player.width / 2;
        player.y = leftCatBed.holeY - player.height / 2;
    } else if (gameState.onCloudBed) {
        // Luna is sleeping on cloud bed - freeze position and update Zzz
        player.x = rightCatBed.x + rightCatBed.width / 2 - player.width / 2;
        player.y = rightCatBed.y - player.height + 10;
        updateZzzParticles();
    } else {
        // Normal game state updates
        updatePlayer();
        handleStairClimbing();   // Handle ladder-style stairs
        handlePlatformCollisions();
        handleWallCollisions();  // Room wall collision above doorways
        checkCloudBedLanding();  // Check for landing on cloud bed
        handleRoomAccess();
        handleEnvelopeCollection();
        handleSushiCollection();
        handleTennisBallCollection();
        checkGateCondition();    // Check if gate should open
        handleBedInteractions(); // Check for bed entry
        checkDoorThoughtBubbleDismiss(); // Check if door bubble should be dismissed
    }

    updateDoors();
    updateBoySneezeState();  // Check if Luna is touching the boy

    // Check if Luna should deliver the letter
    checkLetterDelivery();

    // Draw everything (order matters for layering)
    drawBackground();      // Background & first floor walls with windows (FIRST)
    drawRooms();           // Second floor rooms
    drawBoySneeze();       // Draw "Achoo!" above boy if Luna is touching him
    drawDoors();
    drawDoorThoughtBubble(); // Show envelope hint on girl's door (if conditions met)
    drawPlatforms();
    drawStairs();
    drawRightCatBed();     // Cloud bed BEFORE Luna (she stands on it)
    drawLeftCatBedBackground();  // Bed background (includes Luna's face if inside)
    drawGate();            // Draw mesh gate at top of stairs (if closed)
    drawGateThoughtBubble(); // Show required items above gate (if closed)
    drawSushi();           // Draw collectible sushi
    drawTennisBall();      // Draw collectible tennis ball
    drawEnvelope();        // Draw collectible envelope

    // Draw Luna (skip if she's in the left bed - her face is drawn in bed background)
    if (gameState.onCloudBed) {
        drawLunaSleeping();
        drawZzzParticles();
    } else if (!gameState.inLeftBed) {
        drawPlayer();
    }

    drawLeftCatBedForeground();  // Bed foreground overlay
    drawUI();              // UI includes inventory slots

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// ============================================
// START THE GAME
// ============================================
gameLoop();
