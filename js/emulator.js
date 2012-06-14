var chip8 = new Chip8;
var timer_timer, run_timer;
var is_running = false;
var is_paused = false;

function set_table()
{
    document.getElementById("PC").value = "0x" + chip8.PC.toString(16);
    document.getElementById("I").value = chip8.I;

    document.getElementById("instruction").value = "0x" + chip8.memory[chip8.PC].toString(16) + chip8.memory[chip8.PC+1].toString(16);

    for (i=0 ; i<16 ; i++)
        document.getElementById("V" + i.toString(16)).value = chip8.V[i];
}

function init_emulator()
{
    // Initialize screen
    var screen = document.getElementById("screen").getContext("2d");

    screen.fillStyle="#000000";
    screen.fillRect(0, 0, 512, 256);
}

function start_emulator()
{
    if (!is_running)
    {
        chip8.init();
        chip8.load_game("roms/" + document.getElementById("rom_list").value);

        set_table();
    }

    timer_timer = setInterval("timer()", 1000/1000);
    run_timer = setInterval("run_emulator()", 1000/1000);

    is_running = true;

    document.getElementById("start_button").disabled = true;
    document.getElementById("pause_button").disabled = false;
}

function pause_emulator()
{
    clearInterval(timer_timer);
    clearInterval(run_timer);

    document.getElementById("start_button").disabled = false;
    document.getElementById("pause_button").disabled = true;

    is_paused = true;
}

function reset_emulator()
{
    clearInterval(timer_timer);
    clearInterval(run_timer);

    is_running = false;
    is_paused = false;

    chip8 = new Chip8;
    init_emulator();
    start_emulator();
}

function step_emulator()
{
    chip8.emulate_cycle();

    timer();

    set_table();
}

function run_emulator()
{
    chip8.emulate_cycle();

    set_table();

    if (chip8.PC == document.getElementById("breakpoint").value)
    {
        clearInterval(timer_timer);
        clearInterval(run_timer);
    }
}

function timer()
{
    if (chip8.delay_timer > 0)
        chip8.delay_timer--;
    if (chip8.sound_timer > 0)
        chip8.sound_timer--;
}

window.onkeydown = function(e)
{
    switch (e.keyCode)
    {
        case 49: chip8.key_pressed[1] = 1; break;     // 1
        case 50: chip8.key_pressed[2] = 1; break;     // 2
        case 51: chip8.key_pressed[3] = 1; break;     // 3
        case 52: chip8.key_pressed[12] = 1; break;     // 4
        case 81: chip8.key_pressed[4] = 1; break;     // Q
        case 87: chip8.key_pressed[5] = 1; break;     // W
        case 69: chip8.key_pressed[6] = 1; break;     // E
        case 82: chip8.key_pressed[13] = 1; break;     // R
        case 65: chip8.key_pressed[7] = 1; break;     // A
        case 83: chip8.key_pressed[8] = 1; break;     // S
        case 68: chip8.key_pressed[9] = 1; break;    // D
        case 70: chip8.key_pressed[14] = 1; break;    // F
        case 90: chip8.key_pressed[10] = 1; break;    // Z
        case 88: chip8.key_pressed[0] = 1; break;    // X
        case 67: chip8.key_pressed[11] = 1; break;    // C
        case 86: chip8.key_pressed[15] = 1; break;    // V
    }
}

window.onkeyup = function(e)
{
    switch (e.keyCode)
    {
        case 49: chip8.key_pressed[1] = 0; break;     // 1
        case 50: chip8.key_pressed[2] = 0; break;     // 2
        case 51: chip8.key_pressed[3] = 0; break;     // 3
        case 52: chip8.key_pressed[12] = 0; break;     // 4
        case 81: chip8.key_pressed[4] = 0; break;     // Q
        case 87: chip8.key_pressed[5] = 0; break;     // W
        case 69: chip8.key_pressed[6] = 0; break;     // E
        case 82: chip8.key_pressed[13] = 0; break;     // R
        case 65: chip8.key_pressed[7] = 0; break;     // A
        case 83: chip8.key_pressed[8] = 0; break;     // S
        case 68: chip8.key_pressed[9] = 0; break;    // D
        case 70: chip8.key_pressed[14] = 0; break;    // F
        case 90: chip8.key_pressed[10] = 0; break;    // Z
        case 88: chip8.key_pressed[0] = 0; break;    // X
        case 67: chip8.key_pressed[11] = 0; break;    // C
        case 86: chip8.key_pressed[15] = 0; break;    // V
    }
}
