/**
 * Contains the calculations which take a pixel and return the pixel colour.
 */
class fractal_painter
{
  /* Complex offset. */
  static #c;
  /* Escape radius, set this to at least 0.5 + sqrt(0.25 + abs(c)) */
  static #r;
  /* Current colouring method. */
  static #current_colouring_idx;
  static #colouring_methods;
  static #starting_max_iterations = 50;
  /* Rate of iteration increase. */
  static #iteration_step = 50;
  /* Iterations before we colour it black. */
  static #max_iterations = fractal_painter.#starting_max_iterations;
  /* Iteration cache. */
  static #iteration_cache;
    /* Escape number cache. */
  static #escape_number_cache; 
  /* How zoomed in are we. */
  static #zoom_factor = 1;
  /* Pan offset. */
  static #pan_offset = new complex(0, 0);
  /* The radius of a circle drawn from the centre to the middle of the furthest edge, in pixels. */
  static #canvas_radius = (Math.max(utils.CANVAS_WIDTH, utils.CANVAS_HEIGHT) / 2);
  /* Colour choice. */
  static #start_brightness = 255;
  static #end_brightness   = 0;
  /* Pre-computed colour offset for rainbows. */
  static #pi2div3    = 2 * Math.PI / 3; 
  static #angle_offset = 7 * Math.PI / 6;

  static #COLOUR_CYCLE_FREQUENCY = 50;
  static #BLACK = new rgba(0, 0, 0, 255);

  /**
   * 
   * @param {complex} c 
   */
  constructor(c)
  {
    fractal_painter.#c = c;
    fractal_painter.#r = 0.5 + Math.sqrt(0.25 + c.mag());
    fractal_painter.#colouring_methods = 
    [
      fractal_painter.#colour_by_iter,
      fractal_painter.#colour_by_arg,
      fractal_painter.#colour_by_mag,
      fractal_painter.#colour_by_log_iter
    ];
    fractal_painter.#current_colouring_idx = 0;// fractal_painter.#colouring_methods.length - 1;
    fractal_painter.reset_cache();
  }

  /**
   * Set everything to invalid at the start of a render.
   */
  static reset_cache()
  {
    /* Iteration cache. */
    fractal_painter.#iteration_cache = utils.make_array_of(utils.CANVAS_HEIGHT, 
                                       utils.make_array_of(utils.CANVAS_WIDTH, null));
    /* Escape number cache. */
    fractal_painter.#escape_number_cache = utils.make_array_of(utils.CANVAS_HEIGHT, 
                                           utils.make_array_of(utils.CANVAS_WIDTH, null));
  }

  static reset_iterations()
  {
    fractal_painter.#max_iterations = fractal_painter.#starting_max_iterations;
    text_display.set_iter_count(fractal_painter.#max_iterations);
  }

  static increase_iter()
  {
    fractal_painter.#max_iterations += fractal_painter.#iteration_step;
    text_display.set_iter_count(fractal_painter.#max_iterations);
  }

  static get_render_mode_name()
  {
    return `${fractal_painter.#colouring_methods[fractal_painter.#current_colouring_idx].name}`;
  }


  /**
   * Generates a rainbow by linearly overlapping channels.
   * @param {*} x 
   * @param {*} offset 
   * @returns 
   */
  static #to_rgb_value(x, offset)
  {
    return 255 * Math.max(0, Math.min(1, 0.5 + Math.sin(x + offset + fractal_painter.#angle_offset)));
  }

  /**
   * Gets a colour on a rainbow-scale for colouring the fractal as it interpolates.
   * @param {double} angle Value in [0-2pi].
   * @returns {rgba} The colour for angle.
   */
  static rainbow(angle)
  {
    //angle_cache.set_cache_elem_on_preset(angle);
    /* Full rainbow */
    return new rgba(fractal_painter.#to_rgb_value(angle, 0),
                    fractal_painter.#to_rgb_value(angle, fractal_painter.#pi2div3 ),
                    fractal_painter.#to_rgb_value(angle, fractal_painter.#pi2div3 * 2),
                    255);
                    
  }


  /* Colouring interfaces must have an argument to z and to the iterations of the current pixel. */
  
  /**
   * Get colour by the angle at which the number exits the escape radius.
   * @param {double} z 
   * @param {integer} iteration 
   * @returns {rgba}
   */
  static #colour_by_arg(z, iteration)
  {
    return fractal_painter.rainbow(z.arg());
  }

  /**
   * Get colour by the magnitude of the exit number.
   */
  static #colour_by_mag(z, iteration)
  {
    return fractal_painter.rainbow(Math.PI * 2 * (z.mag() / fractal_painter.#r));
  }

  /**
   * Get colour by proportion of iterations to the max.
   * @param {double} z 
   * @param {integer} iteration 
   * @returns {rgba}
   */
  static #colour_by_iter(z, iteration)
  {
    return fractal_painter.rainbow(Math.PI * 2 * (iteration / fractal_painter.#COLOUR_CYCLE_FREQUENCY));
  }

  static #colour_by_log_iter(z, iteration)
  {
    return fractal_painter.rainbow((Math.PI * (Math.log10((iteration + fractal_painter.#COLOUR_CYCLE_FREQUENCY) 
                                                          / (fractal_painter.#COLOUR_CYCLE_FREQUENCY + 1)))));
  }

  /**
   * Get colour by the current colour choice method.
   * @param {double} z 
   * @param {integer} iteration 
   */
  static get_colour(z, iteration)
  {
    const col = fractal_painter.#colouring_methods[fractal_painter.#current_colouring_idx](z, iteration);
    if(iteration === fractal_painter.#max_iterations)
    {
      col.r = 0;
      col.g = 0;
      col.b = 0;
    }
    return col;
  }

  /**
   * Cycle through the colouring methods.
   */
  static cycle_colour_method()
  {
    if((fractal_painter.#current_colouring_idx + 1) >= fractal_painter.#colouring_methods.length)
    {
      fractal_painter.#current_colouring_idx = 0;
    }
    else
    {
      fractal_painter.#current_colouring_idx++;
    }
  }

  /**
   * 
   * @param {integer} px_x       between 0 and 1 - maximum x value
   * @param {integer} px_y       between 0 and 1 - maximum y value
   * @param {boolean} use_cache  Allows the function to draw on pre-computed iteration values. 
   * @param {boolean} process_pixel Allows the function to compute the colour of a pixel. If it does not exist in 
   *                                the cache already it is returned black.
   * @returns {rgba} The colour for this pixel.
   */
  static paint(px_x, px_y, use_cache = true, process_pixel = true)
  {
    const iter_cache_val = fractal_painter.#iteration_cache[px_y][px_x];
    const enum_cache_val = fractal_painter.#escape_number_cache[px_y][px_x];
    /* Lookup to see if it exists in the cache already, and is not max iterations. */
    if(   (iter_cache_val !== null) 
       && use_cache
       && (iter_cache_val < fractal_painter.#max_iterations))
    {
      return fractal_painter.get_colour(enum_cache_val, iter_cache_val);
    }
    else if(!process_pixel)
    {
      return fractal_painter.#BLACK;
    }

    /* Centre pixel on canvas origin. */
    const x_centred = px_x - utils.CANVAS_WIDTH / 2;
    const y_centred = px_y - utils.CANVAS_HEIGHT / 2;
    
    /* Scale down so maximum coordinate value is r or less. */
    let z = new complex((x_centred / fractal_painter.#canvas_radius) * fractal_painter.#r, 
                        (y_centred / fractal_painter.#canvas_radius) * fractal_painter.#r);

    z.scale(fractal_painter.#zoom_factor).sub(fractal_painter.#pan_offset);
    
    let iteration = 0;

    while((z.mag2() < (fractal_painter.#r * fractal_painter.#r)) && (iteration < fractal_painter.#max_iterations))
    {
      z.mul(z).add(fractal_painter.#c);

      iteration++;
    }
    
    fractal_painter.#iteration_cache[px_y][px_x] = iteration;
    fractal_painter.#escape_number_cache[px_y][px_x] = z;    

    const pixel_colour = fractal_painter.get_colour(z, iteration);

    return pixel_colour;
  }

  /**
   * Set c in f(z) = z^2 + c
   * @param {complex} c 
   */
  static set_c(c)
  {
    fractal_painter.#c = c;
    fractal_painter.#r = 0.5 + Math.sqrt(0.25 + c.mag());
  }

  static get_c()
  {
    return new complex(fractal_painter.#c.a, fractal_painter.#c.b);
  }

  /**
   * Set the zoom.
   * @param {double} k Zoom factor.
   */
  static zoom_by(k)
  {
    fractal_painter.#zoom_factor += (k * fractal_painter.#zoom_factor);
  }

  /**
   * Move the pan.
   * @param {complex} z Added to the current pan value.
   */
  static pan_by(z)
  {
    fractal_painter.#pan_offset.add(z.scale(fractal_painter.#zoom_factor));
  }

  static get_iteration_cache_at(x, y)
  {
    return fractal_painter.#iteration_cache[y][x];
  }

  static clear_iter_cache_at(x, y)
  {
    fractal_painter.#iteration_cache[y][x] = null;
  }

  /**
   * Returns true if the pixel at x, y is max iterations in iteration cache.
   * @param {*} x 
   * @param {*} y 
   * @returns boolean
   */
  static is_iteration_cache_solved_at(x, y)
  {
    return fractal_painter.#iteration_cache[y][x] < fractal_painter.#max_iterations;
  }

  /**
   * Returns if a pixel has been rendered.
   * @param {*} x 
   * @param {*} y 
   */
  static is_cache_null_at(x, y)
  {
    return fractal_painter.#iteration_cache[y][x] === null;
  }

  static get_max_iterations()
  {
    return fractal_painter.#max_iterations;
  }

  static set_max_iterations(n)
  {
    fractal_painter.#max_iterations = n;
  }
}
