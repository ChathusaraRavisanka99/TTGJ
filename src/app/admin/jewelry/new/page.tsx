import { JewelryForm } from "@/components/admin/JewelryForm";

export default function NewJewelryPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Add Jewelry Piece</h1>
      <div className="mt-6">
        <JewelryForm />
      </div>
    </div>
  );
}
