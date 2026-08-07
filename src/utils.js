/**
 * Utilities.
 */
class utils
{
  static canvas          = document.getElementById('canvas'); 
  static ctx             = utils.canvas.getContext('2d'); 
  static CANVAS_WIDTH    = utils.canvas.width;
  static CANVAS_HEIGHT   = utils.canvas.height;
  static canvas_img      = utils.ctx.getImageData(0, 0, utils.CANVAS_WIDTH, utils.CANVAS_HEIGHT);
  static canvas_channels = utils.canvas_img.data;
  static CHAN_PER_PIXEL     = 4;
  /**
   * Greatest common denominator (recursive)
   * @param {integer} a 
   * @param {integer} b 
   * @returns {integer} Greatest common denominator
   */
  static gcd(a, b)
  {
    if(b === 0)
    {
      return a;
    }

    return utils.gcd(b, a % b);
  }

  static make_array_of(n, things)
  {
    const temp_array = Array.from(Array(n).keys());
    for(let i = 0; i < temp_array.length; i++)
    {
      temp_array[i] = JSON.parse(JSON.stringify(things));
    }
    return temp_array;
  }

  static channel_idx_to_x_y(idx, chan_per_px, canvas_width)
  {
    const px_idx = (idx / chan_per_px);
    const x      = px_idx % canvas_width;
    const y      = Math.floor(px_idx / canvas_width);
    return new complex(x, y);
  }

  static set_pixel(channel_idx, colour)
  {
    utils.canvas_channels[channel_idx] = colour.r;
    utils.canvas_channels[channel_idx+1] = colour.g;
    utils.canvas_channels[channel_idx+2] = colour.b;
    utils.canvas_channels[channel_idx+3] = colour.a;   
  }

  static set_pixel_by_x_y(x, y, colour)
  {
    const channel_idx = ((y * utils.CANVAS_WIDTH) + x % utils.CANVAS_WIDTH) * utils.CHAN_PER_PIXEL;
    utils.set_pixel(channel_idx, colour);
  }

  static clear_pixels()
  {
    const clear_col = new rgba(0, 0, 0, 255);

    for(let i = 0; i < utils.canvas_channels.length; i+=utils.CHAN_PER_PIXEL)
    {
      utils.set_pixel(i, clear_col);
    }

    utils.update_pixels();
  }

  static update_pixels()
  {
    utils.ctx.putImageData(utils.canvas_img, 0, 0);
  }
}