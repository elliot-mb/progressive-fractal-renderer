/**
 * Test file for pointer-lock functionality check.
 */

function browser_has_pointer_lock()
{
  const has_pointer_lock = 'pointerLockElement' in document 
                           || 'mozPointerLockElement' in document 
                           || 'webkitPointerLockElement' in document;
  assert(has_pointer_lock);
}



const pointer_lock_test_group = new test_runner(browser_has_pointer_lock);