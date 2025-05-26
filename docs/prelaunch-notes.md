after confirmation email users are being redirected to the homepage this needs to be fixed so that they can be redirected to their dashboard once the user role has been defined

make sure the admin dashboard shows the washers that have registered theri interest.

tests

check the user/washer accounts work
-passwordhide/show icon is there

check the dashbaords are didfferent

washer dashbaord
-register interest is working

washer/user/admin
when building the admin view, you'd perform a database query that joins these tables based on the user_id. This would give you a complete picture: the washer's name, email, other account info, the postcode/area they registered interest for, and when they registered.
