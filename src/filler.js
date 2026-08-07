/**
 * Progressively render the fractal from the outside-in.
 */
class filler
{
  /**
   * The coordinates of the pixels adjacent to those just rendered which are black, and so need to be rendered. 
   * The pixels are stored in these sets in serialised form.
   */
  #render_list_a;  
  #render_list_b;

  /* The serialised pixels that draw the boundary around unsolved regions. */
  #unsolved_perimeter;

  #render_lists;
  #current_render_list;

  #solution_found = false;

  #unsolved_count = 0;
  #NUM_RENDER_LISTS = 2;
  #MAX_X_IDX = utils.CANVAS_WIDTH - 1;
  #MAX_Y_IDX = utils.CANVAS_HEIGHT - 1;
  #WHITE     = new rgba(255, 255, 255, 255);

  constructor()
  {
    /* Start as the perimeter of the screen. Add perimeter pixels in clockwise order. */
    this.#render_list_a = new Set();
    this.#render_list_b = new Set();
    this.#unsolved_perimeter = new Set();
    this.#current_render_list = 0;
    this.#render_lists = [this.#render_list_a, this.#render_list_b];

    this.initialise_render_lists();
  }

  #curr_idx()
  {
    return this.#current_render_list % this.#NUM_RENDER_LISTS;
  }

  #next_idx()
  {
    return (this.#curr_idx() + 1) % this.#NUM_RENDER_LISTS;
  }

  #curr_add(x, y)
  {
    this.#render_lists[this.#curr_idx()].add(coord.serialise_x_y(x, y));
  }
  
  #swap_render_lists()
  {
    this.#render_lists[this.#curr_idx()].clear();
    this.#current_render_list++;
  }

  #next_add(x, y)
  {
    this.#render_lists[this.#next_idx()].add(coord.serialise_x_y(x, y));
  }
  
  /**
   * Render a cycle of pixels on the fill border.
   */ 
  render_one_cycle()
  {
    /* Iterate over the set. */
    this.#render_lists[this.#curr_idx()].forEach((serial_coord) =>
    {
      const x = coord.x_from_serialised(serial_coord);
      const y = coord.y_from_serialised(serial_coord);
      const use_cache = this.#unsolved_perimeter.has(serial_coord);
      utils.set_pixel_by_x_y(x, y, fractal_painter.paint(x, y, use_cache));

      if(use_cache)
        this.#unsolved_perimeter.delete(serial_coord);

      const x_w = x - 1;
      const x_e = x + 1;
      const y_n = y - 1;
      const y_s = y + 1;

      if(fractal_painter.is_iteration_cache_solved_at(x, y))
      {
        this.#solution_found = true;
        /* North pixel. */
        if((y_n > 0) && fractal_painter.is_cache_null_at(x, y_n))
        {
          this.#next_add(x, y_n);
        }
        /* South pixel. */
        if((y_s < this.#MAX_Y_IDX) && fractal_painter.is_cache_null_at(x, y_s))
        {
          this.#next_add(x, y_s);
        }
        /* East pixel. */
        if((x_e < this.#MAX_X_IDX) && fractal_painter.is_cache_null_at(x_e, y))
        {
          this.#next_add(x_e, y);
        }
        /* West pixel. */
        if((x_w > 0) && fractal_painter.is_cache_null_at(x_w, y))
        {
          this.#next_add(x_w, y);
        }
      }
      /* The pixel hit max iterations so it's unsolved. */
      else
      {
        this.#unsolved_perimeter.add(serial_coord);
        //utils.set_pixel_by_x_y(x, y, this.#WHITE);
      }
    });

    /*
    this.#render_lists[this.#next_idx()].forEach((serial_coord) => utils.set_pixel_by_x_y(coord.x_from_serialised(serial_coord), 
                                                                                          coord.y_from_serialised(serial_coord), 
                                                                                          this.#WHITE));
                                                                                          */
    
    this.#swap_render_lists();
  }

  /**
   * Clear both render lists;
   */
  #clear_render_lists()
  {
    this.#swap_render_lists();
    this.#swap_render_lists();
  }

  is_render_list_empty()
  {
    /* This can be true even if there is no black in the image; pixels arent added if they have an iteration count. */
    return this.#render_lists[this.#curr_idx()].size === 0;
  }

  is_unsolved_list_empty()
  {
    return this.#unsolved_perimeter.size === 0;
  }

  /**
   * Draw where the unsolved perimeter is in white.
   */
  render_unsolved_perimeter()
  {
    this.#unsolved_perimeter.forEach((serial_coord) =>
    {
      utils.set_pixel_by_x_y(coord.x_from_serialised(serial_coord), 
                             coord.y_from_serialised(serial_coord), 
                             this.#WHITE);
    });
  }

  get_coords_in_unsolved_perimeter()
  {
    const coord_list = [];
    this.#unsolved_perimeter.forEach((serial_coord) => coord_list.push(coord.from_serialised(serial_coord)));

    return coord_list;
  }

  /**
   * Assign the current render list to the unsolved perimeter. This will only progress if iterations has increased since
   * unsolved perimeter was set, else it will conclude in the first iteration.
   */
  initialise_render_lists_from_unsolved()
  {
    let unsolved_this_round = 0;

    this.#clear_render_lists();
    this.#unsolved_perimeter.forEach((serial_coord) => 
    {
      unsolved_this_round++;
      this.#render_lists[this.#curr_idx()].add(serial_coord);
    });
    this.#unsolved_perimeter.clear();
    /* Render until it makes no difference.*/ 
    if((this.#unsolved_count === unsolved_this_round) && this.#solution_found)
    {
      /* Cancel render restart, set program to idle in mainloop. */
      this.#clear_render_lists();
    }
    this.#unsolved_count = unsolved_this_round;

  }
 
  initialise_render_lists()
  {
    this.#clear_render_lists();
    this.#unsolved_perimeter.clear();

    for(let i = 0; i < this.#MAX_X_IDX; i++)
    {
      this.#curr_add(i, 0);
    }
    for(let i = 0; i < this.#MAX_Y_IDX; i++)
    {
      this.#curr_add(this.#MAX_X_IDX, i);
    }
    for(let i = this.#MAX_X_IDX; i > 0; i--)
    {
      this.#curr_add(i, this.#MAX_Y_IDX);
    }
    for(let i = this.#MAX_Y_IDX; i > 0; i--)
    {
      this.#curr_add(0, i);
    }

    /* Flag to assert that at least one pixel was rendered the previous round. */
    this.#solution_found = false;
  }
}