var max_memory_size = 4096;
var max_register_number = 16;
var max_stack_level = 16;
var display_width = 64;
var display_height = 32;

var fonts = new Array(
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
);

var key_map = new Array(
    '1', '2', '3', '4',
    'Q', 'W', 'E', 'R',
    'A', 'S', 'D', 'F',
    'Z', 'X', 'C', 'V'
);

function Chip8()
{
	this.memory = new Array(max_memory_size);
    this.display = new Array(display_height);

	this.V = new Array(max_register_number);
	this.I = 0;
	this.PC = 0x200;

	this.stack = new Array(max_stack_level);
	this.SP = 0;

	this.delay_timer = 0;
	this.sound_timer = 0;

    this.key_pressed = new Array(16);
}

Chip8.prototype.init = function()
{
    for (i=0 ; i<max_memory_size ; i++)
        this.memory[i] = 0;
    for (i=0 ; i<display_height ; i++)
    {
        this.display[i] = new Array(display_width);
        for (j=0 ; j<display_width ; j++)
            this.display[i][j] = 0;
    }
    for (i=0 ; i<max_register_number ; i++)
        this.V[i] = 0;
    for (i=0 ; i<max_stack_level ; i++)
        this.stack[i] = 0;
    for (i=0 ; i<16 ; i++)
        this.key_pressed[i] = 0;

    for (i=0 ; i<80 ; i++)
        this.memory[i] = fonts[i];
}

Chip8.prototype.load_game = function(game_filename)
{
    var game_file = new BinFileReader(game_filename);
    var is_eof = false;
    var i = 0x200;
    
    while (!is_eof)
    {
        try
        {
            this.memory[i++] = game_file.readNumber(1);
        }
        catch (e)
        {
            is_eof = true;
        }
    }
}
	
Chip8.prototype.emulate_cycle = function()
{
    instruction = this.memory[this.PC] << 8 | this.memory[this.PC + 1];

    opcode = parseInt((instruction & 0xF000) >> 12);
    X = parseInt((instruction & 0x0F00) >> 8);
    Y = parseInt((instruction & 0x00F0) >> 4);
    N = parseInt(instruction & 0x000F);
    NN = parseInt(instruction & 0x00FF);
    NNN = parseInt(instruction & 0x0FFF);

    switch (opcode)
    {
        case 0x0:
            switch (NN)
            {
                case 0xE0: // 00E0: clears the screen
                    for (i=0 ; i<display_height ; i++)
                        for (j=0 ; j<display_width ; j++)
                            this.display[i][j] = 0;

                    screen = document.getElementById("screen").getContext("2d");
                    screen.fillStyle="#000000";
                    screen.fillRect(0, 0, display_width * 8, display_height * 8);

                    this.PC += 2;
                    break;
                case 0xEE: // 00EE: return from a subroutine
                    this.SP--;
                    this.PC = this.stack[this.SP];

                    this.PC += 2;
                    break;
                default:
                    alert("Unexpected instruction");
                    break;
            }
            break;
        case 0x1: // 1NNN: jumps to address NNN
            this.PC = NNN;
            break;
        case 0x2: // 2NNN: calls subroutine at NNN
            this.stack[this.SP] = this.PC;
            this.SP++;
            this.PC = NNN;
            break;
        case 0x3: // 3XNN: skips the next instruction if VX equals NN
            if (this.V[X] == NN)
                this.PC += 4;
            else
                this.PC += 2;
            break;
        case 0x4: // 4XNN: skips the next instruction if VX doesn't equal NN
            if (this.V[X] != NN)
                this.PC += 4;
            else
                this.PC += 2;
            break;
        case 0x5: // 5XY0: skips the next instruction if VX equals VY
            if (this.V[X] == this.V[Y])
                this.PC += 4;
            else
                this.PC += 2;
            break;
        case 0x6: // 6XNN: sets VX to NN
            this.V[X] = NN;

            this.PC += 2;
            break;
        case 0x7: // 7XNN: adds NN to VX
            this.V[X] = (this.V[X] + NN) & 0xFF;

            this.PC += 2;
            break;
        case 0x8:
            switch (N)
            {
                case 0x0: // 8XY0: sets VX to the value of VY
                    this.V[X] = this.V[Y];

                    this.PC += 2;
                    break;
                case 0x1: // 8XY1: sets VX to VX or VY
                    this.V[X] = (this.V[X] | this.V[Y]) & 0xFF;

                    this.PC += 2;
                    break;
                case 0x2: // 8XY2: sets VX to VX and VY
                    this.V[X] = (this.V[X] & this.V[Y]) & 0xFF;

                    this.PC += 2;
                    break;
                case 0x3: // 8XY3: sets VX to VX xor VY
                    this.V[X] = (this.V[X] ^ this.V[Y]) & 0xFF;

                    this.PC += 2;
                    break;
                case 0x4: // 8XY4: adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't
                    if (this.V[X] + this.V[Y] > 0xFF)
                        this.V[max_register_number-1] = 1;
                    else
                        this.V[max_register_number-1] = 0;
                    this.V[X] = (this.V[X] + this.V[Y]) & 0xFF;

                    this.PC += 2;
                    break;
                case 0x5: // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                    if (this.V[X] < this.V[Y])
                        this.V[max_register_number-1] = 0;
                    else
                        this.V[max_register_number-1] = 1;
                    this.V[X] = (this.V[X] - this.V[Y]) & 0xFF;

                    this.PC += 2;
                    break;
                case 0x6: // 8XY6: Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift
                    this.V[max_register_number-1] = this.V[X] & 0x0001;
                    this.V[X] = this.V[Y] >> 1;
                    this.PC += 2;
                    break;
                case 0x7: // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    if (this.V[Y] < this.V[X])
                        this.V[max_register_number-1] = 0;
                    else
                        this.V[max_register_number-1] = 1;
                    this.V[X] = (this.V[Y] - this.V[X]) & 0xFF;

                    this.PC += 2;
                    break;
                case 0xE: // 8XYE: Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift
                    this.V[max_register_number-1] = this.V[X] >> 7;
                    this.V[X] = (this.V[Y] << 1) & 0xFF;

                    this.PC += 2;
                    break;
                default:
                    alert("Unexpected instruction");
                    break;
            }
            break;
        case 0x9: // 9XY0: Skips the next instruction if VX doesn't equal VY
            if (this.V[X] != this.V[Y])
                this.PC += 4;
            else
                this.PC += 2;
            break;
        case 0xA: // ANNN: Sets I to the address NNN
            this.I = NNN;

            this.PC += 2;
            break;
        case 0xB: // BNNN: Jumps to the addresss NNN plus V0
            this.PC = this.V[0] + NNN;
            break;
        case 0xC: // CXNN: Sets VX to a random number and NN.
            this.V[X] = Math.floor(Math.random() * 0xFF) & NN;
            
            this.PC += 2;
            break;
        case 0xD: // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen
            this.V[max_register_number-1] = 0;
            for (i=0 ; i<N ; i++)
                for (j=0; j<8 ; j++)
                {
                    if (this.V[Y] + i >= display_height || this.V[X] + j >= display_width)
                        break;

                    if (this.display[this.V[Y] + i][this.V[X] + j] && (0x1 & (this.memory[this.I + i] >> (7-j))))
                        this.V[max_register_number-1] = 1;
                    this.display[this.V[Y] + i][this.V[X] + j] ^= 0x1 & (this.memory[this.I + i] >> (7-j));
                }

            screen = document.getElementById("screen").getContext("2d");

            screen.fillStyle="#000000";
            screen.fillRect(this.V[X]*8, this.V[Y]*8, 8*8, N*8);

            screen.fillStyle="#AFEEEE";
            for (i=0 ; i<N ; i++)
                for (j=0 ; j<8 ; j++)
                    if (this.V[Y] + i < display_height && this.V[X] + j < display_width && this.display[this.V[Y] + i][this.V[X] + j])
                        screen.fillRect((this.V[X] + j)*8, (this.V[Y] + i)*8, 8, 8);

            this.PC += 2;
            break;
        case 0xE:
            switch (NN)
            {
                case 0x9E: // EX9E: Skips the next instruction if the key stored in VX is pressed.
                    if (this.key_pressed[this.V[X]])
                        this.PC += 4;
                    else
                        this.PC += 2;
                    break;
                case 0xA1: // EXA1: Skips the next instruction if the key stored in VX isn't pressed.
                    if (!this.key_pressed[this.V[X]])
                        this.PC += 4;
                    else
                        this.PC += 2;
                    break;
                default:
                    alert("Unexpected instruction");
                    break;
            }
            break;
        case 0xF:
            switch (NN)
            {
                case 0x07: // FX07: Sets VX to the value of the delay timer
                    this.V[X] = this.delay_timer;

                    this.PC += 2;
                    break;
                case 0x0A: // FX0A: A key press is awaited, and then stored in VX
                    for (i=0 ; i<16 ; i++)
                        if (this.key_pressed[i])
                        {
                            this.V[X] = i;

                            this.PC += 2;

                            return;
                        }
                    break;
                case 0x15: // FX15: Sets the delay timer to VX.
                    this.delay_timer = this.V[X];

                    this.PC += 2;
                    break;
                case 0x18: // FX18: Sets the sound timer to VX.
                    this.sound_timer = this.V[X];

                    this.PC += 2;
                    break;
                case 0x1E: // FX1E: Adds VX to I.
                    if ( this.I + this.V[X] > 0xFFF)
                        this.V[max_register_number-1] = 1;
                    else
                        this.V[max_register_number-1] = 0;

                    this.I += this.V[X];

                    this.PC += 2;
                    break;
                case 0x29: // FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
                    this.I = this.V[X] * 5; // font set is stored in 0x000-0x050

                    this.PC += 2;
                    break;
                case 0x33: // FX33: Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2.
                    this.memory[this.I] = (this.V[X] / 100) >>> 0;
                    this.memory[this.I+1] = ((this.V[X] % 100) / 10) >>> 0;
                    this.memory[this.I+2] = (this.V[X] % 10) >>> 0;

                    this.PC += 2;
                    break;
                case 0x55: // FX55: Stores V0 to VX in memory starting at address I.
                    for (i=0 ; i<=X ; i++)
                        this.memory[this.I+i] = this.V[i];

                    this.I += X + 1;

                    this.PC += 2;
                    break;
                case 0x65: // FX65: Fills V0 to VX with values from memory starting at address I.
                    for (i=0 ; i<=X ; i++)
                        this.V[i] = this.memory[this.I+i];

                    this.I += X + 1;

                    this.PC += 2;
                    break;
                default:
                    alert("Unexpected instruction");
                    break;
            }
            break;
        default:
            alert("Unexpected instruction");
            break;
    }
}
