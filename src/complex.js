/**
 * Complex number class.
 */
class complex
{
  /* Real part. */
  a;
  /* Imaginary part. */
  b;

  constructor(_a = 0, _b = 0)
  {
    this.a  = _a;
    this.b = _b;
  }

  
  mag()
  {
    return Math.sqrt((this.a * this.a) + (this.b * this.b));
  }

  /**
   * Faster than returning the magnitude.
   * @returns Magnitude squared.
   */
  mag2()
  {
    return (this.a * this.a) + (this.b * this.b);
  }

  /**
   * Argument 
   * @returns arg(z) in the range 0 to 2pi.
   */
  arg()
  {
    return Math.atan2(this.b, this.a) + Math.PI;
  }

  /**
   * z1z2
   * @param {complex} z
   * @return {complex} This so we can chain operations.
   */
  mul(z)
  {
    /* General form for complex multiplication is (a + bi)(c + di) = (ac - bd + bci + adi) */
    const temp_a = (this.a * z.a) - (this.b * z.b); 
    this.b       = (this.b * z.a) + (this.a * z.b);
    /* this.b must be set based on the original value of a. */
    this.a = temp_a;
    return this;
  }

  /**
   * Scale this number by real k.
   * @param {double} k Factor.
   * @return {complex} This so we can chain operations. 
   */
  scale(k)
  {
    this.a *= k;
    this.b *= k;
    return this;
  }

  /**
   * z1 + z2
   * @param {complex} z 
   * @return {complex} This so we can chain operations.
   */
  add(z)
  {
    this.a = this.a + z.a, 
    this.b = this.b + z.b;
    return this;
  }

  /**
   * z1 - z2
   * @param {complex} z
   * @return {complex} This so we can chain operations.
   */
  sub(z)
  {
    this.a = this.a - z.a
    this.b = this.b - z.b;
    return this;
  }

  /**
   * ke^ia.
   * @param {double} a angle
   * @returns kcos(a) + iksin(a)
   */
  static exp(k, a)
  {
    return new complex(k * Math.cos(a), k * Math.sin(a));
  }
}