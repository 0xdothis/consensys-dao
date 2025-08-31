import Image from "next/image";

export default function CustomImage() {
  return (
    <div>
      <Image
        src={"/tan.jpg"}
        alt={"Hero Image"}
        width={300}
        height={300}
        className="rounded-lg shadow-lg"
      />
      <Image
        src={"/tan.jpg"}
        alt={"Logo"}
        width={100}
        height={100}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
}
