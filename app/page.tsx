import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className=" p-24">
      <Nav />
      <section className="py-12 flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold">Shadcn is awesome</h1>
        <p className="text-2xl text-muted-foreground">
          Hand-picked themes that you can copy and paste
        </p>
      </section>
      <div className="flex gap-6 items-center justify-center">
        <Button variant={"secondary"}>Learn more</Button>
        <Button>Enroll Now</Button>
      </div>
    </main>
  );
}
