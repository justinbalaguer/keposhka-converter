import { Header, Footer, Loader } from "@/components";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-4">
      <Loader />
      <Header />
      <Footer />
    </main>
  );
}
