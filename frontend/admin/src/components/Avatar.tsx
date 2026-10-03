import { useState } from "react";
export default function Avatar({
  name,
  image,
  large = false,
}: {
  name: string;
  image?: string | null;
  large?: boolean;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-soft font-semibold text-forest-deep ring-2 ring-white ${large ? "h-24 w-24 text-3xl" : "h-10 w-10 text-sm"}`}
    >
      {image && image !== failedImage ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedImage(image)}
        />
      ) : (
        name.trim().slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
