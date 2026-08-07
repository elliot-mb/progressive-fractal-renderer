/**
 * Static class. Functions of the stop button.
 */
class text_display
{
  static #elem = document.getElementById('stop-button');

  static #stopped = false;

  static #render_mode = '';

  static #is_idle = false;

  static #iter_count = 0;

  static #frame_id = 0;

  static #spinner_frames = "\\|/-";

  static #spinner_frame_num = text_display.#spinner_frames.length;

  static #set_running_text()
  {
    if(!text_display.#stopped)
    {
      text_display.#elem.textContent = `[click to stop] `+
                                        `render mode '${text_display.#render_mode}' ` +
                                        `${text_display.#iter_count} iterations ` +
                                        `${text_display.#is_idle 
                                        ? 'idle'
                                        : text_display.#spinner_frames[
                                        text_display.#frame_id % text_display.#spinner_frame_num
                                      ]}`;
    }
  }

  static start_error()
  {
    text_display.#elem.textContent = 'failed to start because some tests failed; check the console';
    text_display.#stopped = true;
  }

  static stop()
  {
    text_display.#elem.textContent = `stopped; rendered ${text_display.#frame_id} frames`;
    text_display.#stopped = true;
  }

  static register_frame()
  {
    text_display.#frame_id++;
    text_display.#set_running_text();
  }

  static get_is_stopped()
  {
    return text_display.#stopped;
  }

  static get_frame_id()
  {
    return text_display.#frame_id;
  }

  static set_render_mode(name)
  {
    text_display.#render_mode = name;
  }

  static set_idle()
  {
    text_display.#is_idle = true;
  }

  static set_active()
  {
    text_display.#is_idle = false;
  }

  static set_iter_count(iter_count)
  {
    text_display.#iter_count = iter_count;
  }
}
