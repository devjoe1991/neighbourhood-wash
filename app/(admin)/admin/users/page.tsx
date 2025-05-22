import React from 'react'

// TODO: Import components for displaying and managing users, e.g., UserTable, UserModal

// TODO: Define a type for the User object based on your Supabase schema
// type User = {
//   id: string;
//   email: string | undefined;
//   created_at: string;
//   last_sign_in_at?: string;
//   role?: string; // from user_metadata
//   is_verified?: boolean; // from user_metadata or a separate table
//   // ... other relevant fields
// };

// TODO: Fetch users from Supabase
// async function getUsers(): Promise<User[]> {
//   // const supabase = createServerActionClient(); // or appropriate server client
//   // const { data, error } = await supabase.auth.admin.listUsers(); // Example using admin API
//   // if (error) {
//   //   console.error('Error fetching users:', error);
//   //   return [];
//   // }
//   // Map data to User type, including metadata
//   return []; // Placeholder
// }

export default async function AdminUsersPage() {
  // const users = await getUsers();
  const users = [] // Placeholder

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-3xl font-bold text-gray-800 dark:text-white'>
          User Management
        </h1>
        {/* TODO: Add New User button if applicable, or other actions */}
        {/* <Button>Add New User</Button> */}
      </div>

      <p className='mb-4 text-gray-600 dark:text-gray-300'>
        View, edit, and manage user accounts on the platform.
      </p>

      {/* TODO: Implement User Table or List component */}
      {users.length > 0 ? (
        <div className='overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Email
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Role
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Joined
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300'
                >
                  Status
                </th>
                <th scope='col' className='relative px-6 py-3'>
                  <span className='sr-only'>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
              {/* {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {user.is_verified ? <span className='text-green-500'>Verified</span> : <span className='text-yellow-500'>Pending</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</a>
                     TODO: Add more actions like 'View Details', 'Suspend', 'Delete' 
                  </td>
                </tr>
              ))} */}
              <tr>
                <td
                  colSpan={5}
                  className='px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400'
                >
                  User data fetching and table display to be implemented.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className='rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800'>
          <p className='text-gray-500 dark:text-gray-400'>
            No users found or data not yet loaded.
          </p>
        </div>
      )}
    </div>
  )
}
