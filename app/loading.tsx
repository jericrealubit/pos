import SkeletonCard from "@/components/SkeletonCard";

const loading = () => {
  return (
    <div className="grid grid-cols-3 gap-8">
      {"abcdefg".split("").map((i) => {
        <SkeletonCard key={i} />;
      })}
    </div>
  );
};
export default loading;
