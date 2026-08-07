/**
 * @brief Collects all tests, to be run only by main.js to prevent startup on test failure.
 */


/**
 * Collection of every test group.
 */
function run_all_tests()
{
  /* 
   * Logical and of all test groups, e.g.
   * 
   * return maths_test_group.test() 
   *     && pointer_lock_test_group.test();
   */
  return pointer_lock_test_group.test()
      && maths_test_group.test()
      && coord_test_group.test()
         /* Next test case */
      && true; 
}