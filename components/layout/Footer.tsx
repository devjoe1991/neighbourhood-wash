export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Neighbourhood Wash. All rights reserved.</p>
          <p className="mt-1">
            Your friendly neighbourhood laundry solution.
          </p>
        </div>
      </div>
    </footer>
  );
} 