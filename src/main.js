
/**
 * @brief Main entry point of the program. 
 */

/* Primitive constants. */
const PIXEL_SIZE = 16; //px
/* How many pixels to skip per frame. */
const PROGRESSION_STRIDE = PIXEL_SIZE;
/* Painter inputs. */
const C_RADIUS = 0.7885;
const C_ARG    = Math.PI;
const C_SPEED  = 0.001;
/* Cursor pan speed. */
const PAN_SPEED = 0.001;
/* Cursor zoom speed. */
const ZOOM_SPEED = 0.1;
/* Pixel width for pixelated view. */
const PIXEL_VIEW_DURATION = 1000; //ms
const PIXEL_OFFSET = Math.floor(PIXEL_SIZE / 2);

const USE_LO_RES_PREVIEW = true;
const CHANNEL_STRIDE     = USE_LO_RES_PREVIEW ? PROGRESSION_STRIDE * utils.CHAN_PER_PIXEL : utils.CHAN_PER_PIXEL;

const SQUARE_SIZE        = utils.gcd(utils.CANVAS_WIDTH, utils.CANVAS_HEIGHT);
const SQUARES_IN_IMAGE   = (utils.CANVAS_WIDTH * utils.CANVAS_HEIGHT) / (SQUARE_SIZE * SQUARE_SIZE);
const SQUARES_ON_WIDTH   = utils.CANVAS_WIDTH / SQUARE_SIZE;
const SQUARES_ON_HEIGHT  = utils.CANVAS_HEIGHT / SQUARE_SIZE;

let delta_time;
let prev_time         = 0;
/* This is true each time after a reset from changing the view. */
let is_just_changed = true;
let has_reset_cache_in_render_cycle = false;
let show_render_square = true;
let has_requested_stop = false;
let last_update     = 0; //ms (time)
let is_mouse_down = false;
// let utils.canvas_img    = utils.ctx.getImageData(0, 0, utils.CANVAS_WIDTH, utils.CANVAS_HEIGHT);
// let canvas_channels = utils.canvas_img.data;
let c_offset = 0.1;
let finish_render_time = 0;

/* Constant references. */
const key_state = new key_handler();
const painter = new fractal_painter(complex.exp(C_RADIUS, C_ARG + c_offset));
const keys_to_track = ['w', 
                       's', 
                       'a', 
                       'd', 
                       'f', 
                       'r'    
                      ];
const key_statuses  = keys_to_track.map(key => false);
const fill          = new filler();

/* Event listeners. */

document.addEventListener('mousemove', pan, true);
document.addEventListener('mousedown', () => {is_mouse_down = true;}, true);
document.addEventListener('mouseup', () => {is_mouse_down = false;}, true);
window.addEventListener('wheel', zoom, true);
window.addEventListener('keydown', (event) => {
  if(event.key === 's') 
  { 
    fractal_painter.cycle_colour_method(); 
    text_display.set_render_mode(fractal_painter.get_render_mode_name());
    register_update();
  } 
  if(event.key === 'a')
  {
    c_offset += C_SPEED;    
    fractal_painter.set_c(complex.exp(C_RADIUS, C_ARG + c_offset));
    register_update();
  }
  if(event.key === 'd')
  {
    c_offset -= C_SPEED;    
    fractal_painter.set_c(complex.exp(C_RADIUS, C_ARG + c_offset));
    register_update();
  }
  if(event.key === 'w')
  {
    has_requested_stop = true;
  }
  if(event.key === 'e')
  {
    has_requested_stop = false;
  }
}, true);

/**
 * Handles mouse movement for panning.
 * @param {*} event 
 */
function pan(event)
{
  if(is_mouse_down)
  {
    const cursor_x = event.movementX 
                     || event.mozMovementX 
                     || event.webkitMovementX 
                     || 0;
    const cursor_y = event.movementY 
                     || event.mozMovementY
                     || event.webkitMovementY
                     || 0;
    const pan_offset = new complex(cursor_x, cursor_y).scale(PAN_SPEED);
    fractal_painter.pan_by(pan_offset);
    if((pan_offset.mag() > 0) && (!text_display.get_is_stopped()))
    {
      register_update();
    }
  }
}

function zoom(event)
{
  fractal_painter.zoom_by(Math.sign(event.deltaY) * ZOOM_SPEED);
  if(!text_display.get_is_stopped())
  {
    register_update();
  }
}

function stop()
{
  text_display.stop();
}

function register_update()
{
  has_requested_stop = false;
  is_just_changed = USE_LO_RES_PREVIEW;
  has_reset_cache_in_render_cycle = false;
  text_display.set_active();
  fractal_painter.set_max_iterations(50);
  fill.initialise_render_lists();
}



function render_pixelated_view()
{
  for(let y = 0; y < utils.CANVAS_HEIGHT; y += PIXEL_SIZE)
  {
    for(let x = 0; x < utils.CANVAS_WIDTH; x += PIXEL_SIZE)
    {
      const col = fractal_painter.paint(x + PIXEL_OFFSET, y + PIXEL_OFFSET, false);
      utils.ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`;
      utils.ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
}

/**
 * Render the contents of a square with top-left corner x, y.
 * @param {*} x Top-left x. 
 * @param {*} y Top-left y.
 * @param {*} w
 * @param {*} h
 */
function render_rect(x, y, w, h)
{
  for(let x_s = x; x_s < x + w; x_s++)
  {
    for(let y_s = y; y_s < y + h; y_s++)
    {
      const col = fractal_painter.paint(x_s, y_s);
      utils.set_pixel_by_x_y(x_s, y_s, col);
    }
  }
}

function main_loop(timestamp)
{
  /* Ancilliary aspects. */
  delta_time = timestamp - prev_time;
  prev_time = timestamp;

  if(is_just_changed)
  {
    last_update      = timestamp;
    is_just_changed  = false;
  }

  text_display.set_iter_count(fractal_painter.get_max_iterations());

  if(timestamp < last_update + PIXEL_VIEW_DURATION)
  {
    /* Draw the pixelated view. */
    render_pixelated_view();
  }
  /* Progressively draw the detailed fractal. */
  else if(!fill.is_render_list_empty())
  {

    if(!has_reset_cache_in_render_cycle)
    {
      /* Wipe the low-res fractal image. */
      fractal_painter.set_max_iterations(50);
      fractal_painter.reset_cache();
      utils.clear_pixels();
      has_reset_cache_in_render_cycle = true;
    }

    fill.render_one_cycle();

    /* Only put image data when we're not using built-in methods for drawing. */
    utils.update_pixels();
  }
  /* Reached the end of an iteration count, increase detail and set to draw again (will set the above case true). */
  else if(!fill.is_unsolved_list_empty())
  {
    /* THEN reset the render list, because doing this clears the unsolved cache. */
    fill.initialise_render_lists_from_unsolved();
    fractal_painter.increase_iter();
  }
  /* There is no more black in the image. */
  else
  {
    text_display.set_idle();
  }    
      
  text_display.register_frame();

  if(!text_display.get_is_stopped()) 
  {
    requestAnimationFrame(main_loop);
  }
}

/**
 * Main only runs when all tests pass.
 */
function run_if_pass_all_tests()
{
  if(run_all_tests())
  {
    console.log(`run_if_pass_all_tests: starting main.`);
    text_display.set_render_mode(fractal_painter.get_render_mode_name());
    register_update();
    main_loop(0);
  }
  else
  {
    console.log(`run_if_pass_all_tests: not starting main loop due to test failures. Fix these tests then reload the \
page.`);
    text_display.start_error();
  }
}



run_if_pass_all_tests();