
function serialise_coord()
{
  const c = new coord(10, 20);
  assert_eq(100020, c.serialise());
}

function serialise_max()
{
  const c = new coord(9999, 9999);
  assert_eq(99999999, c.serialise());
}

function serialise_min()
{
  const c = new coord(0, 0);
  assert_eq(0, c.serialise());
}

function serialise_from_x_y()
{
  assert_eq(33004100, coord.serialise_x_y(3300, 4100));
}

function deserialise_coord()
{
  const c = new coord(10, 25);
  const val = c.serialise();
  assert_eq(10, coord.x_from_serialised(val));
  assert_eq(25, coord.y_from_serialised(val));
}

function deserialise_x_y()
{
  const val = coord.serialise_x_y(1023, 1559);
  assert_eq(1023, coord.x_from_serialised(val));
  assert_eq(1559, coord.y_from_serialised(val));
}

const coord_test_group = new test_runner(serialise_coord,
                                         serialise_max,
                                         serialise_min,
                                         serialise_from_x_y,
                                         deserialise_coord,
                                         deserialise_x_y
);