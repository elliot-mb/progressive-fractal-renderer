
/**
 * Capture pointer and lock it to the canvas.
 */
class cursor_handler
{
  #canvas;
  #is_cursor_locked;
  /* Cursor velocity. */
  #cursor_x;
  #cursor_y;
  #is_mouse_down;

  /* Set velocity zero after certain lack of mouse updates. */
  #no_movement_timer = 0;

  /* ms. */
  static #no_movement_timeout = () => 1;

  constructor(lock_cursor)
  {
    this.#is_cursor_locked = false;
    this.#is_mouse_down    = false;
    this.#canvas           = document.getElementById('canvas');
                                          
    document.addEventListener('mousemove', this.#pointer_move.bind(this), true);
    document.addEventListener('mousedown', () => {this.#is_mouse_down = true;}, true);
    document.addEventListener('mouseup', () => {this.#is_mouse_down = false;}, true);

    /* Just if we want to take the cursor do we need to set lock listeners. */
    if(lock_cursor)
    {
      this.#canvas.requestPointerLock = this.#canvas.requestPointerLock ||
                                        this.#canvas.mozRequestPointerLock ||
                                        this.#canvas.webkitRequestPointerLock;

      document.exitPointerLock = document.exitPointerLock ||
                                            document.mozExitPointerLock ||
                                            document.webkitExitPointerLock;    
      this.set_cursor_lock_listeners();
    }
  }

  set_cursor_lock_listeners()
  {
    this.#canvas.onclick = this.request_pointer_lock.bind(this);

    document.addEventListener('pointerlockchange', this.#pointer_lock_change.bind(this), false);
    document.addEventListener('mospointerlockchange', this.#pointer_lock_change.bind(this), false);
    document.addEventListener('webkitpointerlockchange', this.#pointer_lock_change.bind(this), false);
    

  }

  request_pointer_lock()
  {
    //this.#canvas.onclick = undefined;

    /* Ask browser to lock pointer. */
    this.#canvas.requestPointerLock();
  }

  request_pointer_unlock()
  {
    /* Ask the browser to release the pointer. */
    document.exitPointerLock();
  }

  /**
   * Check if the pointer has just been locked or unlocked.
   */
  #pointer_lock_change()
  {
    if(document.pointerLockElement === this.#canvas 
       || document.mozPointerLockElement === this.#canvas 
       || document.webkitPointerLockElement === this.#canvas)
    {
      document.addEventListener('mousemove', this.#pointer_move.bind(this), false);
      this.#is_cursor_locked = true;
    }
    /* Pointer was just unlocked, disable mousemove listener. */
    else
    {
      document.removeEventListener('mousemove', this.#pointer_move, false);
      this.request_pointer_unlock();
      this.#is_cursor_locked = false;
    }
  }



  get_is_cursor_locked()
  {
    return this.#is_cursor_locked;
  }



  /**
   * Extract relative mouse motion. 
   * @param {*} e mouse move event.
   */
  #pointer_move(e)
  {
    clearTimeout(this.#no_movement_timer);

    this.#cursor_x = e.movementX 
                     || e.mozMovementX 
                     || e.webkitMovementX 
                     || 0;
    this.#cursor_y = e.movementY 
                     || e.mozMovementY
                     || e.webkitMovementY
                     || 0;
    
    this.#no_movement_timer = setTimeout(this.clear_velocity.bind(this), cursor_handler.#no_movement_timeout());
  }



  get_is_mouse_down()
  {
    return this.#is_mouse_down;
  }


  clear_velocity()
  {
    this.#cursor_x = 0;
    this.#cursor_y = 0;
  }



  /**
   * 
   * @returns Cursor velocity as a pair of numbers, corresponding to x and y.
   */
  get_cursor_vel()
  {
    return [this.#cursor_x, this.#cursor_y];
  }
}