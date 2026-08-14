/**
 * Assign css variables according to the query params ?resolution=<width>_<height>.
 */

class viewport_manager
{
  #params;
  static #RESOLUTION_PARAM  = `resolution`;
  static #RATIO_WIDTH_PROP  = `--ratio-width`;
  static #RATIO_HEIGHT_PROP = `--ratio-height`;
  static #WIDTH_HEIGHT_SEP  = `_`;
  static #STYLESHEET        = document.documentElement.style;
  static #CANVAS            = document.getElementById('canvas');

  constructor()
  {
    this.#params = new URLSearchParams(window.location.search);
  }

  #get(param)
  {
    const value = this.#params.get(param);
    if(!value)
    {
      throw new Error(`param '${param}' is undefined or null`);
    }

    return value;
  }

  set_canvas_and_css()
  {
    const width_height_prop = this.#get(viewport_manager.#RESOLUTION_PARAM);
    const width_height_list = width_height_prop.split(viewport_manager.#WIDTH_HEIGHT_SEP);
    const width             = width_height_list[0];
    const height            = width_height_list[1];
    viewport_manager.#STYLESHEET.setProperty(viewport_manager.#RATIO_WIDTH_PROP, width);
    viewport_manager.#STYLESHEET.setProperty(viewport_manager.#RATIO_HEIGHT_PROP, height);
    viewport_manager.#CANVAS.setAttribute('width', width);
    viewport_manager.#CANVAS.setAttribute('height', height);
  }
}

/** Actually assign the canvas size and css values. */
const assigner = new viewport_manager();

assigner.set_canvas_and_css();