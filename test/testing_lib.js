/**
 * @brief Tiny testing library.
 */


/**
 * Test that a value is true.
 */
function assert(is_true)
{
  if(!is_true)
  {
    throw new Error(`assert: required true, provided false.`);
  }
}


/**
 * Test that two values are 'equal' (in a javascript sense).
 */
function assert_eq(expected, actual)
{
  if(expected !== actual)
  {
    throw new Error(`assert_eq: expected '${expected}', but was '${actual}'.`);
  }
}

/**
 * Test that a list of arguments are all equal to a single value.
 */
function assert_all_eq(expected, ...actual)
{
  if(actual.length === 0)
  {
    throw new Error(`assert_all_eq: no 'actual' arguments provided, variadic length zero.`)
  }

  for(let i = 0; i < actual.length; i++)
  {
    if(expected !== actual[i])
    {
      throw new Error(`assert_all_eq [iteration ${i}]: expected '${expected}', but was '${actual[i]}'.`);
    }
  }
}

/**
 * Assert a list of items is equal to another
 */
function assert_xs_eq(expected, actual)
{
  if(expected.length === undefined || actual.length === undefined)
  {
    throw new Error(`assert_xs_eq: expected and actual do not both have a 'length' property; they are not both lists.`);
  }
  if(expected.length !== actual.length)
  {
    throw new Error(`assert_xs_eq: expected and actual are of different lengths, expected to be ${expected.length}\
elements, but was ${actual.length} elements.`);
  }

  for(let i = 0; i < expected.length; i++)
  {
    if(expected[i] !== actual[i])
    {
      throw new Error(`assert_xs_eq [iteration ${i}]: expected '${expected[i]}, but was '${actual[i]}'.`)
    }
  }
}

/**
 * Unit failure.
 */
function assert_fail()
{
  throw new Error(`assert_fail`);
}

/**
 * Collect function pointers to test definitions, and run them in sequence catching and reporting failures.
 */
class test_runner
{
  #tests;
  #count;

  static _typestr = () => `test_runner`;

  constructor(...test)
  {
    this.#tests = test;
    this.#count = test.length;
  }

  type()
  {
    return _typestr();
  }

  /**
   * Returns the name of the function from the test function pointer.
   * @param {*} fp  Test function pointer.
   * @returns Returns the function name.
   */
  test_name(fp)
  {
    const function_str  = `${fp}`;
    const function_name = function_str.split(' ')[1].split('(')[0];
    
    /* function_name must be defined. */
    if(function_name === undefined)
    {
      throw new Error(`test_runner: test_name: 'fp' does not have enough tokens, is this a function pointer?`);
    }

    return function_name;
  }

  /**
   * Runs a test group and prints the results to the JS console. 
   * 
   * @returns returns false if there were any failures.
   *                  true if there were no failues.
   */
  test()
  {
    let test_number;
    let successes = 0;
    let failure_list = [];

    for(let i = 0; i < this.#count; i++)
    {
      test_number = i + 1;
      console.log(`[${test_number}/${this.#count}] '${this.test_name(this.#tests[i])}'`);
      
      /* Wrap tests so we can run them all. */
      try
      {
        this.#tests[i]();
        successes++;
      }
      catch(err)
      {
        console.log(`test_runner.test: test ${test_number} FAILED: ${err.message}`);
        failure_list.push(this.test_name(this.#tests[i]));
      }
    }

    /* Build one log entry of failures. */
    let failure_text = ``;
    if(failure_list.length > 0)
    {
      failure_text = `${failure_text}the following tests failed:`;
    }

    for(let i = 0; i < failure_list.length; i++)
    {
      failure_text = `${failure_text}\n\t ${failure_list[i]}`;
    }
    
    /* Output results. */
    console.log(`PASSED ${successes} \t FAILED ${this.#count - successes} \n${failure_text}`);
    
    return (this.#count - successes) === 0;
  }
}