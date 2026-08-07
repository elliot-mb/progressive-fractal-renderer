/**
 * Test file, write your unit tests here, e.g.
 * 
 * function test_maths_successful_add()
 * {
 *   let a = new vec4(1,2,3,4);
 *   let b = new vec4(4,3,2,1);
 *   a.add(b);
 *   assert_all_eq(5, a.x(), a.y(), a.z(), a.w());
 * }
 */

function complex_mul_a()
{
  const z1 = new complex(1, 1);
  const z1_sqr = z1.mul(z1);
  assert_eq(0, z1_sqr.a);
  assert_eq(2, z1_sqr.b);
}

function complex_mul_b()
{
  const z1 = new complex(2, 1);
  const z2 = new complex(-1, 5);
  const z1z2 = z1.mul(z2);
  assert_eq(-7, z1z2.a);
  assert_eq(9,  z1z2.b);
}

/* 
 * Define a test group for all the tests in for a unit, e.g.
 * const maths_test_group = new test_runner(test_maths_successful_add,
 *                                          test_maths_unsuccessful_add,
 *                                          test_maths_successful_mul,
 *                                          test_maths_successful_sub,
 *                                          test_maths_get_elem,
 *                                          test_maths_set_elem,
 *                                          test_maths_vec_mat_mul,
 *                                          test_maths_mat_copy,
 *                                          test_maths_mat_transpose,
 *                                          test_maths_mat_identity,
 *                                          test_maths_mat_mul,
 *                                          test_maths_mat_add);
 */

const maths_test_group = new test_runner(complex_mul_a,
                                         complex_mul_b
);