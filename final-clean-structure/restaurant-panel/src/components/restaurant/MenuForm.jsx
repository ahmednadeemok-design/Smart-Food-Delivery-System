import { useState } from "react";

export default function MenuForm({ onSubmit }) {
  const [form, setForm] = useState({
    restaurantId: "",
    name: "",
    description: "",
    price: "",
    category: "",
    calories: "",
    tags: "",
  });

  const update = (key, value) => setForm({ ...form, [key]: value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      restaurantId: form.restaurantId,
      payload: {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        calories: Number(form.calories || 0),
        tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
      },
    });
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h3>Add Food Item</h3>
      <input className="input" placeholder="Restaurant ID" value={form.restaurantId} onChange={(e) => update("restaurantId", e.target.value)} />
      <input className="input" placeholder="Food Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
      <textarea rows="3" placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />
      <input className="input" type="number" placeholder="Price" value={form.price} onChange={(e) => update("price", e.target.value)} />
      <input className="input" placeholder="Category" value={form.category} onChange={(e) => update("category", e.target.value)} />
      <input className="input" type="number" placeholder="Calories" value={form.calories} onChange={(e) => update("calories", e.target.value)} />
      <input className="input" placeholder="Tags: dinner, diet, spicy" value={form.tags} onChange={(e) => update("tags", e.target.value)} />
      <button className="btn">Add Item</button>
    </form>
  );
}
