import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center h-screen text-center">
      <div className="flex flex-col space-y-4">
        <h1 className="text-5xl font-bold">
          Welcome to <span>DI Foundation</span> DAO
        </h1>
        <p className="mt-4 text-lg">
          A decentralized lending and staking platform.
        </p>
        <div className="flex space-x-4 justify-center">
          <button className="mt-6 px-6 py-3 bg-purple-700 text-white rounded-lg shadow-lg hover:bg-purple-800 transition">
            Get Started
          </button>
          <button className="mt-6 px-6 py-3 bg-purple-700 text-white rounded-lg shadow-lg hover:bg-purple-800 transition">
            Learn More
          </button>
        </div>
      </div>
      <Image
        src="/tan.jpg"
        alt="Hero Image"
        width={600}
        height={400}
        className="mt-8 rounded-lg shadow-lg"
      />
    </section>
  );
}
