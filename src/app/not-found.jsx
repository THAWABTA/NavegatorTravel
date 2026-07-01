import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 font-sans antialiased">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-5xl font-light tracking-wide uppercase">
            Destination Unknown
          </h2>
          <p className="text-gray-400 text-sm md:text-base font-light tracking-wide">
            The page you are looking for has departed or does not exist.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            href="/"
            className="px-8 py-3 bg-white text-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors duration-300 w-full sm:w-auto"
          >
            Back to Home
          </Link>
          <Link
            href="/destinations"
            className="px-8 py-3 border border-gray-600 text-white text-sm uppercase tracking-widest hover:border-white transition-colors duration-300 w-full sm:w-auto"
          >
            View Destinations
          </Link>
        </div>
      </div>
    </div>
  );
}
