import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-8xl font-bold mb-4">404</h1>
      <p className="text-gray-400 text-lg mb-6">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#60E8C8] text-black text-lg rounded hover:bg-teal-400 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
