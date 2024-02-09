import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Recipe {
  title: string;
  image: string;
  time: number;
  description: string;
  vegan: boolean;
  id: string;
}

const getRecipes = async (): Promise<Recipe[]> => {
  const result = await fetch("http://localhost:4000/recipes");
  return result.json();
};

export default async function Home() {
  const recipes = await getRecipes();

  return (
    <main className=" p-24">
      <Nav />
      <section className="py-12 flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold">Shadcn is awesome</h1>
        <p className="text-2xl text-muted-foreground">
          Hand-picked themes that you can copy and paste
        </p>
      </section>

      <div className="grid grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <div>
                <CardTitle>{recipe.title}</CardTitle>
                <CardDescription>{recipe.time} mins to cook.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p>{recipe.description}</p>
            </CardContent>
            <CardFooter>
              <button>View Recipe</button>
              {recipe.vegan && <p>Vegan!</p>}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex gap-6 items-center justify-center">
        <Button variant={"secondary"}>Learn more</Button>
        <Button>Enroll Now</Button>
      </div>
    </main>
  );
}
