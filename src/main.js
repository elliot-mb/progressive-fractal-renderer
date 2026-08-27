
/**
 * @brief Main entry point of the program. 
 */

/* Primitive constants. */
const PIXEL_SIZE = 20; //px
/* Painter inputs. */
const C_INIT_RADIUS = 0.7885;
const C_ARG    = Math.PI;
const C_SPEED  = 0.001;
/* Cursor pan speed. */
const PAN_SPEED = 0.001;
/* Cursor zoom speed. */
const ZOOM_SPEED = 0.1;
/* Pixel width for pixelated view. */
const PIXEL_VIEW_DURATION = 1000; //ms
const PIXEL_VIEW_ITER_LIM = 200;
const PIXEL_VIEW_ITER_STEP = 25;
/* Pixel skip rate for computing iterations e.g. 2 checks every other pixel. */
const COMPUTE_ITER_SPEEDUP = 2;
const COMPUTE_ITER_TIMEOUT = 50;
const PIXEL_OFFSET = Math.floor(PIXEL_SIZE / 2);

/* Multiple cycles per frame render speed boosting. */
let cycles_per_frame = 1;
const FRAME_TIME_MIN_MS = 32;

const USE_LO_RES_PREVIEW = true;

let compute_iter_count_timeout_id = 0;

let delta_time;
let prev_time         = 0;
/* This is true each time after a reset from changing the view. */
let is_just_changed = true;
let rendering_detailed_view = false;
let show_render_square = true;
let has_requested_stop = false;
let last_update     = 0; //ms (time)
let is_mouse_down = false;
// let utils.canvas_img    = utils.ctx.getImageData(0, 0, utils.CANVAS_WIDTH, utils.CANVAS_HEIGHT);
// let canvas_channels = utils.canvas_img.data;
let c_offset = 0.1;
let finish_render_time = 0;

/* Render computed view interval for cancelling until we have left it long enough. */
let computed_view_interval_id = 0;
const COMPUTED_VIEW_TIMEOUT = 500;
const computed_view_is_running = false;

/* Constant references. */
const key_state = new key_handler();
const painter = new fractal_painter(complex.exp(C_INIT_RADIUS, C_ARG + c_offset));
text_display.set_offset(fractal_painter.get_c());
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
  const event_key_lower = event.key.toLowerCase();
  if(event_key_lower === 's') 
  { 
    fractal_painter.cycle_colour_method(); 
    text_display.set_render_mode(fractal_painter.get_render_mode_name());
    if(rendering_detailed_view && !computed_view_is_running)
    {
      if(computed_view_interval_id !== 0)
      {
        clearTimeout(computed_view_interval_id);
      }
      computed_view_interval_id = setTimeout(render_computed_view, COMPUTED_VIEW_TIMEOUT);
    }
    //register_update();
  } 
  if(event_key_lower === 'a')
  {
    c_offset += C_SPEED;    
    const mag = fractal_painter.get_c().mag();
    fractal_painter.set_c(complex.exp(mag, C_ARG + c_offset));
    register_update();
  }
  if(event_key_lower === 'd')
  {
    c_offset -= C_SPEED;   
    const mag = fractal_painter.get_c().mag(); 
    console.log(mag);
    fractal_painter.set_c(complex.exp(mag, C_ARG + c_offset));
    register_update();
  }
  if(event_key_lower === 'w')
  {
    has_requested_stop = true;
    text_display.set_stopping_increase();
  }
  if(event_key_lower === 'e')
  {
    has_requested_stop = false;
    text_display.set_increasing();
    text_display.set_active();
  }
  /* Increase radius of c. */
  if(event_key_lower === 'r')
  {
    const c = fractal_painter.get_c();
    let del_c = new complex(0, 0);
    if(c.mag() > 0)
    {
      /* C_SPEED length c. */
      del_c = (new complex(c.a, c.b)).scale(1/c.mag()).scale(C_SPEED);
    }
    fractal_painter.set_c(c.add(del_c));
    register_update();
    compute_iter_count_async_calls();
  }
  /* Decrease radius of c. */
  if(event_key_lower === 'f')
  {
    const c = fractal_painter.get_c();
    let del_c = new complex(0, 0);
    if(c.mag() > 0)
    {
      /* C_SPEED length c. */
      del_c = (new complex(c.a, c.b)).scale(1/c.mag()).scale(C_SPEED);
    }
    fractal_painter.set_c(c.sub(del_c));
    register_update();
    compute_iter_count_async_calls();
  }

  /* Update the display in case it changes. */
  text_display.set_offset(fractal_painter.get_c());
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
  if(event.deltaY > 0)
  {
    compute_iter_count_async_calls();
  }
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
  rendering_detailed_view = false;
  text_display.set_active();
  text_display.set_increasing();
  compute_iter_count_async_calls();
  fill.initialise_render_lists();
}

/* Refresh all pixels using just the computed values. */
function render_computed_view()
{
  for(let y = 0; y < utils.CANVAS_HEIGHT; y++)
  {
    for(let x = 0; x < utils.CANVAS_WIDTH; x++)
    {
      const col = fractal_painter.paint(x, y, true, false);
      utils.set_pixel_by_x_y(x, y, col);
    }
  }
  utils.update_pixels();
}

function compute_iter_count_sync()
{
  fractal_painter.set_max_iterations(50);
  let is_screen_black = true;
  while(is_screen_black && (fractal_painter.get_max_iterations() < PIXEL_VIEW_ITER_LIM))
  {
    for(let y = 0; y <= utils.CANVAS_HEIGHT - PIXEL_SIZE; y += (PIXEL_SIZE * COMPUTE_ITER_SPEEDUP))
    {
      for(let x = 0; x <= utils.CANVAS_WIDTH - PIXEL_SIZE; x += (PIXEL_SIZE * COMPUTE_ITER_SPEEDUP))
      {
        let px_x = x + PIXEL_OFFSET;
        let px_y = y + PIXEL_OFFSET;
        const col = fractal_painter.paint(px_x, px_y, false);
        /* The screen is black if all previous pixels are black, and this pixel is not solved (black) */
        is_screen_black = is_screen_black && (!fractal_painter.is_iteration_cache_solved_at(px_x, px_y));
      }
    }
    /* Allow the user to see something when zoom levels are high (will increase lag). */
    if(is_screen_black)
    {
      fractal_painter.set_max_iterations(fractal_painter.get_max_iterations() + PIXEL_VIEW_ITER_STEP);
    }
  }
}

/* All event driven calls should use this. */
function compute_iter_count_async_calls()
{
  clearTimeout(compute_iter_count_timeout_id);

  compute_iter_count_timeout_id = setTimeout(compute_iter_count_sync, COMPUTE_ITER_TIMEOUT);
}

function render_pixelated_view()
{
  let is_screen_black = true;
  for(let y = 0; y <= utils.CANVAS_HEIGHT - PIXEL_SIZE; y += PIXEL_SIZE)
  {
    for(let x = 0; x <= utils.CANVAS_WIDTH - PIXEL_SIZE; x += PIXEL_SIZE)
    {
      let px_x = x + PIXEL_OFFSET;
      let px_y = y + PIXEL_OFFSET;
      const col = fractal_painter.paint(px_x, px_y, false);

      utils.ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`;
      utils.ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);

      is_screen_black = is_screen_black && (!fractal_painter.is_iteration_cache_solved_at(px_x, px_y));
    }
  }

  /* Allows panning to request higher iteration count. */
  if(is_screen_black)
  {
    compute_iter_count_sync();
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
    if(!rendering_detailed_view)
    {
      /* Wipe the low-res fractal image. */
      fractal_painter.reset_cache();
      utils.clear_pixels();
      rendering_detailed_view = true;
    }

    if(delta_time < FRAME_TIME_MIN_MS)
    {
      cycles_per_frame++;
    }
    else
    {
      cycles_per_frame = Math.max(1, cycles_per_frame - 1);
    }

    /* If we're not rendering much and frame times are low, we adjust how many cycles we render in a frame. */
    for(let i = 0; (i < cycles_per_frame); i++) fill.render_one_cycle();

    /* Only put image data when we're not using built-in methods for drawing. */
    utils.update_pixels();
  }
  /* Reached the end of an iteration count, increase detail and set to draw again (will set the above case true). */
  else if(!fill.is_unsolved_list_empty() && !has_requested_stop)
  {
    /* THEN reset the render list, because doing this clears the unsolved cache. */
    fill.initialise_render_lists_from_unsolved();
    fractal_painter.increase_iter();
    
    /* Reset this to stop causing lag for big perimeters. */
    cycles_per_frame = 1;
  }
  /* There is no more black in the image. */
  else
  {
    text_display.set_idle();
  }    
      
  text_display.register_frame();
  text_display.set_cycles_per_frame(cycles_per_frame);

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
    compute_iter_count_sync();
    /* Sets text display zoom level. */
    fractal_painter.zoom_by(0);
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