import { Header, Footer, Loader } from "@/components";

export default function Home() {
  return (
    <div>
      <div className="flex flex-col w-full justify-center items-center my-5 gap-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff6164] to-[#e8000f] inline-block text-transparent bg-clip-text">Keposhka</h1>
      </div>
      <div className="border-b border-red-500/20"></div>
      <Loader />
      <Header />
      <Footer />
    </div>
  );
}
