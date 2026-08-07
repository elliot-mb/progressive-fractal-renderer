
/**
 * Set event listeners and report control status.
 */
class key_handler
{
  #keys_to_track;
  #key_statuses;

  constructor()
  {
    this.#keys_to_track = ['w', 
                           's', 
                           'a', 
                           'd', 
                           'f', /* Down. */ 
                           'r'    /* Up. */
                          ];
    this.#key_statuses  = this.#keys_to_track.map(key => 0);

    this.set_key_listeners();
  }



  set_key_listeners()
  {
    document.addEventListener('keydown', (event) => this.handle_key(event, true));
    document.addEventListener('keyup',   (event) => this.handle_key(event, false));
  }



  /**
   * Handle a key down event. Check all the tracked keys.
   * @param {*} event 
   */
  handle_key(event, is_down){
    for(let i = 0; i < this.#keys_to_track.length; i++)
    {
      const key_code = this.#keys_to_track[i];
      
      if(event.key === key_code)
      {
        /* Zero is unpressed, one is pressed. */
        this.#key_statuses[i] = is_down ? 1 : 0;
        /* Exit the loop. */
        i =                     this.#keys_to_track.length;
      }
    }
  }



  /**
   * Request whether a key is pressed (will return false if it is not tracked).
   * @param {*} key the key label, e.g. 'a' for the a key.
   */
  get_key_pressed(key)
  {
    /* Unpressed by default. */
    let status = 0;

    for(let i = 0; i < this.#keys_to_track.length; i++)
    {
      const key_code = this.#keys_to_track[i];

      if(key_code === key)
      {
        status = this.#key_statuses[i];
        /* Exit the loop. */
        i      = this.#keys_to_track.length;
      }
    } 

    return status;
  }
}