"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { X, Edit } from "lucide-react"

export default function PersonalizadaInput({ form, itemIndex }: { form: any, itemIndex: number }) {
  const item = form.watch("items")[itemIndex];
  const [localName, setLocalName] = useState(item?.customName || "");

  const syncToForm = () => {
    const currentItems = form.getValues("items");
    if (currentItems[itemIndex]) {
      currentItems[itemIndex].customName = localName;
      form.setValue("items", [...currentItems]);
    }
  };

  const removeItem = () => {
    const currentItems = form.getValues("items");
    currentItems.splice(itemIndex, 1);
    form.setValue("items", [...currentItems]);
  };

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
      <Edit className="h-5 w-5 text-amber-600 shrink-0" />
      <Input
        placeholder="NOMBRE DE LA PRÁCTICA PERSONALIZADA..."
        value={localName}
        onChange={(e) => setLocalName(e.target.value.toUpperCase())}
        onBlur={syncToForm}
        className="h-10 uppercase font-black border-2 border-amber-300 bg-white flex-1"
      />
      <button type="button" onClick={removeItem} className="shrink-0 text-red-400 hover:text-red-600 transition-colors p-1">
        <X size={18} />
      </button>
    </div>
  );
}
