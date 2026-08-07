/* A pair of unsigned integers. */
class coord
{
  x; 
  y; 
  /* The maximum number of digits in x or y. Serialisation is only defined for integer coordinates. */
  static #SERIAL_DIGITS = 4;
  static #SERIAL_FACTOR = Math.pow(10, coord.#SERIAL_DIGITS);
  static #SERIAL_FACTOR_INVERSE = 1 / coord.#SERIAL_FACTOR;

  constructor(x = 0, y = 0)
  {
    this.x = x;
    this.y = y;
  }

  /**
   * 
   * @returns {number} x * (10 ^ SERIAL_DIGITS) + y
   */
  serialise()
  {
    return (this.x * coord.#SERIAL_FACTOR) + this.y;
  }

  /**
   * Serialise an x and y coordinate.
   * @param {*} x 
   * @param {*} y 
   */
  static serialise_x_y(x, y)
  {
    return (x * coord.#SERIAL_FACTOR) + y;
  }

  /**
   * Returns x coordinate from serialised coordinate.
   * @param {number} val  Serialised value.
   * @returns {number}    Decoded x coordinate.
   */
  static x_from_serialised(val)
  {
    return (val - (val % coord.#SERIAL_FACTOR)) * coord.#SERIAL_FACTOR_INVERSE;
  }

  /**
   * Returns y coordinate from serialised coordinate.
   * @param {*} val     Serialised value.
   * @returns {number}  Decoded y coordinate.
   */
  static y_from_serialised(val)
  {
    return val % coord.#SERIAL_FACTOR;
  }

  static from_serialised(val)
  {
    return new coord(coord.x_from_serialised(val), coord.y_from_serialised(val));
  }

}